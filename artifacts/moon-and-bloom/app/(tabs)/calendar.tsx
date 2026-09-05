import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMoon, addDays, formatDate, parseISO, todayISO, Flow, DailyLog } from '@/context/MoonContext';
import { BrandBanner, BrandMark, Card, IconButton, palette, Pill, PrimaryButton, Screen, SectionTitle } from '@/components/MoonUI';
import { YearAtAGlance } from '@/components/YearAtAGlance';

const week = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthLabel = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function CalendarScreen() {
  const { data, togglePeriodDay, saveLog } = useMoon();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow>(data.logs[todayISO()]?.flow ?? 'None');
  const [note, setNote] = useState('');

  const dates = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => null);
    return [...blanks, ...Array.from({ length: count }, (_, i) => `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, '0')}-${`${i + 1}`.padStart(2, '0')}`)];
  }, [cursor]);

  const openDate = (date: string) => { setSelected(date); setFlow(data.logs[date]?.flow ?? (data.periodDays.includes(date) ? 'Medium' : 'None')); setNote(data.logs[date]?.note ?? ''); };
  const saveSelected = () => {
    if (!selected) return;
    const existing: DailyLog = data.logs[selected] ?? { date: selected, flow: 'None', mood: [], symptoms: [], remedyIds: [] };
    saveLog({ ...existing, date: selected, flow, note: note.trim() || undefined });
    setSelected(null);
  };
  const predicted = new Set(Array.from({ length: data.periodLength }, (_, i) => addDays(addDays(data.lastPeriodStart, data.typicalCycleLength), i)));
  const isPeriodDay = (date: string) => data.periodDays.includes(date) || ['Light', 'Medium', 'Heavy'].includes(data.logs[date]?.flow ?? '');

  return <Screen><ScrollView style={{ marginHorizontal: -20 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
     <BrandBanner><View style={styles.header}><BrandMark /></View></BrandBanner>
    <SectionTitle eyebrow="Your rhythm" title="Cycle Calendar" trailing={<View style={styles.headerActions}><IconButton icon="chevron-back" label="Previous month" onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} /><IconButton icon="chevron-forward" label="Next month" onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} /></View>} />
    <Text style={styles.calendarInstruction}>Mark bleeding, spotting, and add a simple note</Text>
    <Card style={styles.calendarCard}>
      <View style={styles.monthRow}><Text style={styles.month}>{monthLabel(cursor)}</Text><Pressable onPress={() => setCursor(new Date())}><Text style={styles.todayLink}>Today</Text></Pressable></View>
      <View style={styles.weekRow}>{week.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
      <View style={styles.grid}>{dates.map((date, index) => date ? <Pressable key={date} testID={`date-${date}`} onPress={() => openDate(date)} style={({ pressed }) => [styles.day, pressed && styles.dayPressed]}>
        <View style={[styles.dayCircle, isPeriodDay(date) && styles.actualDay, predicted.has(date) && !isPeriodDay(date) && styles.predictedDay, date === todayISO() && styles.todayCircle]}><Text style={[styles.dayText, isPeriodDay(date) && styles.actualText]}>{Number(date.slice(-2))}</Text></View>
        {data.logs[date]?.flow === 'Spotting' && <View style={styles.spot} />}
      </Pressable> : <View key={`blank-${index}`} style={styles.day} />)}</View>
      <View style={styles.legend}><LegendDot color={palette.rose} label="Period" /><LegendDot color={palette.blush} label="Expected" /><LegendDot color={palette.plum} outline label="Today" /></View>
    </Card>
    <View style={styles.yearSection}><YearAtAGlance periodDays={data.periodDays} logs={data.logs} lastPeriodStart={data.lastPeriodStart} typicalCycleLength={data.typicalCycleLength} periodLength={data.periodLength} /></View>
  </ScrollView>
  <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
    <View style={styles.modalBackdrop}><View style={styles.sheet}>
      <View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>DAILY LOG</Text><Text style={styles.sheetTitle}>{selected ? formatDate(selected, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</Text></View><Pressable onPress={() => setSelected(null)}><Ionicons name="close" size={24} color={palette.mutedForeground} /></Pressable></View>
       <Text style={styles.sheetLabel}>Flow</Text><View style={styles.flowGrid}>{(['None', 'Spotting', 'Light', 'Medium', 'Heavy'] as Flow[]).map((item) => <Pill key={item} label={item} selected={flow === item} onPress={() => setFlow(item)} />)}</View>
       <Text style={styles.sheetLabel}>Note or additional details</Text><TextInput value={note} onChangeText={setNote} placeholder="How are you feeling? Add anything you want to remember." placeholderTextColor={palette.mutedForeground} style={[styles.noteInput, styles.multiline]} multiline textAlignVertical="top" />
      <PrimaryButton label="Save day" onPress={saveSelected} icon="checkmark" />
    </View></View>
  </Modal>
  </Screen>;
}

function LegendDot({ color, label, outline }: { color: string; label: string; outline?: boolean }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: outline ? 'transparent' : color, borderColor: color, borderWidth: outline ? 1.5 : 0 }]} /><Text>{label}</Text></View>; }

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', gap: 7 },
  calendarInstruction: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: -5, marginBottom: 15 },
  calendarCard: { padding: 16 },
  yearSection: { marginTop: 28 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  month: { color: palette.plum, fontSize: 18, fontWeight: '700' },
  todayLink: { color: palette.primary, fontSize: 13, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 9 },
  weekDay: { flex: 1, textAlign: 'center', color: palette.mutedForeground, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: `${100 / 7}%`, height: 50, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dayPressed: { opacity: 0.6 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actualDay: { backgroundColor: palette.rose },
  predictedDay: { backgroundColor: palette.blush },
  todayCircle: { borderColor: palette.plum, borderWidth: 1.5 },
  dayText: { color: palette.foreground, fontSize: 13, fontWeight: '600' },
  actualText: { color: palette.cream },
  spot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.primary, position: 'absolute', bottom: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: palette.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendItemText: { color: palette.mutedForeground, fontSize: 11 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: palette.warm },
  tipIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.cream, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, color: palette.mutedForeground, lineHeight: 19, fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45, 25, 37, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 32 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 23 },
  sheetEyebrow: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sheetTitle: { color: palette.plum, fontSize: 22, fontWeight: '700', marginTop: 4 },
  sheetLabel: { color: palette.plum, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  flowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 19 },
  noteInput: { minHeight: 88, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, paddingTop: 13, color: palette.foreground, fontSize: 15, lineHeight: 20, marginBottom: 20 },
  multiline: { textAlignVertical: 'top' },
});