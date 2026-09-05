import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMoon } from '@/context/MoonContext';
import { BrandBanner, BrandMark, Card, Metric, palette, Screen, SectionTitle } from '@/components/MoonUI';

const phaseDefinitions: Record<string, string> = {
  Menstrual: 'The days of your period, when the uterine lining is released. Many people naturally want more rest, warmth, and inward time here.',
  Follicular: 'The phase after your period and before ovulation. Energy and curiosity may gradually begin to build as your body moves toward its midpoint.',
  Ovulatory: 'A short estimated midpoint of the cycle. Some people feel more social or energized here, while others notice little change.',
  Luteal: 'The phase after estimated ovulation and before your next period. It can be a useful time to slow down, notice what you need, and prepare for rest.',
};

export default function NormalScreen() {
  const { data, averageCycle, averagePeriod, phase, cycleDay } = useMoon();
  const [showPhaseInfo, setShowPhaseInfo] = useState(false);
  const entries = Object.values(data.logs);
  const symptomCounts = entries.flatMap((entry) => entry.symptoms).reduce<Record<string, number>>((counts, symptom) => ({ ...counts, [symptom]: (counts[symptom] ?? 0) + 1 }), {});
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return <Screen><ScrollView style={{ marginHorizontal: -20 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
     <BrandBanner><BrandMark /></BrandBanner>
    <SectionTitle eyebrow="Patterns, not predictions" title="My Normal" />
    <Text style={styles.intro}>A small, honest picture of the rhythm you’re building over time.</Text>
    <Card style={styles.rangeCard}>
      <View style={styles.rangeTop}><View><Text style={styles.cardEyebrow}>YOUR USUAL CYCLE</Text><Text style={styles.bigNumber}>{averageCycle} <Text style={styles.bigUnit}>days</Text></Text></View><View style={styles.ring}><Text style={styles.ringText}>{cycleDay}</Text><Text style={styles.ringLabel}>today</Text></View></View>
      <View style={styles.rangeTrack}><View style={[styles.rangeFill, { width: `${Math.min(94, Math.max(18, averageCycle * 2.5))}%` }]} /></View>
      <Text style={styles.muted}>Moon & Bloom will learn your personal range as you log more complete cycles.</Text>
    </Card>
    <View style={styles.metricGrid}><Metric label="Typical cycle" value={`${averageCycle} days`} /><Metric label="Period usually" value={`${averagePeriod} days`} tone={palette.rose} /></View>
    <SectionTitle eyebrow="What you’ve noticed" title="Early Patterns" />
    {topSymptoms.length ? <Card>{topSymptoms.map(([symptom, count], index) => <View key={symptom} style={[styles.patternRow, index > 0 && styles.patternBorder]}><View style={styles.patternIcon}><Feather name="circle" size={10} color={palette.rose} /></View><Text style={styles.patternText}>{symptom} appears in {count} logged {count === 1 ? 'day' : 'days'}.</Text></View>)}</Card> : <Card style={styles.empty}><Image source={require('../../assets/images/logo.png')} style={styles.emptyLogo} resizeMode="contain" /><Text style={styles.emptyTitle}>Moon & Bloom is still learning your patterns.</Text><Text style={styles.muted}>Log a few symptoms and daily notes to see your personal rhythm take shape.</Text></Card>}
    <SectionTitle eyebrow="The four phases" title="Where you are now" />
    <Card style={styles.phaseCard}>{['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].map((item) => <Pressable key={item} onPress={() => setShowPhaseInfo(true)} style={styles.phaseRow} testID={`phase-${item.toLowerCase()}`}><View style={[styles.phaseDot, item === phase && styles.phaseDotActive]} /><Text style={[styles.phaseText, item === phase && styles.phaseTextActive]}>{item}</Text>{item === phase && <Text style={styles.now}>NOW</Text>}</Pressable>)}</Card>
    <View style={styles.note}><Ionicons name="information-circle-outline" size={15} color={palette.mutedForeground} /><Text>Patterns only appear when your own entries support them.</Text></View>
  </ScrollView>
  <Modal visible={showPhaseInfo} transparent animationType="slide" onRequestClose={() => setShowPhaseInfo(false)}>
    <View style={styles.modalBackdrop}><View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>UNDERSTANDING YOUR RHYTHM</Text><Text style={styles.sheetTitle}>The four phases</Text></View><Pressable onPress={() => setShowPhaseInfo(false)} hitSlop={10}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.phaseInfoList}>{Object.entries(phaseDefinitions).map(([name, description]) => <View key={name} style={styles.phaseInfoRow}><View style={[styles.phaseInfoDot, name === phase && styles.phaseInfoDotActive]} /><View style={styles.phaseInfoCopy}><Text style={[styles.phaseInfoName, name === phase && styles.phaseInfoNameActive]}>{name}{name === phase ? ' · now' : ''}</Text><Text style={styles.phaseInfoDescription}>{description}</Text></View></View>)}<Text style={styles.phaseDisclaimer}>These phases are estimates based on your cycle history, not medical or fertility predictions.</Text></ScrollView>
    </View></View>
  </Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 10 },
  intro: { color: palette.mutedForeground, lineHeight: 21, fontSize: 14, marginTop: -4, marginBottom: 18 },
  rangeCard: { backgroundColor: palette.warm },
  rangeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  bigNumber: { color: palette.plum, fontSize: 38, fontWeight: '700', fontFamily: 'Georgia', marginTop: 6 },
  bigUnit: { fontSize: 15, fontWeight: '500' },
  ring: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: palette.rose, alignItems: 'center', justifyContent: 'center' },
  ringText: { color: palette.plum, fontSize: 22, fontWeight: '700' },
  ringLabel: { color: palette.mutedForeground, fontSize: 10 },
  rangeTrack: { height: 8, borderRadius: 4, backgroundColor: palette.cream, marginTop: 22, overflow: 'hidden' },
  rangeFill: { height: 8, backgroundColor: palette.rose, borderRadius: 4 },
  muted: { color: palette.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 10 },
  metricGrid: { flexDirection: 'row', gap: 8, marginTop: 9 },
  patternRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  patternBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  patternIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
  patternText: { color: palette.foreground, fontSize: 14, flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 25 },
  emptyLogo: { width: 54, height: 54, marginBottom: 11 },
  emptyTitle: { color: palette.plum, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  phaseCard: { paddingVertical: 6 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 11 },
  phaseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.border },
  phaseDotActive: { width: 14, height: 14, borderRadius: 7, backgroundColor: palette.rose, marginLeft: -2, marginRight: -2 },
  phaseText: { color: palette.mutedForeground, fontSize: 14 },
  phaseTextActive: { color: palette.plum, fontWeight: '700' },
  now: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginLeft: 'auto' },
  note: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 17 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45, 25, 37, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 28, maxHeight: '82%' },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  sheetEyebrow: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 },
  sheetTitle: { color: palette.plum, fontSize: 24, fontWeight: '700', fontFamily: 'Georgia' },
  phaseInfoList: { paddingBottom: 8 },
  phaseInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: palette.border },
  phaseInfoDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: palette.border, marginTop: 4 },
  phaseInfoDotActive: { backgroundColor: palette.rose },
  phaseInfoCopy: { flex: 1 },
  phaseInfoName: { color: palette.plum, fontSize: 15, fontWeight: '700', marginBottom: 5 },
  phaseInfoNameActive: { color: palette.rose },
  phaseInfoDescription: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19 },
  phaseDisclaimer: { color: palette.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 12 },
});