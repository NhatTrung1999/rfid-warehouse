import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── DYNAMIC COLUMN WIDTH ─────────────────────────────────────
function calcColWidths<K extends string, T extends Record<K, unknown>>(
  cols: ReadonlyArray<{ readonly label: string; readonly key: K }>,
  data: T[],
  charWidth = 8,
  paddingH = 20,
  minW = 50,
) {
  return cols.map((col) => {
    const maxDataLen = data.reduce((max, row) => {
      const val = String(row[col.key] ?? '');
      return Math.max(max, val.length);
    }, 0);
    const width = Math.max(
      minW,
      Math.max(col.label.length, maxDataLen) * charWidth + paddingH,
    );
    return { label: col.label, key: col.key, width };
  });
}

// ─── DỮ LIỆU MẪU ──────────────────────────────────────────────
const HISTORY = [
  {
    DeliverNO: 'DeliverNO DeliverNO',
    From: 'From',
    To: 'To',
    DeliverPerson: 'Deliver Person',
    Quant: 'Quant',
    Account: 'Account',
    Date: 'Date',
    Remark: 'Remark',
    Purpose: 'Purpose',
  },
  {
    DeliverNO: 'DeliverNO1',
    From: 'From1',
    To: 'To1',
    DeliverPerson: 'Deliver Person1',
    Quant: 'Quant1',
    Account: 'Account1',
    Date: 'Date1',
    Remark: 'Remark1',
    Purpose: 'Purpose1',
  },
];

const TAGS = [
  {
    Scan: 'Scan',
    EPC: 'EPC',
    PH: 'PH',
    Note: 'Note',
    NoticeNo: 'Notice No',
    SerialNo: 'SerialNo',
    Article: 'Article',
    FD: 'FD',
    DevTp: 'DevTp',
    Stage: 'Stage',
    Season: 'Season',
    ShoesType: 'ShoesType',
    Size: 'Size',
    Carton: 'Carton',
  },
  {
    Scan: 'Scan1',
    EPC: 'EPC1',
    PH: 'PH1',
    Note: 'Note1',
    NoticeNo: 'Notice No1',
    SerialNo: 'SerialNo1',
    Article: 'Article1',
    FD: 'FD1',
    DevTp: 'DevTp1',
    Stage: 'Stage1',
    Season: 'Season1',
    ShoesType: 'ShoesType1',
    Size: 'Size1',
    Carton: 'Carton1',
  },
];

const SHELVES = ['2FFG - A1', '2FFG - A2'];
const CARTONS = ['2FFG - A1 - 001', '2FFG - A1 - 002'];

const HIST_COLS_DEF = [
  { label: 'DeliverNO', key: 'DeliverNO' },
  { label: 'From', key: 'From' },
  { label: 'To', key: 'To' },
  { label: 'Deliver Person', key: 'DeliverPerson' },
  { label: 'Quant', key: 'Quant' },
  { label: 'Account', key: 'Account' },
  { label: 'Date', key: 'Date' },
  { label: 'Remark', key: 'Remark' },
  { label: 'Purpose', key: 'Purpose' },
] as const;
const TAG_COLS_DEF = [
  { label: 'Scan', key: 'Scan' },
  { label: 'EPC', key: 'EPC' },
  { label: 'PH', key: 'PH' },
  { label: 'Note', key: 'Note' },
  { label: 'Notice No', key: 'NoticeNo' },
  { label: 'SerialNo', key: 'SerialNo' },
  { label: 'Article', key: 'Article' },
  { label: 'FD', key: 'FD' },
  { label: 'DevTp', key: 'DevTp' },
  { label: 'Stage', key: 'Stage' },
  { label: 'Season', key: 'Season' },
  { label: 'ShoesType', key: 'ShoesType' },
  { label: 'Size', key: 'Size' },
  { label: 'Carton', key: 'Carton' },
] as const;

