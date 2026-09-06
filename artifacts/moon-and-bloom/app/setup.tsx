import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMoon } from '@/context/MoonContext';
import { AppFooter, Field, palette, PrimaryButton } from '@/components/MoonUI';

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatInputDate = (date: Date) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

export default function SetupScreen() {
  const { initialize } = useMoon();
  const [start, setStart] = useState('');
  const [length, setLength] = useState('5');
  const [cycle, setCycle] = useState('');
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  const openPicker = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      const [year, month] = start.split('-').map(Number);
      setPickerMonth(new Date(year, month - 1, 1));
    } else {
      setPickerMonth(new Date());
    }
    setPickerOpen(true);
  };

  const daysInMonth = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1).getDay();
  const monthDays: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const begin = () => {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(start);
    if (!validDate) { setError('Use the format YYYY-MM-DD so your calendar starts in the right place.'); return; }
    const periodLength = Number(length);
    const cycleLength = cycle.trim() ? Number(cycle) : 28;
    if (periodLength < 1 || periodLength > 12 || (cycle.trim() && (cycleLength < 18 || cycleLength > 60))) { setError('Check the numbers and try again.'); return; }
    initialize(start, periodLength, cycleLength);
    router.replace('/(tabs)');
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
       <Text style={styles.kicker}>My Wellness My Way</Text>
      <Text style={styles.title}>Welcome to{'\n'}Moon & Bloom</Text>
       <Text style={styles.intro}>Your Cycle Stays Yours.{'\n\n'}Moon & Bloom was created with privacy at its heart. Your cycle and wellness data is stored locally on this device — no account, no cloud storage, and no personal data sent elsewhere.{'\n\n'}That also means your data won’t automatically follow you to a new device. Before switching devices, simply export your data and import it into Moon & Bloom on your new one. It’s also a good idea to export an occasional backup for safekeeping.</Text>
      <View style={styles.form}>
         <Text style={styles.formTitle}>Begin Here</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>First day of your most recent period</Text>
          <Pressable testID="period-start-picker" onPress={openPicker} style={styles.dateInput}>
            <Text style={[styles.dateText, !start && styles.placeholder]}>{start || 'YYYY-MM-DD'}</Text>
            <Ionicons name="calendar-outline" size={19} color={palette.primary} />
          </Pressable>
        </View>
        <Field label="How many days did it last?" value={length} onChangeText={setLength} placeholder="5" keyboardType="numeric" />
        <Field label="Typical cycle length, if you know it" value={cycle} onChangeText={setCycle} placeholder="28" keyboardType="numeric" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Open my journal" onPress={begin} icon="arrow-forward" />
      </View>
      <Text style={styles.privacy}>No account. No cloud storage.</Text>
       <AppFooter />
    </ScrollView>
    <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>CHOOSE A DATE</Text>
              <Text style={styles.sheetTitle}>When did your last period begin?</Text>
            </View>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={palette.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={19} color={palette.plum} />
            </Pressable>
            <Text style={styles.monthTitle}>{pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            <Pressable onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={19} color={palette.plum} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>{weekdays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
          <View style={styles.dateGrid}>
            {monthDays.map((day, index) => day === null
              ? <View key={`blank-${index}`} style={styles.dateCell} />
              : <Pressable key={day} onPress={() => { setStart(formatInputDate(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day))); setError(''); setPickerOpen(false); }} style={styles.dateCell}>
                <View style={[styles.dateCircle, start === formatInputDate(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day)) && styles.selectedDateCircle]}>
                  <Text style={[styles.dateNumber, start === formatInputDate(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day)) && styles.selectedDateNumber]}>{day}</Text>
                </View>
              </Pressable>)}
          </View>
          <Pressable onPress={() => { setPickerMonth(new Date()); setStart(formatInputDate(new Date())); setError(''); setPickerOpen(false); }} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Use today</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 26, paddingTop: 80, paddingBottom: 44 },
  logo: { width: 124, height: 124, alignSelf: 'center', marginBottom: 28 },
  kicker: { color: palette.rose, textTransform: 'uppercase', letterSpacing: 2, fontSize: 11, fontWeight: '700', marginBottom: 12 },
  title: { color: palette.plum, fontSize: 39, lineHeight: 43, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -1.2 },
  intro: { color: palette.mutedForeground, fontSize: 16, lineHeight: 25, marginTop: 18, maxWidth: 340 },
  form: { backgroundColor: palette.card, borderRadius: 26, borderWidth: 1, borderColor: palette.border, padding: 20, marginTop: 34 },
  formTitle: { color: palette.plum, fontSize: 19, fontWeight: '700', marginBottom: 20 },
  field: { marginBottom: 15 },
  fieldLabel: { color: palette.plum, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  dateInput: { minHeight: 50, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: palette.foreground, fontSize: 16 },
  placeholder: { color: palette.mutedForeground },
  error: { color: palette.destructive, fontSize: 13, lineHeight: 18, marginTop: -3, marginBottom: 14 },
  privacy: { color: palette.mutedForeground, fontSize: 12, textAlign: 'center', marginTop: 23 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45, 25, 37, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 28 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 19 },
  sheetEyebrow: { color: palette.rose, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 },
  sheetTitle: { color: palette.plum, fontSize: 20, lineHeight: 25, fontWeight: '700', fontFamily: 'Georgia', maxWidth: 290 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.warm, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { color: palette.plum, fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', color: palette.mutedForeground, fontSize: 11, fontWeight: '700' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  dateCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  selectedDateCircle: { backgroundColor: palette.primary },
  dateNumber: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  selectedDateNumber: { color: palette.cream },
  todayButton: { minHeight: 48, borderRadius: 16, backgroundColor: palette.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  todayButtonText: { color: palette.plum, fontSize: 14, fontWeight: '700' },
});