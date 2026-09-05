import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays, formatDate, todayISO } from '@/context/MoonContext';
import { Pill, palette } from '@/components/MoonUI';

type YearLog = { flow: string; note?: string };

export function YearAtAGlance({ periodDays, logs, lastPeriodStart, typicalCycleLength, periodLength }: {
  periodDays: string[];
  logs: Record<string, YearLog>;
  lastPeriodStart: string;
  typicalCycleLength: number;
  periodLength: number;
}) {
  const { width } = useWindowDimensions();
  const [year, setYear] = useState(new Date().getFullYear());
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayColumnWidth = 22;
  const gridWidth = Math.max(288, Math.min(364, width - 66));
  const monthWidth = gridWidth / 12;
  const actualDays = new Set(periodDays);
  const today = todayISO();
  const spottingDays = new Set(Object.entries(logs).filter(([, log]) => log.flow === 'Spotting').map(([date]) => date));
  const predictedDays = new Set<string>();

  if (showPredictions && typicalCycleLength > 0) {
    let predictedStart = addDays(lastPeriodStart, typicalCycleLength);
    for (let index = 0; index < 60; index += 1) {
      for (let day = 0; day < periodLength; day += 1) {
        const predictedDate = addDays(predictedStart, day);
        if (predictedDate >= today) predictedDays.add(predictedDate);
      }
      predictedStart = addDays(predictedStart, typicalCycleLength);
    }
  }

  return <View>
    <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>YOUR RHYTHM</Text><Text style={styles.sectionTitle}>Year At A Glance</Text></View></View>
    <Text style={styles.panelIntro}>See how your logged period dates shift across the year. Filled cells are actual period days.</Text>
    <View style={styles.toggleRow}><View style={styles.toggleOptions}><Pill compact label="Logged only" selected={!showPredictions} onPress={() => setShowPredictions(false)} /><Pill compact label="Show predictions" selected={showPredictions} onPress={() => setShowPredictions(true)} /></View><View style={styles.yearNav}><Pressable onPress={() => { setYear((value) => value - 1); setSelectedDate(null); }} style={styles.yearButton} hitSlop={6}><Ionicons name="chevron-back" size={16} color={palette.plum} /></Pressable><Text style={styles.yearText}>{year}</Text><Pressable onPress={() => { setYear((value) => value + 1); setSelectedDate(null); }} style={styles.yearButton} hitSlop={6}><Ionicons name="chevron-forward" size={16} color={palette.plum} /></Pressable></View></View>
    <View style={styles.heatmap}>
      <View style={styles.heatHeader}><View style={{ width: dayColumnWidth }} /><View style={styles.monthLabels}>{monthNames.map((month, monthIndex) => <View key={month} style={[styles.monthLabelWrap, { width: monthWidth }, monthIndex === new Date().getMonth() && year === new Date().getFullYear() && styles.currentMonthLabel]}><Text style={styles.monthLabel}>{month}</Text></View>)}</View></View>
      {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <View key={day} style={styles.heatRow}><Text style={[styles.dayLabel, { width: dayColumnWidth }]}>{day}</Text><View style={styles.monthCells}>{monthNames.map((month, monthIndex) => {
        const valid = day <= new Date(year, monthIndex + 1, 0).getDate();
        const date = `${year}-${`${monthIndex + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
        const actual = valid && actualDays.has(date);
        const predicted = valid && !actual && predictedDays.has(date);
        const spotting = valid && !actual && spottingDays.has(date);
        const currentMonth = monthIndex === new Date().getMonth() && year === new Date().getFullYear();
        return <Pressable key={month} disabled={!valid} onPress={() => setSelectedDate(date)} style={({ pressed }) => [styles.heatCell, { width: monthWidth }, !valid && styles.invalidCell, currentMonth && styles.currentMonthCell, actual && styles.actualCell, predicted && styles.predictedCell, spotting && styles.spottingCell, pressed && styles.heatCellPressed]}>{spotting ? <View style={styles.spottingDot} /> : null}</Pressable>;
      })}</View></View>)}
    </View>
    <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, styles.actualLegend]} /><Text style={styles.legendText}>Logged period</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.spottingLegend]} /><Text style={styles.legendText}>Spotting</Text></View>{showPredictions && <View style={styles.legendItem}><View style={[styles.legendDot, styles.predictedLegend]} /><Text style={styles.legendText}>Expected</Text></View>}</View>
    {selectedDate ? <View style={styles.selectedDateCard}><View><Text style={styles.selectedDateTitle}>{formatDate(selectedDate, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</Text><Text style={styles.selectedDateStatus}>{actualDays.has(selectedDate) ? `${logs[selectedDate]?.flow && logs[selectedDate]?.flow !== 'None' ? logs[selectedDate].flow : 'Period'} flow` : spottingDays.has(selectedDate) ? 'Spotting' : predictedDays.has(selectedDate) ? 'Expected period day' : 'No period entry'}</Text></View>{logs[selectedDate]?.note ? <Text style={styles.selectedDateNote}>{logs[selectedDate].note}</Text> : null}</View> : null}
  </View>;
}

const styles = StyleSheet.create({
  panelIntro: { color: palette.mutedForeground, fontSize: 13, lineHeight: 19, marginBottom: 15 },
  sectionHeading: { marginTop: 28, marginBottom: 12 },
  eyebrow: { color: palette.rose, fontSize: 10, letterSpacing: 1.7, fontWeight: '700', marginBottom: 5 },
  sectionTitle: { color: palette.plum, fontSize: 23, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.4 },
  yearNav: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  yearButton: { width: 28, height: 32, borderRadius: 11, backgroundColor: palette.warm, alignItems: 'center', justifyContent: 'center' },
  yearText: { color: palette.plum, fontSize: 16, fontWeight: '700', minWidth: 38, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 12 },
  toggleOptions: { flexDirection: 'row', gap: 6, flexShrink: 1 },
  heatmap: { alignSelf: 'center', backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, borderRadius: 18, paddingTop: 8, paddingBottom: 9, overflow: 'hidden' },
  heatHeader: { flexDirection: 'row', alignItems: 'flex-end' },
  monthLabels: { flexDirection: 'row' },
  monthLabelWrap: { height: 42, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 5 },
  currentMonthLabel: { backgroundColor: palette.warm },
  monthLabel: { color: palette.mutedForeground, fontSize: 8, fontWeight: '700', transform: [{ rotate: '-45deg' }] },
  heatRow: { flexDirection: 'row', alignItems: 'center', height: 18 },
  dayLabel: { color: palette.mutedForeground, fontSize: 8, fontWeight: '600', textAlign: 'center' },
  monthCells: { flexDirection: 'row' },
  heatCell: { height: 15, borderRadius: 4, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: 0.78 }, { scaleY: 0.82 }] },
  heatCellPressed: { opacity: 0.55 },
  currentMonthCell: { backgroundColor: palette.warm },
  invalidCell: { backgroundColor: palette.border, opacity: 0.15 },
  actualCell: { backgroundColor: '#9c526c', opacity: 1 },
  predictedCell: { backgroundColor: palette.blush, opacity: 0.72 },
  spottingCell: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(156,82,108,0.38)' },
  spottingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#9c526c' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 13, marginTop: 11, marginBottom: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 3 },
  actualLegend: { backgroundColor: '#9c526c' },
  predictedLegend: { backgroundColor: palette.blush },
  spottingLegend: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9c526c' },
  legendText: { color: palette.mutedForeground, fontSize: 10 },
  selectedDateCard: { backgroundColor: palette.warm, borderRadius: 14, padding: 12, marginBottom: 17 },
  selectedDateTitle: { color: palette.plum, fontSize: 13, fontWeight: '700' },
  selectedDateStatus: { color: palette.rose, fontSize: 11, fontWeight: '700', marginTop: 3 },
  selectedDateNote: { color: palette.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 8 },
});