// ─── DROPDOWN ─────────────────────────────────────────────────
function CompactDropdown({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center bg-white border-2 border-slate-200 rounded-2xl px-3 h-11"
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          className="flex-1 text-sm font-medium text-slate-900"
          numberOfLines={1}
        >
          {value}
        </Text>
        <Feather name="chevron-down" size={15} color="#94A3B8" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-slate-900/40 justify-center items-center"
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View className="bg-white rounded-3xl w-3/4 max-h-[55%] overflow-hidden shadow-xl">
            {/* Modal header */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-slate-100">
              <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Select Option
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const sel = item === value;
                return (
                  <TouchableOpacity
                    className={`flex-row justify-between items-center px-4 py-4 border-b border-slate-50 ${sel ? 'bg-blue-50' : ''}`}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-[15px] ${sel ? 'font-bold text-blue-600' : 'font-medium text-slate-800'}`}
                    >
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

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function CheckIn() {
  const router = useRouter();
  const [shelf, setShelf] = useState(SHELVES[0]);
  const [carton, setCarton] = useState(CARTONS[0]);
  const [no, setNo] = useState(1);
  const [punchHole, setPunchHole] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selHist, setSelHist] = useState<number | null>(4);
  const [selTag, setSelTag] = useState<number | null>(0);

  // Tính width động theo nội dung thực tế
  const histCols = useMemo(() => calcColWidths(HIST_COLS_DEF, HISTORY), []);
  const tagCols = useMemo(() => calcColWidths(TAG_COLS_DEF, TAGS), []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── HEADER ── */}
      <View className="flex-row items-center px-4 py-2.5 bg-white border-b border-slate-100">
        <TouchableOpacity
          className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 items-center justify-center mr-3"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={17} color="#0F172A" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">Check In</Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            RFID Tag Scanner
          </Text>
        </View>

        <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
          <Feather
            name="map-pin"
            size={10}
            color="#3B82F6"
            style={{ marginRight: 4 }}
          />
          <Text
            className="text-[10px] font-bold text-blue-700"
            numberOfLines={1}
          >
            2F FG W/H
          </Text>
        </View>
      </View>

      {/* ── TOOLBAR ── */}
      <View className="bg-white border-b border-slate-200 px-4 pt-2.5 pb-2.5 shadow-sm">
        {/* Row 1: Shelf + Carton */}
        <View className="flex-row mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Shelf
            </Text>
            <CompactDropdown
              value={shelf}
              options={SHELVES}
              onSelect={setShelf}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Carton No.
            </Text>
            <CompactDropdown
              value={carton}
              options={CARTONS}
              onSelect={setCarton}
            />
          </View>
        </View>

        {/* Row 2: No. stepper + Punch Hole */}
        <View className="flex-row mb-2">
          {/* No. stepper */}
          <View className="flex-1 flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 h-10 mr-3">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              No.
            </Text>
            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                className="w-6 h-6 rounded-lg bg-white border border-slate-200 items-center justify-center"
                onPress={() => setNo(Math.max(1, no - 1))}
                activeOpacity={0.7}
              >
                <Feather name="minus" size={12} color="#64748B" />
              </TouchableOpacity>
              <Text className="text-sm font-bold text-slate-900 w-7 text-center">
                {no}
              </Text>
              <TouchableOpacity
                className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 items-center justify-center"
                onPress={() => setNo(no + 1)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={12} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Punch Hole toggle */}
          <View className="flex-1 flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 h-10">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Punch Hole
            </Text>
            <Switch
              value={punchHole}
              onValueChange={setPunchHole}
              trackColor={{ true: '#3B82F6', false: '#CBD5E1' }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
            />
          </View>
        </View>

        {/* Row 3: SCAN + SAVE */}
        <View className="flex-row mb-2">
          <TouchableOpacity
            className={`flex-1 h-11 rounded-2xl flex-row justify-center items-center mr-2 ${scanning ? 'bg-red-500' : 'bg-blue-600'}`}
            onPress={() => setScanning(!scanning)}
            activeOpacity={0.8}
          >
            <Feather
              name={scanning ? 'square' : 'radio'}
              size={15}
              color="white"
              style={{ marginRight: 7 }}
            />
            <Text className="text-sm font-bold text-white tracking-wider">
              {scanning ? 'STOP' : 'SCAN'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 h-11 bg-emerald-500 rounded-2xl flex-row justify-center items-center"
            activeOpacity={0.8}
          >
            <Feather
              name="save"
              size={15}
              color="white"
              style={{ marginRight: 7 }}
            />
            <Text className="text-sm font-bold text-white">SAVE</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4: Ghost buttons */}
        <View className="flex-row gap-2">
          {(
            [
              {
                icon: 'refresh-cw',
                label: 'Refresh',
                bg: '#EFF6FF',
                border: '#BFDBFE',
                iconColor: '#2563EB',
                textColor: '#1D4ED8',
              },
              {
                icon: 'trash-2',
                label: 'Clear',
                bg: '#FEF2F2',
                border: '#FECACA',
                iconColor: '#DC2626',
                textColor: '#B91C1C',
              },
              {
                icon: 'crosshair',
                label: 'Location',
                bg: '#F0FDF4',
                border: '#BBF7D0',
                iconColor: '#16A34A',
                textColor: '#15803D',
              },
            ] as const
          ).map((btn) => (
            <TouchableOpacity
              key={btn.label}
              style={{
                flex: 1,
                height: 32,
                backgroundColor: btn.bg,
                borderWidth: 1,
                borderColor: btn.border,
                borderRadius: 11,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Feather
                name={btn.icon}
                size={12}
                color={btn.iconColor}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: btn.textColor,
                }}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── BẢNG HISTORY ── */}
      <View className="flex-1 bg-white border-b-4 border-slate-200">
        {/* Section label */}
        <View className="flex-row items-center px-4 pt-2 pb-1 gap-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            History
          </Text>
          <View className="bg-blue-50 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold text-blue-600">
              {HISTORY.length}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Sticky-style header — width tính động */}
            <View
              className="flex-row border-b-2 border-blue-100"
              style={{ backgroundColor: '#F0F5FF' }}
            >
              {histCols.map((c) => (
                <View
                  key={c.label}
                  style={{ width: c.width }}
                  className="px-3 py-2.5 border-r border-blue-100 justify-center"
                >
                  <Text
                    className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider"
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>

            <FlatList
              data={HISTORY}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => {
                const sel = selHist === index;
                const rowBg = sel
                  ? '#EFF6FF'
                  : index % 2 === 0
                    ? '#FFFFFF'
                    : '#F8FAFC';
                return (
                  <TouchableOpacity
                    className="flex-row border-b border-slate-100 items-center"
                    style={{ backgroundColor: rowBg }}
                    onPress={() => setSelHist(index)}
                    activeOpacity={0.7}
                  >
                    {sel && (
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          backgroundColor: '#3B82F6',
                          zIndex: 1,
                        }}
                      />
                    )}
                    {histCols.map((col, ci) => (
                      <Text
                        key={ci}
                        style={{ width: col.width }}
                        className={`px-3 py-2.5 border-r border-slate-100 text-[12px] ${sel ? 'text-blue-700 font-semibold' : 'text-slate-600 font-normal'}`}
                        numberOfLines={1}
                      >
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

      {/* ── BẢNG TAGS ── */}
      <View className="flex-[1.2] bg-white">
        {/* Section label */}
        <View className="flex-row items-center px-4 pt-2 pb-1 gap-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Scanned Tags
          </Text>
          <View
            className={`flex-row items-center px-2 py-0.5 rounded-md gap-1 ${scanning ? 'bg-blue-50' : 'bg-slate-100'}`}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: scanning ? '#3B82F6' : '#94A3B8',
              }}
            />
            <Text
              className={`text-[10px] font-bold ${scanning ? 'text-blue-600' : 'text-slate-400'}`}
            >
              {TAGS.length}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          persistentScrollbar
        >
          <View>
            {/* Sticky-style header — width tính động */}
            <View
              className="flex-row border-b-2 border-blue-100"
              style={{ backgroundColor: '#F0F5FF' }}
            >
              {tagCols.map((c) => (
                <View
                  key={c.label}
                  style={{ width: c.width }}
                  className="px-3 py-2.5 border-r border-blue-100 justify-center"
                >
                  <Text
                    className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider"
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>

            <FlatList
              data={TAGS}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => {
                const sel = selTag === index;
                const rowBg = sel
                  ? '#EFF6FF'
                  : index % 2 === 0
                    ? '#FFFFFF'
                    : '#F8FAFC';
                return (
                  <TouchableOpacity
                    className="flex-row border-b border-slate-100 items-center"
                    style={{ backgroundColor: rowBg }}
                    onPress={() => setSelTag(index)}
                    activeOpacity={0.7}
                  >
                    {sel && (
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          backgroundColor: '#3B82F6',
                          zIndex: 1,
                        }}
                      />
                    )}
                    {tagCols.map((col, ci) => (
                      <Text
                        key={ci}
                        style={{ width: col.width }}
                        className={`px-3 py-2.5 border-r border-slate-100 text-[12px] ${sel ? 'text-blue-700 font-semibold' : 'text-slate-600 font-normal'}`}
                        numberOfLines={1}
                      >
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
