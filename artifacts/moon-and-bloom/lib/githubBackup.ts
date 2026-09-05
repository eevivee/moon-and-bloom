import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { MoonData } from '@/context/MoonContext';

const SETTINGS_KEY = 'moon-and-bloom-github-backup-v1';
export const DEFAULT_BACKUP_REPOSITORY = 'moon-and-bloom-private-data';
const BACKUP_PATH = 'moon-and-bloom-backup.enc.json';
const PBKDF2_ITERATIONS = 250_000;

interface EncryptedPayload {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
  updatedAt: string;
}

export interface GitHubBackupSettings {
  owner: string;
  repository: string;
  encryptedToken: EncryptedPayload;
}

export interface GitHubBackupSession {
  owner: string;
  repository: string;
  token: string;
  passphrase: string;
}

const requireWebCrypto = () => {
  if (Platform.OS !== 'web' || !globalThis.crypto?.subtle) {
    throw new Error('Encrypted GitHub backup is available in the web app.');
  }
  return globalThis.crypto;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return globalThis.btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = globalThis.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const toArrayBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const deriveKey = async (passphrase: string, salt: Uint8Array) => {
  const crypto = requireWebCrypto();
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

const encryptText = async (value: string, passphrase: string): Promise<EncryptedPayload> => {
  const crypto = requireWebCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    new TextEncoder().encode(value),
  );
  return {
    version: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    updatedAt: new Date().toISOString(),
  };
};

const decryptText = async (payload: EncryptedPayload, passphrase: string) => {
  try {
    const crypto = requireWebCrypto();
    const key = await deriveKey(passphrase, base64ToBytes(payload.salt));
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(payload.iv)) },
      key,
      base64ToBytes(payload.ciphertext),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error('The passphrase is incorrect or the encrypted backup is damaged.');
  }
};

const encodeGitHubContent = (value: string) => bytesToBase64(new TextEncoder().encode(value));
const decodeGitHubContent = (value: string) => new TextDecoder().decode(base64ToBytes(value.replace(/\n/g, '')));

const githubRequest = async (session: Pick<GitHubBackupSession, 'token'>, path: string, init?: RequestInit) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${session.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { message?: string } | null;
    if (response.status === 401) throw new Error('GitHub did not accept that token.');
    if (response.status === 403) throw new Error('The token needs read and write access to repository contents.');
    if (response.status === 404) throw new Error('The private backup repository was not found or is not available to this token.');
    throw new Error(detail?.message || `GitHub request failed (${response.status}).`);
  }
  return response;
};

const repositoryPath = (owner: string, repository: string) =>
  `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;

const validateConnection = async (session: GitHubBackupSession) => {
  if (!/^[A-Za-z0-9-]+$/.test(session.owner)) throw new Error('Enter a valid GitHub username.');
  if (!/^[A-Za-z0-9._-]+$/.test(session.repository)) throw new Error('Enter a valid GitHub repository name.');
  const response = await githubRequest(session, repositoryPath(session.owner, session.repository));
  const repository = await response.json() as { private?: boolean };
  if (!repository.private) throw new Error('For your privacy, choose a private GitHub repository.');
};

export async function loadGitHubBackupSettings() {
  const saved = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as GitHubBackupSettings;
  } catch {
    return null;
  }
}

export async function connectGitHubBackup(input: {
  owner: string;
  repository: string;
  token: string;
  passphrase: string;
}): Promise<GitHubBackupSession> {
  const session = {
    owner: input.owner.trim(),
    repository: input.repository.trim(),
    token: input.token.trim(),
    passphrase: input.passphrase,
  };
  await validateConnection(session);
  return session;
}

export async function rememberGitHubBackup(session: GitHubBackupSession) {
  const settings: GitHubBackupSettings = {
    owner: session.owner,
    repository: session.repository,
    encryptedToken: await encryptText(session.token, session.passphrase),
  };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function unlockGitHubBackup(passphrase: string): Promise<GitHubBackupSession> {
  const settings = await loadGitHubBackupSettings();
  if (!settings) throw new Error('GitHub backup has not been connected on this browser.');
  const token = await decryptText(settings.encryptedToken, passphrase);
  const session = { owner: settings.owner, repository: settings.repository, token, passphrase };
  await validateConnection(session);
  return session;
}

export async function disconnectGitHubBackup() {
  await AsyncStorage.removeItem(SETTINGS_KEY);
}

export async function uploadGitHubBackup(session: GitHubBackupSession, data: MoonData) {
  const payload = await encryptText(JSON.stringify(data), session.passphrase);
  const path = `${repositoryPath(session.owner, session.repository)}/contents/${BACKUP_PATH}`;
  let sha: string | undefined;
  const current = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${session.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (current.ok) {
    const existing = await current.json() as { sha?: string };
    sha = existing.sha;
  } else if (current.status !== 404) {
    await githubRequest(session, path);
  }
  await githubRequest(session, path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Update encrypted Moon & Bloom backup ${payload.updatedAt}`,
      content: encodeGitHubContent(JSON.stringify(payload)),
      ...(sha ? { sha } : {}),
    }),
  });
  return payload.updatedAt;
}

export async function downloadGitHubBackup(session: GitHubBackupSession): Promise<{ data: MoonData; updatedAt: string }> {
  const path = `${repositoryPath(session.owner, session.repository)}/contents/${BACKUP_PATH}`;
  const response = await githubRequest(session, path);
  const file = await response.json() as { content?: string };
  if (!file.content) throw new Error('The encrypted GitHub backup file is empty.');
  const payload = JSON.parse(decodeGitHubContent(file.content)) as EncryptedPayload;
  if (payload.version !== 1 || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error('This is not a valid Moon & Bloom backup.');
  }
  const data = JSON.parse(await decryptText(payload, session.passphrase)) as MoonData;
  return { data, updatedAt: payload.updatedAt };
}