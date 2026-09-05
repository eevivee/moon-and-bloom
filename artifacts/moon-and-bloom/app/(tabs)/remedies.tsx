import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMoon, RemedyCategory } from '@/context/MoonContext';
import { BrandMark, Card, IconButton, palette, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/MoonUI';

const categories: RemedyCategory[] = ['Teas', 'Herbs', 'Homeopathy', 'Comfort', 'Foods', 'Self-care'];

export default function RemediesScreen() {
  const { data, addRemedy, toggleFavorite } = useMoon();
  const [category, setCategory] = useState<RemedyCategory>('Teas');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const visible = data.remedies
    .filter((item) => item.category === category)
    .filter((item) => !normalizedQuery || [item.name, item.description, item.phase, item.category].join(' ').toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const submit = () => { if (!name.trim()) return; addRemedy({ name: name.trim(), category, description: description.trim() || 'A personal addition to your wellness cabinet.', phase: 'Any phase', favorite: false }); setName(''); setDescription(''); setShowAdd(false); };
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    <View style={styles.header}><BrandMark compact /><IconButton icon="add" label="Add remedy" onPress={() => setShowAdd(true)} /></View>
    <SectionTitle eyebrow="Your wellness cabinet" title="Remedies & Rituals" />
    <Text style={styles.intro}>Keep the things that help you close, personal, and easy to find.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
    <View style={styles.searchBox}><Ionicons name="search-outline" size={18} color={palette.mutedForeground} /><TextInput value={query} onChangeText={setQuery} placeholder="Search by remedies or keywords" placeholderTextColor={palette.mutedForeground} style={styles.searchInput} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />{query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={palette.mutedForeground} /></Pressable> : null}</View>
    <View style={styles.listHeader}><Text style={styles.resultCount}>{visible.length} {query ? 'matches' : `saved ${category.toLowerCase()}`}</Text><Text style={styles.helper}>Tap the heart to favorite</Text></View>
    {visible.map((item) => <RemedyCard key={item.id} item={item} onFavorite={() => toggleFavorite(item.id)} />)}
    {!visible.length && <Card style={styles.empty}><Ionicons name={query ? 'search-outline' : 'leaf-outline'} size={28} color={palette.rose} /><Text style={styles.emptyTitle}>{query ? 'No remedies found' : 'Nothing here yet'}</Text><Text style={styles.helper}>{query ? 'Try another remedy name or keyword.' : 'Add something that supports you in this part of your cycle.'}</Text>{query ? <PrimaryButton label="Clear search" onPress={() => setQuery('')} icon="close" /> : <PrimaryButton label={`Add ${category.toLowerCase()}`} onPress={() => setShowAdd(true)} icon="add" />}</Card>}
    <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={15} color={palette.mutedForeground} /><Text style={styles.disclaimerText}>General wellness information, not medical advice. Herbs can interact with medicines or be unsuitable during pregnancy or for some health conditions.</Text></View>
  </ScrollView>
  <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Add to your cabinet</Text><Pressable onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View><Text style={styles.sheetLabel}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView><Text style={styles.sheetLabel}>Name</Text><TextInput value={name} onChangeText={setName} placeholder="e.g. Cozy evening tea" placeholderTextColor={palette.mutedForeground} style={styles.input} /><Text style={styles.sheetLabel}>Personal note</Text><TextInput value={description} onChangeText={setDescription} placeholder="What makes this one special?" placeholderTextColor={palette.mutedForeground} style={[styles.input, styles.multiline]} multiline /><PrimaryButton label="Save remedy" onPress={submit} icon="checkmark" disabled={!name.trim()} /></View></View></Modal>
  </Screen>;
}

function RemedyCard({ item, onFavorite }: { item: { name: string; description: string; phase: string; favorite: boolean }; onFavorite: () => void }) {
  return <Card style={styles.remedyCard}><View style={styles.remedyTop}><View style={styles.remedyIcon}><Feather name="coffee" size={18} color={palette.primary} /></View><View style={styles.remedyText}><Text style={styles.remedyName}>{item.name}</Text><Text style={styles.remedyPhase}>{item.phase}</Text></View><Pressable onPress={onFavorite} hitSlop={10}><Ionicons name={item.favorite ? 'heart' : 'heart-outline'} size={21} color={item.favorite ? palette.rose : palette.mutedForeground} /></Pressable></View><Text style={styles.description}>{item.description}</Text></Card>;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  intro: { color: palette.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: -3, marginBottom: 18 },
  categoryRow: { gap: 8, paddingBottom: 3 },
  searchBox: { minHeight: 49, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  searchInput: { flex: 1, color: palette.foreground, fontSize: 15, paddingVertical: 0 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  resultCount: { color: palette.plum, fontWeight: '700', fontSize: 13 },
  helper: { color: palette.mutedForeground, fontSize: 12 },
  remedyCard: { marginBottom: 10 },
  remedyTop: { flexDirection: 'row', alignItems: 'center' },
  remedyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
  remedyText: { flex: 1, marginLeft: 11 },
  remedyName: { color: palette.plum, fontSize: 16, fontWeight: '700' },
  remedyPhase: { color: palette.rose, fontSize: 11, marginTop: 3 },
  description: { color: palette.mutedForeground, lineHeight: 19, fontSize: 13, marginTop: 14 },
  empty: { alignItems: 'center', paddingVertical: 26, gap: 9 },
  emptyTitle: { color: palette.plum, fontSize: 16, fontWeight: '700' },
  disclaimer: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: 8, paddingHorizontal: 4 },
  disclaimerText: { color: palette.mutedForeground, fontSize: 11, lineHeight: 16, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45, 25, 37, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 32 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  sheetTitle: { color: palette.plum, fontSize: 22, fontWeight: '700' },
  sheetLabel: { color: palette.plum, fontSize: 13, fontWeight: '700', marginTop: 13, marginBottom: 8 },
  input: { minHeight: 50, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, color: palette.foreground, fontSize: 16 },
  multiline: { minHeight: 78, paddingTop: 13, textAlignVertical: 'top', marginBottom: 20 },
});