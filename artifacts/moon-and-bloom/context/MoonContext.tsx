import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Flow = 'None' | 'Spotting' | 'Light' | 'Medium' | 'Heavy';
export type Mood = 'Low' | 'Irritable' | 'Sensitive' | 'Anxious' | 'Calm' | 'Happy' | 'Energetic' | 'Emotional' | 'Focused';
export type RemedyCategory = 'Teas' | 'Herbs' | 'Homeopathy' | 'Foods' | 'Supplements' | 'Movement' | 'Comfort' | 'Self-care' | 'My rituals';

export interface DailyLog {
  date: string;
  flow: Flow;
  energy?: string;
  mood: Mood[];
  sleep?: string;
  symptoms: string[];
  note?: string;
  remedyIds: string[];
}

export interface Remedy {
  id: string;
  name: string;
  category: RemedyCategory;
  description: string;
  phase: string;
  favorite: boolean;
  helped?: 'Helped' | 'Maybe' | 'No noticeable difference' | 'Did not help';
}

export interface MoonData {
  initialized: boolean;
  lastPeriodStart: string;
  typicalCycleLength: number;
  periodLength: number;
  periodDays: string[];
  logs: Record<string, DailyLog>;
  remedies: Remedy[];
  appName: string;
  subtitle: string;
}

const STORAGE_KEY = 'moon-and-bloom-local-v1';

