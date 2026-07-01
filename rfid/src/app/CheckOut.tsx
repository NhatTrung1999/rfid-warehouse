import { Feather } from '@expo/vector-icons';
import dayjs, { Dayjs } from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateType,
  useDefaultStyles,
} from 'react-native-ui-datepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompactDropdown } from '../components/CompactDropdown';
import { DropdownOption, EpcData } from '../lib/checkout-service';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchFrom,
  fetchTo,
  fetchShelf,
  fetchEPC,
  clearEpcs,
} from '../store/slices/checkoutSlice';

// ─── DYNAMIC COLUMN WIDTH ─────────────────────────────────────
function calcColWidths<K extends string, T extends Record<K, unknown>>(
  cols: ReadonlyArray<{ readonly label: string; readonly key: K }>,
  data: T[],
  charWidth = 8,
  paddingH = 24,
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

// ─── CONSTANTS ────────────────────────────────────────────────
const NO_LIST: DropdownOption[] = ['1', '2', '3', '4', '5'].map((v) => ({
  label: v,
  value: v,
}));

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

// ─── CHECKBOX ─────────────────────────────────────────────────
function Checkbox({
  value,
  onToggle,
  label,
}: {
  value: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center gap-1.5"
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: value ? '#3B82F6' : '#CBD5E1',
          backgroundColor: value ? '#3B82F6' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value && <Feather name="check" size={11} color="white" />}
      </View>
      <Text className="text-[12px] font-semibold text-slate-700">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── DATE PICKER FIELD ────────────────────────────────────────
function DatePickerField({
  value,
  onChange,
}: {
  value: DateType;
  onChange: (d: DateType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateType>(value);
  const defaultStyles = useDefaultStyles();

  const displayText = value
    ? dayjs(value as Dayjs).format('YYYY/MM/DD')
    : 'Select date';

  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center bg-white border-2 border-slate-200 rounded-xl px-3 h-10 gap-1.5"
        onPress={() => {
          setPending(value);
          setOpen(true);
        }}
        activeOpacity={0.7}
      >
        <Feather name="calendar" size={13} color="#3B82F6" />
        <Text
          className={`flex-1 text-[12px] font-semibold ${value ? 'text-slate-700' : 'text-slate-400'}`}
          numberOfLines={1}
        >
          {displayText}
        </Text>
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
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-[20px] p-4"
            style={{ width: 310 }}
          >
            <DateTimePicker
              mode="single"
              date={pending}
              onChange={({ date }) => setPending(date)}
              styles={{
                ...defaultStyles,
                today: {
                  borderWidth: 1.5,
                  borderColor: '#2563EB',
                  borderRadius: 999,
                },
                today_label: {
                  color: '#2563EB',
                  fontWeight: '700',
                },
                selected: {
                  backgroundColor: '#2563EB',
                  borderRadius: 999,
                  borderWidth: 0,
                },
                selected_label: {
                  color: '#FFFFFF',
                  fontWeight: '700',
                },
              }}
            />

            {/* Footer */}
            <View className="flex-row items-center justify-between border-t border-slate-100 pt-3 mt-1">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Selected
                </Text>
                <Text className="text-[13px] font-bold text-slate-900 mt-0.5">
                  {pending ? dayjs(pending as Dayjs).format('YYYY/MM/DD') : '—'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  onChange(pending);
                  setOpen(false);
                }}
                activeOpacity={0.8}
                className="rounded-[10px] px-5 py-2"
                style={{ backgroundColor: pending ? '#2563EB' : '#CBD5E1' }}
              >
                <Text className="text-white text-[13px] font-bold">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function CheckOut() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { warehouse, warehouseLabel } = useLocalSearchParams<{
    warehouse: string;
    warehouseLabel: string;
  }>();

  // ── Redux state ──
  const {
    fromOptions,
    loadingFrom,
    toOptions,
    loadingTo,
    shelfOptions,
    loadingShelf,
    epcs,
    loadingEpcs,
    error,
  } = useAppSelector((state) => state.checkout);

  // ── UI-only local state ──
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [shelf, setShelf] = useState('');
  const [no, setNo] = useState('');
  const [returnDate, setReturnDate] = useState<DateType>(dayjs());
  const [date, setDate] = useState<DateType>(dayjs());
  const [purpose, setPurpose] = useState('');
  const [outsource, setOutsource] = useState('');
  const [reason, setReason] = useState('');
  const [destroy, setDestroy] = useState(false);
  const [punchHole, setPunchHole] = useState(false);
  const [noReturn, setNoReturn] = useState(false);
  const [fg, setFg] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selRow, setSelRow] = useState<number | null>(null);
  const [location, setLocation] = useState('');

  // ── Load From khi warehouse thay đổi ──
  useEffect(() => {
    if (!warehouse) return;
    setFrom('');
    dispatch(fetchFrom(warehouse));
  }, [warehouse]);

  useEffect(() => {
    if (fromOptions.length > 0) setFrom(fromOptions[0].value);
  }, [fromOptions]);

  // ── Load To khi from thay đổi ──
  useEffect(() => {
    if (!from) return;
    setTo('');
    dispatch(fetchTo(from));
  }, [from]);

  useEffect(() => {
    if (toOptions.length > 0) setTo(toOptions[0].value);
  }, [toOptions]);

  // ── Load Shelf khi warehouse thay đổi ──
  useEffect(() => {
    if (!warehouse) return;
    setShelf('');
    dispatch(fetchShelf(warehouse));
  }, [warehouse]);

  useEffect(() => {
    if (shelfOptions.length > 0) setShelf(shelfOptions[0].value);
  }, [shelfOptions]);

  // ── Hiển thị lỗi ──
  useEffect(() => {
    if (error) Alert.alert('Lỗi', error);
  }, [error]);

  // ── RFID callback ──
  const onTagScanned = useCallback(
    (epc: string) => {
      if (!scanning) return;
      dispatch(fetchEPC(epc));
    },
    [scanning, dispatch],
  );

  const scanCols = useMemo(() => calcColWidths(SCAN_COLS_DEF, epcs), [epcs]);

  const ROW_HEIGHT = 36;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );
  const keyExtractorIndex = useCallback((_: any, i: number) => String(i), []);

  const renderScanItem = useCallback(
    ({ item, index }: { item: EpcData; index: number }) => {
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
          {scanCols.map((col, ci) => (
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
    },
    [selRow, scanCols],
  );

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
          <Text className="text-base font-bold text-slate-900">Check Out</Text>
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
            {warehouseLabel ?? 'N/A'}
          </Text>
        </View>
      </View>

      {/* ── TOOLBAR ── */}
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          gap: 8,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Row 1: From / To */}
        <View className="flex-row gap-2">
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              From
            </Text>
            <CompactDropdown
              value={from}
              options={fromOptions}
              onSelect={setFrom}
              placeholder="Select"
              loading={loadingFrom}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              To
            </Text>
            <CompactDropdown
              value={to}
              options={toOptions}
              onSelect={setTo}
              placeholder="Select"
              loading={loadingTo}
            />
          </View>
        </View>

        {/* Row 2: Shelf / No */}
        <View className="flex-row gap-2">
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Shelf
            </Text>
            <CompactDropdown
              value={shelf}
              options={shelfOptions}
              onSelect={setShelf}
              placeholder="Select"
              loading={loadingShelf}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              No
            </Text>
            <CompactDropdown
              value={no}
              options={NO_LIST}
              onSelect={setNo}
              placeholder="Select"
            />
          </View>
        </View>

        {/* Row 3: Return Date / Date */}
        <View className="flex-row gap-2">
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Return Date
            </Text>
            <DatePickerField value={returnDate} onChange={setReturnDate} />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Date
            </Text>
            <DatePickerField value={date} onChange={setDate} />
          </View>
        </View>

        {/* Row 4: Purpose / Outsource */}
        <View className="flex-row gap-2">
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Purpose
            </Text>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Purpose"
              placeholderTextColor="#CBD5E1"
              className="bg-white border-2 border-slate-200 rounded-xl px-3 h-10 text-sm font-medium text-slate-900"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Outsource
            </Text>
            <TextInput
              value={outsource}
              onChangeText={setOutsource}
              placeholder="Outsource"
              placeholderTextColor="#CBD5E1"
              className="bg-white border-2 border-slate-200 rounded-xl px-3 h-10 text-sm font-medium text-slate-900"
            />
          </View>
        </View>

        {/* Row 5: Reason */}
        <View>
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Reason
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason"
            placeholderTextColor="#CBD5E1"
            className="bg-white border-2 border-slate-200 rounded-xl px-3 h-10 text-sm font-medium text-slate-900"
          />
        </View>

        {/* Row 6: Checkboxes */}
        <View className="flex-row items-center justify-between">
          <Checkbox
            value={destroy}
            onToggle={() => setDestroy(!destroy)}
            label="Destroy"
          />
          <Checkbox
            value={punchHole}
            onToggle={() => setPunchHole(!punchHole)}
            label="Punch Hole"
          />
          <Checkbox
            value={noReturn}
            onToggle={() => setNoReturn(!noReturn)}
            label="No Return"
          />
          <Checkbox value={fg} onToggle={() => setFg(!fg)} label="FG" />
        </View>

        {/* Row 7: Action buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            style={{
              flex: 1,
              height: 40,
              backgroundColor: '#F1F5F9',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 11,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            activeOpacity={0.7}
          >
            <Feather name="map-pin" size={13} color="#475569" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>
              {location || 'Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              height: 40,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 11,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            onPress={() => dispatch(clearEpcs())}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={12} color="#DC2626" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#B91C1C' }}>
              Clear
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              height: 40,
              backgroundColor: '#10B981',
              borderRadius: 11,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            activeOpacity={0.8}
          >
            <Feather name="save" size={12} color="white" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'white' }}>
              Save
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              height: 40,
              backgroundColor: scanning ? '#EF4444' : '#3B82F6',
              borderRadius: 11,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            onPress={() => {
              if (scanning) {
                setScanning(false);
                // TODO: SDK.stopScan()
              } else {
                dispatch(clearEpcs());
                setScanning(true);
                // TODO: SDK.startScan(onTagScanned)
              }
            }}
            activeOpacity={0.8}
          >
            <Feather
              name={scanning ? 'square' : 'radio'}
              size={13}
              color="white"
            />
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'white' }}>
              {scanning ? 'STOP' : 'SCAN'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── BẢNG SCAN ── */}
      <View className="flex-1 bg-white">
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
              {epcs.length}
            </Text>
          </View>
          {loadingEpcs && (
            <ActivityIndicator
              size="small"
              color="#3B82F6"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          persistentScrollbar
        >
          <View>
            <View
              className="flex-row border-b-2 border-blue-100"
              style={{ backgroundColor: '#F0F5FF' }}
            >
              {scanCols.map((c) => (
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
              data={epcs}
              keyExtractor={keyExtractorIndex}
              renderItem={renderScanItem}
              getItemLayout={getItemLayout}
              ListEmptyComponent={
                !loadingEpcs ? (
                  <View className="items-center py-8">
                    <Feather name="inbox" size={28} color="#CBD5E1" />
                    <Text className="text-[11px] text-slate-400 mt-2">
                      Chưa có dữ liệu scan
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
