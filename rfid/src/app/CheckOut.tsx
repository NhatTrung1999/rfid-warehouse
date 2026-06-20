import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList, Modal, ScrollView, StatusBar,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── DYNAMIC COLUMN WIDTH ─────────────────────────────────────
function calcColWidths<
  K extends string,
  T extends Record<K, unknown>
>(
  cols: ReadonlyArray<{ readonly label: string; readonly key: K }>,
  data: T[],
  charWidth = 8,
  paddingH = 24,
  minW = 50,
) {
  return cols.map(col => {
    const maxDataLen = data.reduce((max, row) => {
      const val = String(row[col.key] ?? '');
      return Math.max(max, val.length);
    }, 0);
    const width = Math.max(minW, (Math.max(col.label.length, maxDataLen) * charWidth) + paddingH);
    return { label: col.label, key: col.key, width };
  });
}

// ─── DỮ LIỆU MẪU ─────────────────────────────────────────────
const FROM_LIST = ['2FFG', '3FFG', '4FFG', '2MCS', '3MCS'];
const TO_LIST = ['2FFG', '3FFG', '4FFG', '2MCS', '3MCS'];
const REASON_LIST = ['還回 Hoàn trả', 'Transfer', 'Repair', 'Dispose'];

const SCAN_DATA = [
  {
    EPC: 'EPC',
    Category: 'Category',
    NoticeNo: 'NoticeNo',
    CartonNumber: 'CartonNumber',
    Action: 'Action',
    Article: 'Article',
    PH: 'PH',
    FD: 'FD',
    DevTp: 'DevTp',
    Stage: 'Stage',
    Season: 'Season',
    ShoeName: 'ShoeName',
    Size: 'Size',
    ShoesType: 'ShoesType',
  }
];

const SCAN_COLS_DEF = [
  { label: 'EPC', key: 'EPC' },
  { label: 'Category', key: 'Category' },
  { label: 'Notice No', key: 'NoticeNo' },
  { label: 'Carton Number', key: 'CartonNumber' },
  { label: 'Action', key: 'Action' },
  { label: 'Article', key: 'Article' },
  { label: 'PH', key: 'PH' },
  { label: 'FD', key: 'FD' },
  { label: 'DevTp', key: 'DevTp' },
  { label: 'Stage', key: 'Stage' },
  { label: 'Season', key: 'Season' },
  { label: 'ShoeName', key: 'ShoeName' },
  { label: 'Size', key: 'Size' },
  { label: 'ShoesType', key: 'ShoesType' },
] as const;