export const starterRemedies: Remedy[] = [
  { id: 'ginger', name: 'Ginger tea', category: 'Teas', description: 'Ginger has evidence for easing nausea and may help reduce menstrual cramp intensity. Check with a clinician if you take blood-thinning medicine.', phase: 'Menstrual', favorite: true },
  { id: 'chamomile', name: 'Chamomile tea', category: 'Teas', description: 'Chamomile may support relaxation and sleep, and small studies suggest it may ease menstrual discomfort. Avoid it if you are allergic to ragweed-family plants.', phase: 'Luteal', favorite: true },
  { id: 'peppermint', name: 'Peppermint tea', category: 'Teas', description: 'Peppermint may relax digestive muscles and ease bloating, gas, or nausea. It can worsen reflux for some people.', phase: 'Any phase', favorite: false },
  { id: 'fennel', name: 'Fennel tea', category: 'Teas', description: 'Small studies suggest fennel may help with menstrual cramps and bloating. Avoid it if you are allergic to carrot- or celery-family plants.', phase: 'Menstrual', favorite: false },
  { id: 'lemon-balm', name: 'Lemon balm tea', category: 'Teas', description: 'Lemon balm may support calm and sleep in limited studies. It can cause drowsiness, so it is often better suited to evenings.', phase: 'Luteal', favorite: false },
  { id: 'raspberry-leaf-tea', name: 'Raspberry leaf tea', category: 'Teas', description: 'Raspberry leaf is traditionally used for menstrual comfort, but evidence is limited. Ask a clinician before using it during pregnancy or with regular medicines.', phase: 'Menstrual', favorite: false },
  { id: 'sage-tea', name: 'Sage tea', category: 'Teas', description: 'Small studies have explored sage for menopause-related hot flashes and sweating. Avoid concentrated amounts; sage can interact with medicines and contains thujone.', phase: 'Menopause', favorite: false },
  { id: 'hops-tea', name: 'Hops tea', category: 'Teas', description: 'Hops has been studied for menopause-related hot flashes and sleep, but evidence is limited. It may cause drowsiness and may not suit people with hormone-sensitive conditions.', phase: 'Menopause', favorite: false },
  { id: 'valerian-tea', name: 'Valerian tea', category: 'Teas', description: 'Valerian may support sleep during hormonally disruptive nights, though results vary. Do not combine it with alcohol or sedating medicines without medical guidance.', phase: 'Menopause', favorite: false },
  { id: 'turmeric', name: 'Turmeric', category: 'Herbs', description: 'Curcumin, a compound in turmeric, has anti-inflammatory effects. Early research suggests it may support comfort around menstruation when used regularly with food.', phase: 'Any phase', favorite: false },
  { id: 'cinnamon', name: 'Cinnamon', category: 'Herbs', description: 'Small studies suggest cinnamon may help reduce menstrual cramp intensity, nausea, and heavier flow. Culinary amounts are the safest place to start.', phase: 'Menstrual', favorite: false },
  { id: 'lions-mane', name: 'Lion’s mane', category: 'Herbs', description: 'Early research is exploring lion’s mane for memory, focus, and mood, but evidence is still limited and it is not a proven cycle remedy. Stop if you notice an allergic reaction.', phase: 'Any phase', favorite: false },
  { id: 'cardamom', name: 'Cardamom', category: 'Herbs', description: 'Cardamom is traditionally used to support digestion and may help ease gas or bloating. Use it as a culinary spice or tea; concentrated supplements can interact with medicines.', phase: 'Any phase', favorite: false },
  { id: 'cloves', name: 'Cloves', category: 'Herbs', description: 'Cloves contain eugenol and are traditionally used for digestive and mouth comfort. Culinary amounts are the safest choice; concentrated clove oil should not be swallowed.', phase: 'Any phase', favorite: false },
  { id: 'red-clover', name: 'Red clover', category: 'Herbs', description: 'Red clover contains plant isoflavones studied mostly for menopausal hot flashes, with mixed results. It may interact with blood thinners or hormone-sensitive conditions.', phase: 'Any phase', favorite: false },
  { id: 'moringa', name: 'Moringa', category: 'Herbs', description: 'Moringa leaves provide nutrients and antioxidants, but strong evidence for cycle or symptom benefits is limited. Choose a reputable product and ask a clinician about supplement use.', phase: 'Any phase', favorite: false },
  { id: 'hibiscus', name: 'Hibiscus', category: 'Herbs', description: 'Hibiscus tea is rich in plant compounds and may support healthy blood pressure in some adults. It can lower blood pressure or interact with medicines, so use care if either applies to you.', phase: 'Any phase', favorite: false },
  { id: 'lavender', name: 'Lavender aroma', category: 'Herbs', description: 'Breathing in lavender aroma may support relaxation and ease stress. Use it as aromatherapy rather than swallowing essential oil.', phase: 'Luteal', favorite: false },
  { id: 'cramp-bark', name: 'Cramp bark', category: 'Herbs', description: 'Cramp bark is traditionally used for menstrual muscle spasms, but modern evidence is limited. Ask a clinician before use, especially with kidney or liver conditions or regular medicines.', phase: 'Menstrual', favorite: false },
  { id: 'vitex', name: 'Vitex (chasteberry)', category: 'Herbs', description: 'Vitex is traditionally used for PMS and cycle-related breast tenderness, but evidence is mixed. It may interact with hormonal or dopamine medicines and is not recommended during pregnancy without clinical guidance.', phase: 'Luteal', favorite: false },
  { id: 'dong-quai', name: 'Dong quai', category: 'Herbs', description: 'Dong quai is traditionally used for menstrual and menopause symptoms, but evidence is limited. It may increase bleeding risk and can interact with blood thinners; avoid during pregnancy unless prescribed.', phase: 'Menstrual', favorite: false },
  { id: 'nettle-leaf', name: 'Nettle leaf', category: 'Herbs', description: 'Nettle leaf provides minerals and is traditionally used for general wellness. It may affect blood pressure, blood sugar, or fluid balance and can interact with diuretics or other medicines.', phase: 'Any phase', favorite: false },
  { id: 'black-cohosh', name: 'Black cohosh', category: 'Herbs', description: 'Black cohosh is one of the more studied herbs for menopause hot flashes, but results are mixed and rare liver problems have been reported. Stop and seek care for yellowing skin, dark urine, or unusual fatigue.', phase: 'Menopause', favorite: false },
  { id: 'shatavari', name: 'Shatavari', category: 'Herbs', description: 'Shatavari is used traditionally for reproductive and menopause wellness, but high-quality evidence is limited. Use caution with hormone-sensitive conditions or hormone medicines.', phase: 'Perimenopause', favorite: false },
  { id: 'maca', name: 'Maca', category: 'Herbs', description: 'Maca is being studied for menopause-related mood, energy, and sexual well-being, but evidence is still limited. Choose a reputable product and ask a clinician if you have a hormone-sensitive condition.', phase: 'Menopause', favorite: false },
  { id: 'homeopathic-sepia', name: 'Homeopathic Sepia', category: 'Homeopathy', description: 'Homeopathic Sepia is marketed for PMS and menopause symptoms, but reliable evidence has not shown homeopathy works beyond placebo. Do not use it instead of medical care or prescribed treatment.', phase: 'Perimenopause', favorite: false },
  { id: 'homeopathic-lachesis', name: 'Homeopathic Lachesis', category: 'Homeopathy', description: 'Homeopathic Lachesis is marketed for hot flashes and menopause symptoms, but reliable evidence has not shown homeopathy works beyond placebo. Check ingredients and speak with a clinician before use.', phase: 'Menopause', favorite: false },
  { id: 'homeopathic-pulsatilla', name: 'Homeopathic Pulsatilla', category: 'Homeopathy', description: 'Homeopathic Pulsatilla is marketed for changing menstrual symptoms, but reliable evidence has not shown homeopathy works beyond placebo. Do not delay evaluation of heavy, painful, or unusual bleeding.', phase: 'Menstrual', favorite: false },
  { id: 'homeopathic-sulphur', name: 'Homeopathic Sulphur', category: 'Homeopathy', description: 'Homeopathic Sulphur is marketed for hot flashes and skin symptoms, but reliable evidence has not shown homeopathy works beyond placebo. Some products may contain active ingredients or alcohol; read the label carefully.', phase: 'Menopause', favorite: false },
  { id: 'evening-primrose-oil', name: 'Evening primrose oil', category: 'Homeopathy', description: 'Evening primrose oil is often used for breast tenderness and PMS, but research results are mixed. It may interact with blood thinners or seizure medicines; ask a clinician before using it.', phase: 'Luteal', favorite: false },
  { id: 'black-seed-oil', name: 'Black seed oil', category: 'Homeopathy', description: 'Black seed oil is being studied for inflammation and metabolic health, but evidence for cycle symptoms is limited. It may affect blood sugar or blood pressure and can interact with medicines.', phase: 'Any phase', favorite: false },
  { id: 'peppermint-oil', name: 'Peppermint essential oil', category: 'Homeopathy', description: 'Diluted peppermint oil aroma may feel cooling during hot flashes or support comfort with tension. Never swallow essential oil or apply it undiluted; use caution with reflux, children, pets, and sensitive skin.', phase: 'Menopause', favorite: false },
  { id: 'lavender-essential-oil', name: 'Lavender essential oil', category: 'Homeopathy', description: 'Lavender aromatherapy may support relaxation and sleep during PMS or menopause. Dilute for skin use, avoid swallowing it, and stop if irritation, headache, or breathing symptoms occur.', phase: 'Any phase', favorite: false },
  { id: 'clary-sage-essential-oil', name: 'Clary sage essential oil', category: 'Homeopathy', description: 'Clary sage is used in aromatherapy for relaxation and menstrual comfort, but evidence is limited. Use only diluted, never swallow it, and ask a clinician before use during pregnancy or with hormone-sensitive conditions.', phase: 'Menstrual', favorite: false },
  { id: 'geranium-essential-oil', name: 'Geranium essential oil', category: 'Homeopathy', description: 'Geranium aroma may be calming and is sometimes used for cycle-related mood changes, but evidence is limited. Diffuse carefully, dilute for skin use, and avoid ingestion.', phase: 'Luteal', favorite: false },
  { id: 'warmth', name: 'Heating pad', category: 'Comfort', description: 'Heat therapy has good evidence for easing menstrual cramps by relaxing muscles and increasing local blood flow. Use a comfortably warm setting and protect your skin.', phase: 'Menstrual', favorite: true },
  { id: 'warm-bath', name: 'Warm bath', category: 'Comfort', description: 'Warm water can relax tense muscles and may ease cramps or lower-back discomfort. Keep the temperature comfortable and hydrate afterward.', phase: 'Menstrual', favorite: false },
  { id: 'cooling-kit', name: 'Cooling cloth or fan', category: 'Comfort', description: 'A cool cloth, fan, or cooling neck wrap may make hot flashes more manageable. Keep water nearby and seek medical advice for fainting, chest pain, or severe symptoms.', phase: 'Menopause', favorite: false },
  { id: 'abdominal-massage', name: 'Gentle abdominal massage', category: 'Comfort', description: 'Slow circular massage with comfortable pressure may ease menstrual cramping and tension. Stop if pain increases, and seek care for severe or unusual pain.', phase: 'Menstrual', favorite: false },
  { id: 'breathable-layers', name: 'Breathable layers', category: 'Comfort', description: 'Light, removable layers and breathable sleepwear can make temperature swings and night sweats easier to manage. Natural fabrics may feel more comfortable for some people.', phase: 'Menopause', favorite: false },
  { id: 'warm-socks', name: 'Warm socks and a cozy wrap', category: 'Comfort', description: 'Gentle warmth around the feet or lower back can feel soothing during cramps or chills. Avoid excessive heat and protect your skin while sleeping.', phase: 'Menstrual', favorite: false },
  { id: 'magnesium-foods', name: 'Magnesium-rich foods', category: 'Foods', description: 'Pumpkin seeds, beans, leafy greens, and dark chocolate provide magnesium, which supports normal muscle and nerve function and may help with cramping when intake is low.', phase: 'Any phase', favorite: false },
  { id: 'iron-foods', name: 'Iron-rich foods', category: 'Foods', description: 'Lentils, beans, tofu, meat, and fortified grains can help replace iron lost through bleeding. Pair plant sources with vitamin C to improve absorption.', phase: 'Menstrual', favorite: false },
  { id: 'omega-3-foods', name: 'Omega-3 foods', category: 'Foods', description: 'Salmon, sardines, walnuts, chia, and flax provide omega-3 fats that support the body’s inflammatory balance. Some studies link regular intake with less menstrual pain.', phase: 'Any phase', favorite: false },
  { id: 'sesame-seeds-seed-cycling', name: 'Sesame seeds (seed cycling)', category: 'Foods', description: 'Seed cycling commonly pairs sesame and sunflower seeds with the second half of the cycle, but research has not established it as a treatment for hormone symptoms. Enjoy food amounts if tolerated, and avoid them with a sesame allergy.', phase: 'Luteal', favorite: false },
  { id: 'sunflower-seeds-seed-cycling', name: 'Sunflower seeds (seed cycling)', category: 'Foods', description: 'Seed cycling commonly pairs sunflower seeds with sesame seeds during the second half of the cycle, but research has not established it as a treatment for hormone symptoms. Enjoy food amounts if tolerated, and check labels for added ingredients or allergies.', phase: 'Luteal', favorite: false },
  { id: 'light-movement', name: 'Light movement', category: 'Self-care', description: 'Walking, stretching, or gentle yoga can increase circulation and may reduce cramps, stiffness, and low mood. Choose an intensity that feels supportive today.', phase: 'Any phase', favorite: false },
  { id: 'paced-breathing', name: 'Paced breathing', category: 'Self-care', description: 'Slow breathing with a longer exhale can help settle the stress response and soften tension. Try inhaling for four counts and exhaling for six.', phase: 'Any phase', favorite: false },
  { id: 'sleep-routine', name: 'Consistent sleep routine', category: 'Self-care', description: 'A regular sleep and wake time supports mood, energy, and recovery. A dim, screen-light evening routine may make winding down easier.', phase: 'Luteal', favorite: false },
];

