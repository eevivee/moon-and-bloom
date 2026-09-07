import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { DailyLog, daysBetween, getPeriodEpisodes, getTrackedPeriodDays, todayISO, useMoon } from '@/context/MoonContext';
import { AppFooter, BrandBanner, BrandMark, Card, Metric, palette, Screen, SectionTitle } from '@/components/MoonUI';

type PhaseDefinition = {
  meaning: string;
  notice: string;
  support: string;
  track: string;
  important?: string;
};

const phaseDefinitions: Record<string, PhaseDefinition> = {
  Menstrual: {
    meaning: 'The uterine lining is being shed.',
    notice: 'Bleeding, cramps, lower energy, back discomfort, headaches, or wanting more rest.',
    support: 'Warmth, hydration, nourishing meals, rest, and gentle movement if it feels good.',
    track: 'Flow, pain, energy, sleep, and mood.',
  },
  Follicular: {
    meaning: 'The phase after bleeding begins to ease and before ovulation. Hormone levels and energy may gradually shift.',
    notice: 'Changes in energy, mood, focus, appetite, or cervical fluid.',
    support: 'Gradually return to activities and use increased energy only if it feels available.',
    track: 'Energy, focus, mood, and sleep.',
  },
  Ovulatory: {
    meaning: 'Ovulation may occur around the middle of the cycle, but the app’s timing is only an estimate.',
    notice: 'More energy, increased libido, mood changes, slippery cervical fluid, or a mild one-sided sensation. Some people notice nothing.',
    support: 'Stay hydrated, keep regular meals, and pay attention to what your body is actually telling you.',
    track: 'Energy, mood, cervical fluid, and any changes you notice.',
    important: 'Cycle estimates should not be treated as reliable contraception or a fertility prediction.',
  },
  Luteal: {
    meaning: 'The phase after estimated ovulation and before the next period.',
    notice: 'Changes in appetite, sleep, breast tenderness, bloating, mood, energy, or body temperature.',
    support: 'Consistent sleep, regular meals, lower-pressure plans, and extra recovery time if needed.',
    track: 'PMS symptoms, mood, sleep, appetite, and the days symptoms begin.',
  },
};

