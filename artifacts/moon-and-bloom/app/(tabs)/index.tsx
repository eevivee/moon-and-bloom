import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMoon, formatDate } from '@/context/MoonContext';
import { BrandBanner, BrandMark, Card, Metric, palette, Screen, SectionTitle } from '@/components/MoonUI';

const phaseDefinitions: Record<string, string> = {
  Menstrual: 'The days of your period, when the uterine lining is released. Many people naturally want more rest, warmth, and inward time here.',
  Follicular: 'The phase after your period and before ovulation. Energy and curiosity may gradually begin to build as your body moves toward its midpoint.',
  Ovulatory: 'A short estimated midpoint of the cycle. Some people feel more social or energized here, while others notice little change.',
  Luteal: 'The phase after estimated ovulation and before your next period. It can be a useful time to slow down, notice what you need, and prepare for rest.',
};

export default function TodayScreen() {
  const { cycleDay, phase, nextPeriod, averageCycle, averagePeriod } = useMoon();
  const [showPhaseInfo, setShowPhaseInfo] = useState(false);
  const greeting = 'Welcome back';
  const phaseCopy: Record<string, string> = {
    Menstrual: 'A softer pace may serve you today.',
    Follicular: 'There is a little more lift in the air.',
    Ovulatory: 'A bright, outward-moving moment in your cycle.',
    Luteal: 'A natural invitation to slow down and listen in.',
  };
  return <Screen><ScrollView style={{ marginHorizontal: -20 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
     <BrandBanner><View style={styles.top}><BrandMark /></View></BrandBanner>
    <Text style={styles.greeting}>{greeting}</Text>
    <Text style={styles.title}>Where You Are Today</Text>
    <Card style={styles.hero}>
      <View style={styles.heroTop}><View><Text style={styles.heroEyebrow}>TODAY · CYCLE DAY {cycleDay}</Text><Pressable onPress={() => setShowPhaseInfo(true)} style={styles.phaseButton} testID="current-phase-info"><Text style={styles.heroPhase}>{phase} Phase</Text><Ionicons name="information-circle-outline" size={17} color={palette.blush} /></Pressable></View><View style={styles.moonBadge}><Ionicons name="moon" size={25} color={palette.cream} /></View></View>
      <Text style={styles.heroCopy}>{phaseCopy[phase]}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, Math.round((cycleDay / averageCycle) * 100))}%` }]} /></View>
      <View style={styles.progressLabels}><Text style={styles.progressLabel}>Day {cycleDay}</Text><Text style={styles.progressLabel}>of ~{averageCycle}</Text></View>
    </Card>

    <SectionTitle eyebrow="A little context" title="Your Numbers" />
    <View style={styles.metricGrid}><Metric compact label="Average cycle" value={`${averageCycle} days`} /><Metric compact label="Average period" value={`${averagePeriod} days`} tone={palette.rose} /><Metric compact label="Since last period" value={`${Math.max(0, cycleDay - 1)} days`} tone={palette.plum} /></View>
    <View style={[styles.metricGrid, { marginTop: 0 }]}><Metric compact label="Current phase" value={phase} tone={palette.accentForeground} /><Metric compact label="Next expected period" value={formatDate(nextPeriod, { month: 'short', day: 'numeric' })} tone={palette.primary} /><View style={styles.metricSpacer} /></View>

    <SectionTitle eyebrow="For this phase" title="Nourish & Restore" />
    <Card style={styles.suggestion} accent={palette.sage}>
      <View style={styles.suggestionIcon}><Feather name={phase === 'Menstrual' ? 'coffee' : phase === 'Luteal' ? 'moon' : 'sun'} size={20} color={palette.accentForeground} /></View>
      <View style={styles.suggestionBody}><Text style={styles.suggestionTitle}>{phase === 'Menstrual' ? 'Warmth & rest' : phase === 'Luteal' ? 'Make room to exhale' : 'Follow your energy'}</Text><Text style={styles.suggestionCopy}>{phase === 'Menstrual' ? 'Try ginger or chamomile tea, a warm compress, and an earlier night if you can.' : phase === 'Luteal' ? 'A slower walk, magnesium-rich foods, and a nourishing evening ritual could feel good.' : 'A fresh meal, light movement, and one small thing that feels creatively alive.'}</Text></View>
    </Card>
    <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={15} color={palette.mutedForeground} /><Text style={styles.disclaimerText}>These are personal-wellness ideas, not medical advice.</Text></View>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: palette.rose, fontSize: 14, fontWeight: '700', marginTop: 30, marginBottom: 5 },
  title: { color: palette.plum, fontSize: 29, lineHeight: 34, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.7, marginBottom: 17 },
  hero: { backgroundColor: palette.plum, borderColor: palette.plum, padding: 20, shadowColor: palette.plum, shadowOpacity: 0.22 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { color: palette.blush, fontSize: 10, letterSpacing: 1.3, fontWeight: '700' },
  phaseButton: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  heroPhase: { color: palette.cream, fontSize: 24, fontWeight: '700', fontFamily: 'Georgia', marginTop: 5 },
  moonBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,250,244,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { color: palette.cream, fontSize: 14, lineHeight: 21, marginTop: 20, maxWidth: 280 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,250,244,0.18)', marginTop: 20, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: palette.blush },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  progressLabel: { color: palette.cream, fontSize: 11, fontWeight: '600' },
  metricGrid: { flexDirection: 'row', gap: 8 },
  metricSpacer: { flex: 1 },
  suggestion: { flexDirection: 'row', gap: 13, alignItems: 'flex-start' },
  suggestionIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
  suggestionBody: { flex: 1 },
  suggestionTitle: { color: palette.plum, fontSize: 16, fontWeight: '700', fontFamily: 'Georgia', marginBottom: 6 },
  suggestionCopy: { color: palette.mutedForeground, lineHeight: 20, fontSize: 13 },
  disclaimer: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 17, paddingHorizontal: 4 },
  disclaimerText: { color: palette.mutedForeground, fontSize: 11, lineHeight: 16, flex: 1 },
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