const mergeStarterRemedies = (savedRemedies: Remedy[] | undefined) => {
  const saved = Array.isArray(savedRemedies) ? savedRemedies : [];
  const starterIds = new Set(starterRemedies.map((item) => item.id));
  const savedById = new Map(saved.map((item) => [item.id, item]));
  return [
    ...starterRemedies.map((starter) => {
      const existing = savedById.get(starter.id);
      return existing ? { ...starter, favorite: existing.favorite, helped: existing.helped } : starter;
    }),
    ...saved.filter((item) => !starterIds.has(item.id)),
  ];
};

const iso = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseISO = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const todayISO = () => iso(new Date());

export const addDays = (value: string, amount: number) => {
  const next = parseISO(value);
  next.setDate(next.getDate() + amount);
  return iso(next);
};

export const daysBetween = (from: string, to: string) => {
  const start = parseISO(from).getTime();
  const end = parseISO(to).getTime();
  return Math.round((end - start) / 86400000);
};

export const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
  parseISO(value).toLocaleDateString('en-US', options ?? { month: 'short', day: 'numeric' });

export const getCycleDay = (lastStart: string, date = todayISO()) => Math.max(1, daysBetween(lastStart, date) + 1);

export const getPhase = (cycleDay: number, cycleLength: number, periodLength: number) => {
  if (cycleDay <= periodLength) return 'Menstrual';
  const ovulationDay = Math.max(periodLength + 4, cycleLength - 14);
  if (cycleDay < ovulationDay - 2) return 'Follicular';
  if (cycleDay <= ovulationDay + 1) return 'Ovulatory';
  return 'Luteal';
};