export default function NormalScreen() {
  const { data, averageCycle, averagePeriod, phase, cycleDay, currentPeriodStart } = useMoon();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const today = todayISO();
  const periodStarts = getPeriodEpisodes(getTrackedPeriodDays(data)).map((episode) => episode[0]).filter((start) => start <= today);
  const completedCycles = periodStarts.slice(0, -1).slice(-3);
  const currentSymptoms = getSymptomsForRange(data.logs, currentPeriodStart, today);
  const historicalCycles = completedCycles.map((start, index) => ({ start, end: periodStarts[periodStarts.indexOf(start) + 1] ?? today }));
  const recurringPatterns = buildRecurringPatterns(data.logs, historicalCycles, averagePeriod);
  const currentPatternEntries = Object.entries(currentSymptoms).sort((a, b) => b[1] - a[1]);
  const selectedPhaseInfo = selectedPhase ? phaseDefinitions[selectedPhase] : null;
  return <Screen><ScrollView style={{ marginHorizontal: -20 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
     <BrandBanner><BrandMark /></BrandBanner>
    <SectionTitle eyebrow="Patterns, not predictions" title="My Normal" />
    <Text style={styles.intro}>A clear summary of your cycle history and the patterns you’ve logged.</Text>
    <Card style={styles.rangeCard}>
      <View style={styles.rangeTop}><View><Text style={styles.cardEyebrow}>YOUR USUAL CYCLE</Text><Text style={styles.bigNumber}>{averageCycle} <Text style={styles.bigUnit}>days</Text></Text></View><View style={styles.ring}><Text style={styles.ringText}>{cycleDay}</Text><Text style={styles.ringLabel}>today</Text></View></View>
      <View style={styles.rangeTrack}><View style={[styles.rangeFill, { width: `${Math.min(94, Math.max(18, averageCycle * 2.5))}%` }]} /></View>
      <Text style={styles.muted}>Moon & Bloom will learn your personal range as you log more complete cycles.</Text>
    </Card>
    <View style={styles.metricGrid}><Metric label="Average Cycle" value={`${averageCycle} days`} /><Metric label="Average Period" value={`${averagePeriod} days`} tone={palette.rose} /></View>
    <SectionTitle eyebrow="What you’ve noticed" title="Early Patterns" />
     <Card>
       <Text style={styles.patternSectionTitle}>This Cycle</Text>
       {currentPatternEntries.length ? currentPatternEntries.map(([symptom, count], index) => <View key={symptom} style={[styles.patternRow, index > 0 && styles.patternBorder]}><View style={styles.patternIcon}><Feather name="circle" size={10} color={palette.rose} /></View><Text style={styles.patternText}>Your logs show {symptom} on {count} {count === 1 ? 'day' : 'days'} this cycle.</Text></View>) : <Text style={styles.muted}>Your logs will show the symptoms you notice in this cycle here.</Text>}
       <Text style={[styles.patternSectionTitle, styles.patternSectionSpacing]}>Patterns Across Your Last 3 Cycles</Text>
       {completedCycles.length >= 3 ? recurringPatterns.length ? recurringPatterns.map((pattern, index) => <View key={pattern.symptom} style={[styles.patternRow, index > 0 && styles.patternBorder]}><View style={styles.patternIcon}><Feather name="circle" size={10} color={palette.rose} /></View><Text style={styles.patternText}>{pattern.summary}</Text></View>) : <Text style={styles.muted}>Your logs have not shown a repeating symptom across these cycles yet.</Text> : <Text style={styles.muted}>Your logs will show recurring patterns after 3 completed cycles.</Text>}
     </Card>
    <SectionTitle eyebrow="The four phases" title="Where You Are Now" />
     <Card style={styles.phaseCard}>{['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].map((item) => <PhaseRow key={item} item={item} currentPhase={phase} onPress={setSelectedPhase} />)}</Card>
    <View style={styles.note}><Ionicons name="information-circle-outline" size={15} color={palette.mutedForeground} /><Text>Patterns only appear when your own entries support them.</Text></View>
    <AppFooter />
  </ScrollView>
  <Modal visible={!!selectedPhase} transparent animationType="slide" onRequestClose={() => setSelectedPhase(null)}>
    <View style={styles.modalBackdrop}><View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>UNDERSTANDING YOUR RHYTHM</Text><Text style={styles.sheetTitle}>{selectedPhase} Phase</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close phase information" onPress={() => setSelectedPhase(null)} hitSlop={10}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View>
      {selectedPhaseInfo && <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.phaseInfoList}><View style={styles.phaseInfoRow}><View style={[styles.phaseInfoDot, selectedPhase === phase && styles.phaseInfoDotActive]} /><View style={styles.phaseInfoCopy}><Text style={[styles.phaseInfoName, selectedPhase === phase && styles.phaseInfoNameActive]}>{selectedPhase}{selectedPhase === phase ? ' · now' : ''}</Text><PhaseInfoBlock label="What it means" text={selectedPhaseInfo.meaning} /><PhaseInfoBlock label="You might notice" text={selectedPhaseInfo.notice} /><PhaseInfoBlock label="Gentle ways to support yourself" text={selectedPhaseInfo.support} /><PhaseInfoBlock label="Useful to track" text={selectedPhaseInfo.track} />{selectedPhaseInfo.important && <View style={styles.phaseInfoNote}><Text style={styles.phaseInfoLabel}>A note about estimates</Text><Text style={styles.phaseInfoDescription}>{selectedPhaseInfo.important}</Text></View>}</View></View><Text style={styles.phaseDisclaimer}>Your phase is an estimate based on your cycle history, not a medical or fertility prediction.</Text></ScrollView>}
    </View></View>
  </Modal>
  </Screen>;
}

function PhaseRow({ item, currentPhase, onPress }: { item: string; currentPhase: string; onPress: (phase: string) => void }) {
  const isCurrent = item === currentPhase;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Learn about the ${item} phase`}
      onPress={() => onPress(item)}
      style={styles.phaseRow}
      testID={`phase-${item.toLowerCase()}`}
    >
      <View style={[styles.phaseDot, isCurrent && styles.phaseDotActive]} />
      <Text style={[styles.phaseText, isCurrent && styles.phaseTextActive]}>{item}</Text>
      {isCurrent ? (
        <>
          <Ionicons name="chevron-forward" size={16} color={palette.mutedForeground} />
          <Text style={styles.now}>NOW</Text>
        </>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={palette.mutedForeground} />
      )}
    </Pressable>
  );
}

function PhaseInfoBlock({ label, text }: { label: string; text: string }) {
  return <View style={styles.phaseInfoBlock}><Text style={styles.phaseInfoLabel}>{label}</Text><Text style={styles.phaseInfoDescription}>{text}</Text></View>;
}

function getSymptomsForRange(logs: Record<string, DailyLog>, start: string, end: string) {
  return Object.values(logs)
    .filter((entry) => entry.date >= start && entry.date <= end)
    .flatMap((entry) => Array.from(new Set(entry.symptoms ?? [])))
    .reduce<Record<string, number>>((counts, symptom) => ({ ...counts, [symptom]: (counts[symptom] ?? 0) + 1 }), {});
}

function buildRecurringPatterns(logs: Record<string, DailyLog>, cycles: { start: string; end: string }[], averagePeriod: number) {
  const patternData = new Map<string, { cycles: Set<number>; days: number[] }>();
  cycles.forEach((cycle, cycleIndex) => {
    Object.values(logs)
      .filter((entry) => entry.date >= cycle.start && entry.date < cycle.end)
      .forEach((entry) => Array.from(new Set(entry.symptoms ?? [])).forEach((symptom) => {
        const current = patternData.get(symptom) ?? { cycles: new Set<number>(), days: [] };
        current.cycles.add(cycleIndex);
        current.days.push(daysBetween(cycle.start, entry.date) + 1);
        patternData.set(symptom, current);
      }));
  });
  return Array.from(patternData.entries())
    .map(([symptom, details]) => {
      const days = details.days.sort((a, b) => a - b);
      const dayCounts = days.reduce<Record<number, number>>((counts, day) => ({ ...counts, [day]: (counts[day] ?? 0) + 1 }), {});
      const highestDayCount = Math.max(...Object.values(dayCounts));
      const repeatedTiming = highestDayCount > 1;
      const timingDays = repeatedTiming
        ? Object.entries(dayCounts).filter(([, count]) => count === highestDayCount).map(([day]) => Number(day)).sort((a, b) => a - b)
        : days;
      const minDay = timingDays[0];
      const maxDay = timingDays[timingDays.length - 1];
      const recurrence = `${details.cycles.size} of your last 3 cycles`;
      const summary = maxDay <= Math.max(3, averagePeriod)
        ? `Your logs show ${symptom} in ${recurrence}, most often near the beginning of your period.`
        : minDay === maxDay
          ? `Your logs show ${symptom} in ${recurrence}, ${repeatedTiming ? 'most often ' : ''}around cycle day ${minDay}.`
          : `Your logs show ${symptom} in ${recurrence}, ${repeatedTiming ? 'most often ' : ''}around cycle days ${minDay}–${maxDay}.`;
      return { symptom, cycleCount: details.cycles.size, dayCount: details.days.length, summary };
    })
    .filter((pattern) => pattern.cycleCount >= 2)
    .sort((a, b) => b.cycleCount - a.cycleCount || b.dayCount - a.dayCount);
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
  patternSectionTitle: { color: palette.plum, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  patternSectionSpacing: { marginTop: 22 },
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
  phaseInfoBlock: { marginTop: 14 },
  phaseInfoLabel: { color: palette.plum, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  phaseInfoDescription: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19 },
  phaseInfoNote: { backgroundColor: palette.blush, borderRadius: 12, padding: 12, marginTop: 16 },
  phaseDisclaimer: { color: palette.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 12 },
});