import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Share } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { daysBetween, formatDate, useMoon } from '@/context/MoonContext';
import { BrandBanner, BrandMark, Card, Metric, palette, PrimaryButton, Screen, SectionTitle } from '@/components/MoonUI';
import { YearAtAGlance } from '@/components/YearAtAGlance';
import {
  connectGitHubBackup,
  DEFAULT_BACKUP_REPOSITORY,
  disconnectGitHubBackup,
  downloadGitHubBackup,
  GitHubBackupSession,
  GitHubBackupSettings,
  loadGitHubBackupSettings,
  rememberGitHubBackup,
  unlockGitHubBackup,
  uploadGitHubBackup,
} from '@/lib/githubBackup';

type Panel = 'journal' | 'history' | 'insights' | 'github' | null;

export default function MoreScreen() {
  const { data, cycleDay, phase, averageCycle, averagePeriod, exportJSON, replaceData, clearAll } = useMoon();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [githubSession, setGitHubSession] = useState<GitHubBackupSession | null>(null);
  const [githubSync, setGitHubSync] = useState('GitHub backup is locked');
  const lastBackedUpData = useRef('');
  useEffect(() => {
    if (!githubSession) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastBackedUpData.current) return;
    setGitHubSync('Saving encrypted backup…');
    const timeout = setTimeout(() => {
      uploadGitHubBackup(githubSession, data)
        .then((updatedAt) => { lastBackedUpData.current = serialized; setGitHubSync(`Backed up ${new Date(updatedAt).toLocaleString()}`); })
        .catch((error: unknown) => setGitHubSync(error instanceof Error ? error.message : 'GitHub backup failed.'));
    }, 800);
    return () => clearTimeout(timeout);
  }, [data, githubSession]);
  const exportData = async () => { await Share.share({ title: 'Moon & Bloom data', message: exportJSON() }); };
  const importData = () => { try { replaceData(JSON.parse(importText)); setImportText(''); setShowImport(false); Alert.alert('Data restored', 'Your private journal is back on this device.'); } catch { Alert.alert('That file could not be read', 'Paste the JSON exported from Moon & Bloom and try again.'); } };
  const deleteData = () => Alert.alert('Delete all local data?', 'This removes your cycle history, notes, and cabinet from this device. This cannot be undone.', [{ text: 'Keep my data', style: 'cancel' }, { text: 'Delete everything', style: 'destructive', onPress: clearAll }]);
  const journalEntries = Object.values(data.logs)
    .filter((entry) => entry.note?.trim() || entry.flow !== 'None' || entry.mood.length || entry.symptoms.length)
    .sort((a, b) => b.date.localeCompare(a.date));
  const periodHistory = data.periodDays.slice().sort().reduce<Array<{ days: string[] }>>((groups, date) => {
    const current = groups[groups.length - 1];
    const previous = current?.days[current.days.length - 1];
    if (!current || !previous || daysBetween(previous, date) > 1) groups.push({ days: [date] });
    else current.days.push(date);
    return groups;
  }, []).reverse();
  const symptomCounts = Object.values(data.logs).flatMap((entry) => entry.symptoms).reduce<Record<string, number>>((counts, symptom) => ({ ...counts, [symptom]: (counts[symptom] ?? 0) + 1 }), {});
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const flowCounts = Object.values(data.logs).filter((entry) => entry.flow !== 'None').reduce<Record<string, number>>((counts, entry) => ({ ...counts, [entry.flow]: (counts[entry.flow] ?? 0) + 1 }), {});
  const commonFlow = Object.entries(flowCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return <Screen><ScrollView style={{ marginHorizontal: -20 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
     <BrandBanner><BrandMark /></BrandBanner>
    <SectionTitle eyebrow="Your private space" title="More" />
     <Card style={styles.privacyCard}><View style={styles.lock}><Ionicons name="lock-closed" size={19} color={palette.accentForeground} /></View><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Private by Design</Text><Text style={styles.privacyText}>Moon & Bloom does not keep an account or cloud database, so your entries stay in your current phone's browser storage. If you switch phones, use "Export my data" here, then "Import my data" on your new phone.</Text></View></Card>
     <SectionTitle eyebrow="My health and well-being" title="Your Journal" />
    <MenuRow icon="book-open" label="Journal" detail={journalEntries.length ? `${journalEntries.length} logged ${journalEntries.length === 1 ? 'day' : 'days'} to revisit` : 'Notes tied to your cycle days'} onPress={() => setActivePanel('journal')} />
    <MenuRow icon="clock" label="History" detail={periodHistory.length ? `${periodHistory.length} recorded ${periodHistory.length === 1 ? 'period' : 'periods'}` : 'Your cycle history will build here'} onPress={() => setActivePanel('history')} />
    <MenuRow icon="bar-chart-2" label="Insights" detail={topSymptoms.length ? 'Your most noticed patterns' : 'Personal observations, never diagnoses'} onPress={() => setActivePanel('insights')} />
    <SectionTitle eyebrow="Take it with you" title="Your data" />
    <MenuRow icon="github" label="Encrypted GitHub backup" detail={githubSession ? githubSync : 'Back up privately without a storage subscription'} onPress={() => setActivePanel('github')} />
    <MenuRow icon="upload" label="Export my data" detail="Create a portable JSON backup" onPress={exportData} />
    <MenuRow icon="download" label="Import my data" detail="Restore a previous backup" onPress={() => setShowImport(true)} />
    <Pressable onPress={deleteData} style={styles.deleteRow}><Feather name="trash-2" size={18} color={palette.destructive} /><View><Text style={styles.deleteLabel}>Delete all data</Text><Text style={styles.deleteDetail}>Clear this device and start fresh</Text></View></Pressable>
     <Text style={styles.version}>Moon & Bloom - A Private Wellness Journal</Text>
  </ScrollView>
  <Modal visible={!!activePanel} transparent animationType="slide" onRequestClose={() => setActivePanel(null)}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>YOUR PRIVATE RECORD</Text><Text style={styles.sheetTitle}>{activePanel === 'journal' ? 'Journal' : activePanel === 'history' ? 'History' : activePanel === 'github' ? 'GitHub backup' : 'Insights'}</Text></View><Pressable onPress={() => setActivePanel(null)} hitSlop={10}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
      {activePanel === 'journal' && <JournalPanel entries={journalEntries} />}
      {activePanel === 'history' && <HistoryPanel periods={periodHistory} periodDays={data.periodDays} logs={data.logs} lastPeriodStart={data.lastPeriodStart} typicalCycleLength={data.typicalCycleLength} periodLength={data.periodLength} />}
      {activePanel === 'insights' && <InsightsPanel averageCycle={averageCycle} averagePeriod={averagePeriod} cycleDay={cycleDay} phase={phase} loggedDays={Object.values(data.logs).length} noteCount={journalEntries.filter((entry) => !!entry.note?.trim()).length} commonFlow={commonFlow} topSymptoms={topSymptoms} />}
      {activePanel === 'github' && <GitHubBackupPanel data={data} replaceData={replaceData} session={githubSession} onSession={(session) => { lastBackedUpData.current = JSON.stringify(data); setGitHubSession(session); setGitHubSync('Unlocked for this session'); }} onDisconnect={() => { lastBackedUpData.current = ''; setGitHubSession(null); setGitHubSync('GitHub backup is locked'); }} />}
    </ScrollView>
  </View></View></Modal>
  <Modal visible={showImport} transparent animationType="slide" onRequestClose={() => setShowImport(false)}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Import your data</Text><Pressable onPress={() => setShowImport(false)}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View><Text style={styles.sheetText}>Paste the JSON backup you exported from Moon & Bloom. It stays on this device.</Text><TextInput value={importText} onChangeText={setImportText} multiline placeholder="{ ... }" placeholderTextColor={palette.mutedForeground} style={styles.importInput} /><PrimaryButton label="Restore journal" onPress={importData} icon="download" disabled={!importText.trim()} /></View></View></Modal>
  </Screen>;
}

function GitHubBackupPanel({ data, replaceData, session, onSession, onDisconnect }: {
  data: Parameters<typeof uploadGitHubBackup>[1];
  replaceData: (data: Parameters<typeof uploadGitHubBackup>[1]) => void;
  session: GitHubBackupSession | null;
  onSession: (session: GitHubBackupSession) => void;
  onDisconnect: () => void;
}) {
  const [settings, setSettings] = useState<GitHubBackupSettings | null>(null);
  const [owner, setOwner] = useState('');
  const [repository, setRepository] = useState(DEFAULT_BACKUP_REPOSITORY);
  const [token, setToken] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { void loadGitHubBackupSettings().then((saved) => { setSettings(saved); if (saved) { setOwner(saved.owner); setRepository(saved.repository); } }); }, []);

  if (Platform.OS !== 'web') return <Text style={styles.panelIntro}>Encrypted GitHub backup is available when you open Moon & Bloom as a web app. Your local entries still work normally here.</Text>;

  const validatePassphrase = () => {
    if (passphrase.length < 12) throw new Error('Use a passphrase with at least 12 characters.');
    if (!settings && passphrase !== confirmPassphrase) throw new Error('The passphrases do not match.');
  };

  const getSession = async () => {
    validatePassphrase();
    if (session && session.passphrase === passphrase) return session;
    return settings
      ? unlockGitHubBackup(passphrase)
      : connectGitHubBackup({ owner, repository, token, passphrase });
  };

  const connectAndBackup = async () => {
    setBusy(true); setMessage('');
    try {
      const nextSession = await getSession();
      await uploadGitHubBackup(nextSession, data);
      await rememberGitHubBackup(nextSession);
      const saved = await loadGitHubBackupSettings();
      setSettings(saved);
      setToken(''); setConfirmPassphrase('');
      onSession(nextSession);
      setMessage('Encrypted backup saved. Changes will back up automatically while this session stays unlocked.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save the GitHub backup.'); }
    finally { setBusy(false); }
  };

  const restore = async () => {
    let nextSession: GitHubBackupSession;
    try { nextSession = await getSession(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not unlock GitHub backup.'); return; }
    Alert.alert('Restore from GitHub?', 'This replaces the entries currently stored in this browser with your encrypted GitHub backup.', [
      { text: 'Keep local data', style: 'cancel' },
      { text: 'Restore backup', onPress: async () => {
        setBusy(true); setMessage('');
        try {
          const restored = await downloadGitHubBackup(nextSession);
          await rememberGitHubBackup(nextSession);
          replaceData(restored.data);
          const saved = await loadGitHubBackupSettings();
          setSettings(saved);
          setToken(''); setConfirmPassphrase('');
          onSession(nextSession);
          setMessage(`Restored the backup from ${new Date(restored.updatedAt).toLocaleString()}.`);
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not restore the GitHub backup.'); }
        finally { setBusy(false); }
      } },
    ]);
  };

  const disconnect = async () => {
    await disconnectGitHubBackup();
    setSettings(null); setOwner(''); setRepository(DEFAULT_BACKUP_REPOSITORY); setToken(''); setPassphrase(''); setConfirmPassphrase(''); setMessage('This browser no longer remembers the GitHub connection. The encrypted backup remains in GitHub.');
    onDisconnect();
  };

  return <View>
    <Text style={styles.panelIntro}>Your health data is encrypted in this browser before it is uploaded. The passphrase is never saved or sent to GitHub.</Text>
    {settings ? <Card style={styles.backupStatus}><Text style={styles.backupStatusLabel}>CONNECTED REPOSITORY</Text><Text style={styles.backupRepository}>{settings.owner}/{settings.repository}</Text><Text style={styles.backupStatusText}>{session ? 'Unlocked for this session. New changes sync automatically.' : 'Enter your passphrase to unlock backup and restore.'}</Text></Card> : <>
      <Text style={styles.fieldLabel}>GitHub username</Text><TextInput value={owner} onChangeText={setOwner} autoCapitalize="none" autoCorrect={false} placeholder="Your GitHub username" placeholderTextColor={palette.mutedForeground} style={styles.backupInput} />
      <Text style={styles.fieldLabel}>Private repository</Text><TextInput value={repository} onChangeText={setRepository} autoCapitalize="none" autoCorrect={false} placeholder={DEFAULT_BACKUP_REPOSITORY} placeholderTextColor={palette.mutedForeground} style={styles.backupInput} />
      <Text style={styles.fieldLabel}>Fine-grained GitHub token</Text><TextInput value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste it here, never in chat" placeholderTextColor={palette.mutedForeground} style={styles.backupInput} />
      <Pressable onPress={() => void Linking.openURL('https://github.com/settings/personal-access-tokens/new')}><Text style={styles.tokenLink}>Create a token for this private repository →</Text></Pressable>
      <Text style={styles.tokenHelp}>Choose only this repository and grant Contents: Read and write. The token is encrypted locally before this browser remembers it.</Text>
    </>}
    <Text style={styles.fieldLabel}>Encryption passphrase</Text><TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry placeholder="At least 12 characters" placeholderTextColor={palette.mutedForeground} style={styles.backupInput} />
    {!settings && <><Text style={styles.fieldLabel}>Confirm passphrase</Text><TextInput value={confirmPassphrase} onChangeText={setConfirmPassphrase} secureTextEntry placeholder="Type it again" placeholderTextColor={palette.mutedForeground} style={styles.backupInput} /></>}
    <View style={styles.backupActions}><PrimaryButton label={settings ? 'Unlock & back up' : 'Connect & back up'} onPress={() => void connectAndBackup()} icon="cloud-upload-outline" disabled={busy || !passphrase || (!settings && (!owner || !repository || !token || !confirmPassphrase))} /><PrimaryButton label="Restore from GitHub" onPress={() => void restore()} icon="cloud-download-outline" secondary disabled={busy || !passphrase || (!settings && (!owner || !repository || !token || !confirmPassphrase))} /></View>
    {message ? <Text style={styles.backupMessage}>{message}</Text> : null}
    {settings ? <Pressable onPress={() => void disconnect()} style={styles.disconnectButton}><Text style={styles.disconnectText}>Forget GitHub connection on this browser</Text></Pressable> : null}
  </View>;
}

function JournalPanel({ entries }: { entries: Array<{ date: string; flow: string; note?: string; mood: string[]; symptoms: string[] }> }) {
  if (!entries.length) return <EmptyPanel icon="book-open" title="Your journal is waiting" body="Add a note from any day in the Calendar tab and it will appear here." />;
  return <View>{entries.map((entry) => <View key={entry.date} style={styles.entry}><View style={styles.entryHeader}><Text style={styles.entryDate}>{formatDate(entry.date, { weekday: 'short', month: 'long', day: 'numeric' })}</Text><Text style={styles.entryFlow}>{entry.flow === 'None' ? 'Note' : entry.flow}</Text></View>{entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}{entry.symptoms.length ? <Text style={styles.entryMeta}>Symptoms: {entry.symptoms.join(', ')}</Text> : null}{entry.mood.length ? <Text style={styles.entryMeta}>Mood: {entry.mood.join(', ')}</Text> : null}</View>)}</View>;
}

function HistoryPanel({ periods, periodDays, logs, lastPeriodStart, typicalCycleLength, periodLength }: { periods: Array<{ days: string[] }>; periodDays: string[]; logs: Record<string, { flow: string; note?: string }>; lastPeriodStart: string; typicalCycleLength: number; periodLength: number }) {
  return <View><YearAtAGlance periodDays={periodDays} logs={logs} lastPeriodStart={lastPeriodStart} typicalCycleLength={typicalCycleLength} periodLength={periodLength} /><Text style={styles.historySectionTitle}>Recorded periods</Text>{periods.length ? periods.map((period) => { const start = period.days[0]; const end = period.days[period.days.length - 1]; return <View key={start} style={styles.historyRow}><View style={styles.historyIcon}><Ionicons name="calendar-outline" size={18} color={palette.primary} /></View><View style={styles.historyCopy}><Text style={styles.historyDate}>{formatDate(start, { month: 'long', day: 'numeric', year: 'numeric' })}{start !== end ? ` – ${formatDate(end, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}</Text><Text style={styles.historyMeta}>{period.days.length} {period.days.length === 1 ? 'day' : 'days'} recorded</Text></View></View>; }) : <Text style={styles.emptyInsight}>Mark period days in the Calendar tab and your recorded cycles will appear here.</Text>}</View>;
}

function InsightsPanel({ averageCycle, averagePeriod, cycleDay, phase, loggedDays, noteCount, commonFlow, topSymptoms }: { averageCycle: number; averagePeriod: number; cycleDay: number; phase: string; loggedDays: number; noteCount: number; commonFlow?: string; topSymptoms: Array<[string, number]> }) {
  return <View><Text style={styles.panelIntro}>A small picture built only from what you choose to log. These are observations, not diagnoses.</Text><View style={styles.insightGrid}><View style={styles.insightRow}><Metric compact label="Cycle average" value={`${averageCycle} days`} /><Metric compact label="Period average" value={`${averagePeriod} days`} tone={palette.rose} /></View><View style={styles.insightRow}><Metric compact label="Days logged" value={`${loggedDays}`} tone={palette.primary} /><Metric compact label="Notes saved" value={`${noteCount}`} tone={palette.accentForeground} /></View></View><Card style={styles.currentInsight}><Text style={styles.insightEyebrow}>RIGHT NOW</Text><Text style={styles.currentInsightTitle}>Cycle day {cycleDay} · {phase} Phase</Text><Text style={styles.currentInsightText}>{commonFlow ? `Your most common logged flow is ${commonFlow.toLowerCase()}.` : 'Log flow on the Calendar tab to see your most common pattern here.'}</Text></Card><Text style={styles.insightSectionTitle}>Most noticed symptoms</Text>{topSymptoms.length ? topSymptoms.map(([symptom, count]) => <View key={symptom} style={styles.symptomRow}><Text style={styles.symptomName}>{symptom}</Text><Text style={styles.symptomCount}>{count} {count === 1 ? 'entry' : 'entries'}</Text></View>) : <Text style={styles.emptyInsight}>Log symptoms from your daily entries to see patterns here.</Text>}</View>;
}

function EmptyPanel({ icon, title, body }: { icon: keyof typeof Feather.glyphMap; title: string; body: string }) {
  return <View style={styles.emptyPanel}><View style={styles.emptyPanelIcon}><Feather name={icon} size={22} color={palette.rose} /></View><Text style={styles.emptyPanelTitle}>{title}</Text><Text style={styles.emptyPanelBody}>{body}</Text></View>;
}

function MenuRow({ icon, label, detail, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; detail: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}><View style={styles.menuIcon}><Feather name={icon} size={18} color={palette.primary} /></View><View style={styles.menuCopy}><Text style={styles.menuLabel}>{label}</Text><Text style={styles.menuDetail}>{detail}</Text></View><Ionicons name="chevron-forward" size={18} color={palette.mutedForeground} /></Pressable>;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 10 },
  privacyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: palette.sage, borderColor: palette.sage },
  lock: { width: 38, height: 38, borderRadius: 14, backgroundColor: palette.cream, alignItems: 'center', justifyContent: 'center' },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: palette.accentForeground, fontSize: 15, fontWeight: '700', marginBottom: 5 },
  privacyText: { color: palette.accentForeground, fontSize: 12, lineHeight: 18 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  menuIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: palette.warm, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1 },
  menuLabel: { color: palette.plum, fontSize: 15, fontWeight: '700' },
  menuDetail: { color: palette.mutedForeground, fontSize: 12, marginTop: 3 },
  deleteRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 19, marginTop: 7 },
  deleteLabel: { color: palette.destructive, fontSize: 15, fontWeight: '700' },
  deleteDetail: { color: palette.mutedForeground, fontSize: 12, marginTop: 3 },
  version: { color: palette.mutedForeground, fontSize: 11, textAlign: 'center', marginTop: 24 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45, 25, 37, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 32, maxHeight: '86%' },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetEyebrow: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 },
  sheetTitle: { color: palette.plum, fontSize: 22, fontWeight: '700' },
  sheetText: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  importInput: { minHeight: 150, maxHeight: 250, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, padding: 14, color: palette.foreground, fontSize: 12, textAlignVertical: 'top', marginBottom: 18 },
  panelContent: { paddingBottom: 8 },
  panelIntro: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19, marginBottom: 15 },
  backupStatus: { backgroundColor: palette.sage, borderColor: palette.sage, marginBottom: 16 },
  backupStatusLabel: { color: palette.accentForeground, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  backupRepository: { color: palette.plum, fontSize: 14, fontWeight: '700', marginTop: 5 },
  backupStatusText: { color: palette.accentForeground, fontSize: 12, lineHeight: 17, marginTop: 6 },
  fieldLabel: { color: palette.plum, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  backupInput: { minHeight: 48, borderRadius: 14, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 13, color: palette.foreground, fontSize: 14, marginBottom: 13 },
  tokenLink: { color: palette.primary, fontSize: 12, fontWeight: '700', marginTop: -3, marginBottom: 7 },
  tokenHelp: { color: palette.mutedForeground, fontSize: 11, lineHeight: 16, marginBottom: 15 },
  backupActions: { gap: 9, marginTop: 4 },
  backupMessage: { color: palette.plum, fontSize: 12, lineHeight: 18, marginTop: 13 },
  disconnectButton: { alignSelf: 'center', paddingVertical: 14, marginTop: 5 },
  disconnectText: { color: palette.destructive, fontSize: 12, fontWeight: '700' },
  entry: { borderTopWidth: 1, borderTopColor: palette.border, paddingVertical: 14 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 7 },
  entryDate: { color: palette.plum, fontSize: 14, fontWeight: '700', flex: 1 },
  entryFlow: { color: palette.rose, fontSize: 11, fontWeight: '700' },
  entryNote: { color: palette.foreground, fontSize: 14, lineHeight: 20 },
  entryMeta: { color: palette.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 5 },
  historySectionTitle: { color: palette.plum, fontSize: 16, fontWeight: '700', fontFamily: 'Georgia', marginBottom: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: palette.border, paddingVertical: 14 },
  historyIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1 },
  historyDate: { color: palette.plum, fontSize: 14, fontWeight: '700' },
  historyMeta: { color: palette.mutedForeground, fontSize: 12, marginTop: 4 },
  insightGrid: { gap: 8, marginBottom: 14 },
  insightRow: { flexDirection: 'row', gap: 8 },
  currentInsight: { backgroundColor: palette.warm, borderColor: palette.warm, marginBottom: 17 },
  insightEyebrow: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  currentInsightTitle: { color: palette.plum, fontSize: 17, fontWeight: '700', marginTop: 6 },
  currentInsightText: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 7 },
  insightSectionTitle: { color: palette.plum, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  symptomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: palette.border, paddingVertical: 11 },
  symptomName: { color: palette.foreground, fontSize: 14 },
  symptomCount: { color: palette.mutedForeground, fontSize: 12 },
  emptyInsight: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19 },
  emptyPanel: { alignItems: 'center', paddingVertical: 25 },
  emptyPanelIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  emptyPanelTitle: { color: palette.plum, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyPanelBody: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});