// ─── COMPACT DROPDOWN ─────────────────────────────────────────
function CompactDropdown({
  value, options, onSelect, placeholder,
}: {
  value: string; options: string[]; onSelect: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center bg-white border-2 border-slate-200 rounded-xl px-3 h-10"
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          className={`flex-1 text-sm font-medium ${value ? 'text-slate-900' : 'text-slate-400'}`}
          numberOfLines={1}
        >
          {value || placeholder || 'Select...'}
        </Text>
        <Feather name="chevron-down" size={14} color="#94A3B8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-slate-900/40 justify-center items-center"
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View className="bg-white rounded-3xl w-3/4 max-h-[55%] overflow-hidden shadow-xl">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-slate-100">
              <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Select Option</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const sel = item === value;
                return (
                  <TouchableOpacity
                    className={`flex-row justify-between items-center px-4 py-4 border-b border-slate-50 ${sel ? 'bg-blue-50' : ''}`}
                    onPress={() => { onSelect(item); setOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-[15px] ${sel ? 'font-bold text-blue-600' : 'font-medium text-slate-800'}`}>
                      {item}
                    </Text>
                    {sel && <Feather name="check" size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── CHECKBOX ─────────────────────────────────────────────────
function Checkbox({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) {
  return (
    <TouchableOpacity
      className="flex-row items-center gap-1.5"
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 18, height: 18, borderRadius: 5, borderWidth: 2,
          borderColor: value ? '#3B82F6' : '#CBD5E1',
          backgroundColor: value ? '#3B82F6' : '#FFFFFF',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {value && <Feather name="check" size={11} color="white" />}
      </View>
      <Text className="text-[12px] font-semibold text-slate-700">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function CheckOut() {
  const router = useRouter();
  const { warehouse } = useLocalSearchParams<{ warehouse: string }>();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [destroy, setDestroy] = useState(false);
  const [noReturn, setNoReturn] = useState(false);
  const [punchHole, setPunchHole] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [reason, setReason] = useState(REASON_LIST[0]);

  const [selRow, setSelRow] = useState<number | null>(null);
  const [returnDate] = useState('2026/06/16');

  const scanCols = useMemo(() => calcColWidths(SCAN_COLS_DEF, SCAN_DATA), []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── HEADER ── */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 items-center justify-center mr-3"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#0F172A" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">Check Out</Text>
          <Text className="text-[11px] text-slate-400 mt-0.5">RFID Tag Scanner</Text>
        </View>

        <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5">
          <Feather name="map-pin" size={11} color="#3B82F6" style={{ marginRight: 4 }} />
          <Text className="text-[10px] font-bold text-blue-700" numberOfLines={1}>
            {warehouse ?? 'N/A'}
          </Text>
        </View>
      </View>

      {/* ── TOOLBAR ── */}
      <View className="bg-white border-b border-slate-200 px-4 pt-3 pb-3 gap-3">

        {/* Row 1: FROM / TO / User Scan */}
        <View className="flex-row items-end gap-2">
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</Text>
            <CompactDropdown value={from} options={FROM_LIST} onSelect={setFrom} placeholder="Select" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To</Text>
            <CompactDropdown value={to} options={TO_LIST} onSelect={setTo} placeholder="Select" />
          </View>
          <TouchableOpacity
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 h-10 flex-row items-center gap-1.5"
            activeOpacity={0.7}
          >
            <Feather name="user" size={13} color="#475569" />
            <Text className="text-[12px] font-semibold text-slate-600">User Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Return Date / Clear / Save */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-white border-2 border-slate-200 rounded-xl px-3 h-10 gap-1.5">
            <Feather name="calendar" size={13} color="#3B82F6" />
            <Text className="text-[12px] font-semibold text-slate-700 flex-1">{returnDate}</Text>
            <Feather name="chevron-down" size={13} color="#94A3B8" />
          </View>
          <TouchableOpacity
            style={{ height: 40, paddingHorizontal: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={13} color="#DC2626" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#B91C1C' }}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ height: 40, paddingHorizontal: 16, backgroundColor: '#10B981', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }}
            activeOpacity={0.8}
          >
            <Feather name="save" size={13} color="white" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Destroy / No Return / Punch Hole */}
        <View className="flex-row items-center justify-between">
          <Checkbox value={destroy} onToggle={() => setDestroy(!destroy)} label="Destroy" />
          <Checkbox value={noReturn} onToggle={() => setNoReturn(!noReturn)} label="No Return" />
          <Checkbox value={punchHole} onToggle={() => setPunchHole(!punchHole)} label="Punch Hole" />
        </View>

        {/* Row 4: Reason / SCAN full width */}
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason</Text>
          <View style={{ flex: 1 }}>
            <CompactDropdown value={reason} options={REASON_LIST} onSelect={setReason} />
          </View>
          <TouchableOpacity
            style={{
              height: 44, paddingHorizontal: 20,
              backgroundColor: scanning ? '#EF4444' : '#3B82F6',
              borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 6,
              shadowColor: scanning ? '#EF4444' : '#3B82F6',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
            }}
            onPress={() => setScanning(!scanning)}
            activeOpacity={0.8}
          >
            <Feather name={scanning ? 'square' : 'radio'} size={15} color="white" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: 'white', letterSpacing: 1 }}>
              {scanning ? 'STOP' : 'SCAN'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── BẢNG SCAN ── */}
      <View className="flex-1 bg-white">
        {/* Section label */}
        <View className="flex-row items-center px-4 pt-2.5 pb-1.5 gap-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanned Tags</Text>
          <View className={`flex-row items-center px-2 py-0.5 rounded-md gap-1 ${scanning ? 'bg-blue-50' : 'bg-slate-100'}`}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: scanning ? '#3B82F6' : '#94A3B8' }} />
            <Text className={`text-[10px] font-bold ${scanning ? 'text-blue-600' : 'text-slate-400'}`}>
              {SCAN_DATA.length}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} persistentScrollbar>
          <View>
            {/* Header */}
            <View className="flex-row border-b-2 border-blue-100" style={{ backgroundColor: '#F0F5FF' }}>
              {scanCols.map(c => (
                <View key={c.label} style={{ width: c.width }}
                  className="px-3 py-2.5 border-r border-blue-100 justify-center">
                  <Text className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider"
                    numberOfLines={1}>{c.label}</Text>
                </View>
              ))}
            </View>

            <FlatList
              data={SCAN_DATA}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => {
                const sel = selRow === index;
                const rowBg = sel ? '#EFF6FF' : index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                return (
                  <TouchableOpacity
                    className="flex-row border-b border-slate-100 items-center"
                    style={{ backgroundColor: rowBg }}
                    onPress={() => setSelRow(index)}
                    activeOpacity={0.7}
                  >
                    {sel && (
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#3B82F6', zIndex: 1 }} />
                    )}
                    {scanCols.map((col, ci) => (
                      <Text key={ci}
                        style={{ width: col.width }}
                        className={`px-3 py-3.5 border-r border-slate-100 text-[12px] ${sel ? 'text-blue-700 font-semibold' : 'text-slate-600 font-normal'}`}
                        numberOfLines={1}>
                        {String(item[col.key] ?? '')}
                      </Text>
                    ))}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}