const initialData: MoonData = {
  initialized: false,
  lastPeriodStart: todayISO(),
  typicalCycleLength: 28,
  periodLength: 5,
  periodDays: [],
  logs: {},
  remedies: starterRemedies,
  appName: 'Moon & Bloom',
  subtitle: 'My private cycle & wellness journal',
};

interface MoonContextValue {
  data: MoonData;
  hydrated: boolean;
  cycleDay: number;
  phase: string;
  nextPeriod: string;
  daysUntilNext: number;
  averageCycle: number;
  averagePeriod: number;
  initialize: (start: string, periodLength: number, cycleLength: number) => void;
  togglePeriodDay: (date: string, flow?: Flow) => void;
  saveLog: (log: DailyLog) => void;
  addRemedy: (remedy: Omit<Remedy, 'id'>) => void;
  toggleFavorite: (id: string) => void;
  updateRemedyHelpfulness: (id: string, helped: Remedy['helped']) => void;
  replaceData: (next: MoonData) => void;
  clearAll: () => void;
  exportJSON: () => string;
}

const MoonContext = createContext<MoonContextValue | null>(null);

const persist = (next: MoonData) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

export function MoonProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MoonData>(initialData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<MoonData>;
          setData({ ...initialData, ...parsed, remedies: mergeStarterRemedies(parsed.remedies) });
        } catch { setData(initialData); }
      }
      setHydrated(true);
    });
  }, []);

  const commit = (next: MoonData) => { setData(next); void persist(next); };

  const initialize = (start: string, periodLength: number, cycleLength: number) => {
    const days = Array.from({ length: periodLength }, (_, index) => addDays(start, index));
    commit({ ...data, initialized: true, lastPeriodStart: start, periodLength, typicalCycleLength: cycleLength, periodDays: days });
  };

  const togglePeriodDay = (date: string, flow: Flow = 'Medium') => {
    const exists = data.periodDays.includes(date);
    const nextDays = exists ? data.periodDays.filter((day) => day !== date) : [...data.periodDays, date].sort();
    const current = data.logs[date] ?? { date, flow: exists ? 'None' : flow, mood: [], symptoms: [], remedyIds: [] };
    const nextLog = { ...current, flow: exists ? 'None' as Flow : flow };
    commit({ ...data, periodDays: nextDays, logs: { ...data.logs, [date]: nextLog } });
  };

  const saveLog = (log: DailyLog) => {
    const periodDays = log.flow !== 'None' && log.flow !== 'Spotting'
      ? Array.from(new Set([...data.periodDays, log.date])).sort()
      : data.periodDays.filter((day) => day !== log.date);
    commit({ ...data, periodDays, logs: { ...data.logs, [log.date]: log } });
  };

  const addRemedy = (remedy: Omit<Remedy, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    commit({ ...data, remedies: [{ ...remedy, id }, ...data.remedies] });
  };

  const toggleFavorite = (id: string) => commit({ ...data, remedies: data.remedies.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item) });
  const updateRemedyHelpfulness = (id: string, helped: Remedy['helped']) => commit({ ...data, remedies: data.remedies.map((item) => item.id === id ? { ...item, helped } : item) });
  const replaceData = (next: MoonData) => commit({ ...initialData, ...next, remedies: mergeStarterRemedies(next.remedies), initialized: true });
  const clearAll = () => { void AsyncStorage.removeItem(STORAGE_KEY); setData(initialData); };

  const lastPeriod = data.lastPeriodStart;
  const cycleDay = getCycleDay(lastPeriod);
  const nextPeriod = addDays(lastPeriod, data.typicalCycleLength);
  const daysUntilNext = daysBetween(todayISO(), nextPeriod);
  const periodStarts = data.periodDays.filter((day) => !data.periodDays.includes(addDays(day, -1))).sort();
  const cycleLengths = periodStarts.slice(-6).slice(0, -1).map((start, index) => daysBetween(start, periodStarts.slice(-6)[index + 1]));
  const averageCycle = cycleLengths.length ? Math.round(cycleLengths.reduce((sum, value) => sum + value, 0) / cycleLengths.length) : data.typicalCycleLength;
  const averagePeriod = data.periodLength;

  const value = useMemo<MoonContextValue>(() => ({
    data, hydrated, cycleDay, phase: getPhase(cycleDay, averageCycle, averagePeriod), nextPeriod, daysUntilNext,
    averageCycle, averagePeriod, initialize, togglePeriodDay, saveLog, addRemedy, toggleFavorite, updateRemedyHelpfulness, replaceData, clearAll,
    exportJSON: () => JSON.stringify(data, null, 2),
  }), [data, hydrated, cycleDay, averageCycle, averagePeriod, nextPeriod, daysUntilNext]);

  return <MoonContext.Provider value={value}>{children}</MoonContext.Provider>;
}

export function useMoon() {
  const context = useContext(MoonContext);
  if (!context) throw new Error('useMoon must be used within MoonProvider');
  return context;
}