import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMoon, RemedyCategory } from '@/context/MoonContext';
import { AppFooter, BrandBanner, BrandMark, Card, IconButton, palette, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/MoonUI';

const categories: RemedyCategory[] = ['Teas', 'Herbs', 'Homeopathy', 'Comfort', 'Foods', 'Self-care'];
const remedyShopUrl = 'https://www.amazon.com/shop/eevijones/curation/2a4ae830-1933-4e07-90d5-bb6ba038b63f';

export default function RemediesScreen() {
  const { data, addRemedy, toggleFavorite } = useMoon();
  const [category, setCategory] = useState<RemedyCategory>('Teas');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'alphabetical' | 'hearted'>('alphabetical');
  const normalizedQuery = query.trim().toLowerCase();
  const visible = data.remedies
    .filter((item) => item.category === category)
    .filter((item) => !normalizedQuery || [item.name, item.description, item.phase, item.category].join(' ').toLowerCase().includes(normalizedQuery))
    .sort((a, b) => sortMode === 'hearted'
      ? Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name));
  const submit = () => { if (!name.trim()) return; addRemedy({ name: name.trim(), category, description: description.trim() || 'A personal addition to your wellness cabinet.', phase: 'Any phase', favorite: false }); setName(''); setDescription(''); setShowAdd(false); };
  return <Screen><ScrollView style={{ marginHorizontal: -20 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
     <BrandBanner><View style={styles.header}><BrandMark /></View></BrandBanner>
     <SectionTitle eyebrow="Your wellness cabinet" title="Remedies & Rituals" trailing={<IconButton icon="add" label="Add remedy" onPress={() => setShowAdd(true)} />} />
    <Text style={styles.intro}>Keep the things that help you close, personal, and easy to find.</Text>
     <View style={styles.categoryGrid}>{categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</View>
    <View style={styles.searchBox}><Ionicons name="search-outline" size={18} color={palette.mutedForeground} /><TextInput value={query} onChangeText={setQuery} placeholder="Search by remedies or keywords" placeholderTextColor={palette.mutedForeground} style={styles.searchInput} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />{query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={palette.mutedForeground} /></Pressable> : null}</View>
     <View style={styles.sortRow}>
       <Text style={styles.sortRowLabel}>Sort</Text>
       <View style={styles.sortToggleGroup}>
         <Text style={styles.sortAlphabetical}>A–Z</Text>
         <Pressable
           accessibilityLabel="Show hearted remedies first"
           accessibilityRole="switch"
           accessibilityState={{ checked: sortMode === 'hearted' }}
           onPress={() => setSortMode(sortMode === 'hearted' ? 'alphabetical' : 'hearted')}
           style={styles.switchButton}
         >
           <View style={[styles.switchTrack, sortMode === 'hearted' && styles.switchTrackOn]}>
             <View style={[styles.switchThumb, sortMode === 'hearted' && styles.switchThumbOn]} />
           </View>
         </Pressable>
         <Ionicons name="heart" size={17} color={sortMode === 'hearted' ? palette.rose : palette.mutedForeground} />
       </View>
     </View>
     {visible.map((item) => <RemedyCard key={item.id} item={item} onFavorite={() => toggleFavorite(item.id)} onShop={() => void Linking.openURL(remedyShopUrl)} />)}
    {!visible.length && <Card style={styles.empty}><Ionicons name={query ? 'search-outline' : 'leaf-outline'} size={28} color={palette.rose} /><Text style={styles.emptyTitle}>{query ? 'No remedies found' : 'Nothing here yet'}</Text><Text style={styles.helper}>{query ? 'Try another remedy name or keyword.' : 'Add something that supports you in this part of your cycle.'}</Text>{query ? <PrimaryButton label="Clear search" onPress={() => setQuery('')} icon="close" /> : <PrimaryButton label={`Add ${category.toLowerCase()}`} onPress={() => setShowAdd(true)} icon="add" />}</Card>}
    <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={15} color={palette.mutedForeground} /><Text style={styles.disclaimerText}>General wellness information, not medical advice. Herbs can interact with medicines or be unsuitable during pregnancy or for some health conditions.</Text></View>
    <AppFooter />
  </ScrollView>
  <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Add to your cabinet</Text><Pressable onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View><Text style={styles.sheetLabel}>Category</Text><View style={styles.categoryGrid}>{categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</View><Text style={styles.sheetLabel}>Name</Text><TextInput value={name} onChangeText={setName} placeholder="e.g. Cozy evening tea" placeholderTextColor={palette.mutedForeground} style={styles.input} /><Text style={styles.sheetLabel}>Personal note</Text><TextInput value={description} onChangeText={setDescription} placeholder="What makes this one special?" placeholderTextColor={palette.mutedForeground} style={[styles.input, styles.multiline]} multiline /><PrimaryButton label="Save remedy" onPress={submit} icon="checkmark" disabled={!name.trim()} /></View></View></Modal>
  </Screen>;
}

function RemedyCard({ item, onFavorite, onShop }: { item: { name: string; description: string; phase: string; favorite: boolean }; onFavorite: () => void; onShop: () => void }) {
  return <Card style={styles.remedyCard}><View style={styles.remedyTop}><View style={styles.remedyIcon}><Feather name="coffee" size={18} color={palette.primary} /></View><View style={styles.remedyText}><Text style={styles.remedyName}>{item.name}</Text><Text style={styles.remedyPhase}>{item.phase}</Text></View><View style={styles.remedyActions}><Pressable accessibilityRole="button" accessibilityLabel={`Shop for ${item.name}`} onPress={onShop} hitSlop={8} style={styles.shopIconButton}><Feather name="shopping-bag" size={17} color={palette.mutedForeground} /></Pressable><Pressable onPress={onFavorite} hitSlop={10}><Ionicons name={item.favorite ? 'heart' : 'heart-outline'} size={21} color={item.favorite ? palette.rose : palette.mutedForeground} /></Pressable></View></View><Text style={styles.description}>{item.description}</Text></Card>;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  intro: { color: palette.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: -3, marginBottom: 18 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 3 },
  searchBox: { minHeight: 49, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  searchInput: { flex: 1, color: palette.foreground, fontSize: 15, paddingVertical: 0 },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12, paddingHorizontal: 2 },
  sortRowLabel: { color: palette.mutedForeground, fontSize: 12, fontWeight: '600' },
  sortToggleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortAlphabetical: { color: palette.mutedForeground, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  switchButton: { padding: 2 },
  switchTrack: { width: 38, height: 22, borderRadius: 11, backgroundColor: palette.secondary, borderWidth: 1, borderColor: palette.border, justifyContent: 'center', paddingHorizontal: 2 },
  switchTrackOn: { backgroundColor: palette.blush, borderColor: palette.rose },
  switchThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: palette.cream, shadowColor: palette.plum, shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  switchThumbOn: { alignSelf: 'flex-end', backgroundColor: palette.rose },
  helper: { color: palette.mutedForeground, fontSize: 12 },
  remedyCard: { marginBottom: 10 },
  remedyTop: { flexDirection: 'row', alignItems: 'center' },
  remedyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
  remedyText: { flex: 1, marginLeft: 11 },
  remedyName: { color: palette.plum, fontSize: 16, fontWeight: '700' },
  remedyPhase: { color: palette.rose, fontSize: 11, marginTop: 3 },
  description: { color: palette.mutedForeground, lineHeight: 19, fontSize: 13, marginTop: 14 },
  remedyActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIconButton: { padding: 4 },
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