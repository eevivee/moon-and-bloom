import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';

export const palette = colors.light;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <Image source={require('../assets/images/logo.png')} style={[styles.brandLogo, compact && styles.brandLogoCompact]} resizeMode="contain" />
      <View>
        <Text style={[styles.brandName, compact && styles.brandNameCompact]}>Moon & Bloom</Text>
        {!compact && <Text style={styles.brandSub}>My Wellness My Way</Text>}
      </View>
    </View>
  );
}

export function BrandBanner({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 32) + 20;
  return <View style={[styles.brandBanner, { paddingTop: topPadding }]}>{children}</View>;
}

export function AppFooter() {
  return <Text style={styles.appFooter}>Moon & Bloom © Eevi Jones LLC</Text>;
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const body = <View style={styles.screenInner}>{children}</View>;
  return <View style={styles.screen}>{scroll ? <View style={styles.flex}>{body}</View> : body}</View>;
}

export function SectionTitle({ eyebrow, title, action, onAction, trailing }: { eyebrow?: string; title: string; action?: string; onAction?: () => void; trailing?: ReactNode }) {
  return <View style={styles.sectionHeader}>
    <View>{eyebrow && <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>}<Text style={styles.sectionTitle}>{title}</Text></View>
    {trailing ?? (action && <Pressable onPress={onAction} hitSlop={12}><Text style={styles.actionText}>{action}</Text></Pressable>)}
  </View>;
}

export function Card({ children, style, accent }: { children: ReactNode; style?: object; accent?: string }) {
  return <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null, style]}>{children}</View>;
}

export function Pill({ label, selected, onPress, icon, compact = false }: { label: string; selected?: boolean; onPress?: () => void; icon?: keyof typeof Feather.glyphMap; compact?: boolean }) {
  const content = <><>{icon && <Feather name={icon} size={14} color={selected ? palette.cream : palette.plum} />}</><Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text></>;
  return onPress ? <Pressable onPress={onPress} style={[styles.pill, compact && styles.pillCompact, selected && styles.pillSelected]}>{content}</Pressable> : <View style={[styles.pill, compact && styles.pillCompact, selected && styles.pillSelected]}>{content}</View>;
}

export function PrimaryButton({ label, onPress, icon, secondary = false, disabled = false }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; secondary?: boolean; disabled?: boolean }) {
  return <Pressable testID={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, secondary && styles.secondaryButton, disabled && styles.disabled, pressed && styles.pressed]}>
    {icon && <Ionicons name={icon} size={18} color={secondary ? palette.plum : palette.cream} />}
    <Text style={[styles.primaryButtonText, secondary && styles.secondaryButtonText]}>{label}</Text>
  </Pressable>;
}

export function Metric({ label, value, tone = palette.plum, compact = false }: { label: string; value: string; tone?: string; compact?: boolean }) {
  return <View style={[styles.metric, compact && styles.metricCompact]}><Text style={[styles.metricValue, compact && styles.metricValueCompact, { color: tone }]}>{value}</Text><Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>{label}</Text></View>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.mutedForeground} keyboardType={keyboardType} style={styles.input} /></View>;
}

export function IconButton({ icon, onPress, label }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string }) {
  return <Pressable accessibilityLabel={label} onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name={icon} size={21} color={palette.plum} /></Pressable>;
}

export function Loading() { return <View style={styles.loading}><ActivityIndicator color={palette.primary} /></View>; }

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  screenInner: { flex: 1, paddingHorizontal: 20, paddingBottom: 118 },
  brandBanner: { marginHorizontal: -20, paddingHorizontal: 20, paddingBottom: 22, backgroundColor: palette.blush, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 52, height: 52 },
  brandLogoCompact: { width: 52, height: 52 },
  brandName: { color: palette.plum, fontSize: 20, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: 0.3 },
  brandNameCompact: { fontSize: 20 },
  brandSub: { color: palette.mutedForeground, fontSize: 12, marginTop: 3, letterSpacing: 0.55 },
  appFooter: { color: palette.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 28, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  eyebrow: { color: palette.rose, fontSize: 10, letterSpacing: 1.7, fontWeight: '700', marginBottom: 5 },
  sectionTitle: { color: palette.plum, fontSize: 23, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.4 },
  actionText: { color: palette.primary, fontSize: 13, fontWeight: '700', paddingBottom: 2 },
  card: { backgroundColor: palette.card, borderRadius: 22, padding: 17, borderWidth: 1, borderColor: palette.border, shadowColor: palette.plum, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  pill: { minHeight: 38, paddingHorizontal: 14, borderRadius: 20, backgroundColor: palette.warm, borderWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pillCompact: { minHeight: 34, paddingHorizontal: 10 },
  pillSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  pillText: { color: palette.plum, fontSize: 13, fontWeight: '600' },
  pillTextSelected: { color: palette.cream },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 18, shadowColor: palette.primary, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  secondaryButton: { backgroundColor: palette.secondary, shadowOpacity: 0 },
  primaryButtonText: { color: palette.cream, fontSize: 15, fontWeight: '700' },
  secondaryButtonText: { color: palette.plum },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  metric: { flex: 1, minHeight: 76, backgroundColor: palette.cream, borderRadius: 16, padding: 12, justifyContent: 'center' },
  metricCompact: { minHeight: 66, padding: 9, borderRadius: 14 },
  metricValue: { fontSize: 21, fontWeight: '700', marginBottom: 4 },
  metricValueCompact: { fontSize: 20, marginBottom: 0 },
  metricLabel: { color: palette.mutedForeground, fontSize: 11, lineHeight: 14 },
  metricLabelCompact: { fontSize: 10, lineHeight: 12 },
  field: { marginBottom: 15 },
  fieldLabel: { color: palette.plum, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 15, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, color: palette.foreground, fontSize: 16 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.warm },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
});