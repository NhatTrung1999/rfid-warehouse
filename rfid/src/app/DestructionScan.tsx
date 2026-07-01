import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompactDropdown } from '../components/CompactDropdown';

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

// ─── DỮ LIỆU MẪU ─────────────────────────────────────────────
const FILTER_LIST = ['ALL', 'Scanned', 'Not yet scan'];

const SCAN_DATA = [
  {
    BatchNo: 'BatchNo',
    STT: 'STT',
    DateScan: 'DateScan',
    EPC: 'EPC',
    ShoesType: 'ShoesType',
    NoticeNo: 'NoticeNo',
    SerialNo: 'SerialNo',
    UserScan: 'UserScan',
    Article: 'Article',
    FD: 'FD',
    DevType: 'DevType',
    Stage: 'Stage',
    Season: 'Season',
    ShoeName: 'ShoeName',
    ShoesTypes: 'ShoesType',
    Size: 'Size',
    CartonNumber: 'Carton Number',
    ScanOrder: 'ScanOrder',
    ExportTime: 'Export Time',
  },
];

const SCAN_COLS_DEF = [
  { label: 'Batch No', key: 'BatchNo' },
  { label: 'STT', key: 'STT' },
  { label: 'Date Scan', key: 'DateScan' },
  { label: 'EPC', key: 'EPC' },
  { label: 'Shoes Type', key: 'ShoesType' },
  { label: 'NoticeNo', key: 'NoticeNo' },
  { label: 'SerialNo', key: 'SerialNo' },
  { label: 'UserScan', key: 'UserScan' },
  { label: 'Article', key: 'Article' },
  { label: 'FD', key: 'FD' },
  { label: 'DevType', key: 'DevType' },
  { label: 'Stage', key: 'Stage' },
  { label: 'Season', key: 'Season' },
  { label: 'ShoeName', key: 'ShoeName' },
  { label: 'ShoesType', key: 'ShoesTypes' },
  { label: 'Size', key: 'Size' },
  { label: 'Carton Number', key: 'CartonNumber' },
  { label: 'ScanOrder', key: 'ScanOrder' },
  { label: 'Export Time', key: 'ExportTime' },
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
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
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
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── ICON BUTTON ──────────────────────────────────────────────
function IconBtn({
  icon,
  label,
  bg,
  border,
  iconColor,
  textColor,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  bg: string;
  border: string;
  iconColor: string;
  textColor: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        height: 34,
        paddingHorizontal: 12,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 11,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name={icon} size={12} color={iconColor} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: textColor }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function DestructionScan() {
  const router = useRouter();
  const { warehouse, warehouseLabel } = useLocalSearchParams<{
    warehouse: string;
    warehouseLabel: string;
  }>();

  const [remark, setRemark] = useState('');
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState(FILTER_LIST[0]);
  const [releaseTag, setReleaseTag] = useState(false);
  const [page, setPage] = useState(1);
  const [selRow, setSelRow] = useState<number | null>(null);

  const scannedCount = SCAN_DATA.length;
  const notYetCount = 0;
  const totalCount = scannedCount + notYetCount;

  const scanCols = useMemo(() => calcColWidths(SCAN_COLS_DEF, SCAN_DATA), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── HEADER ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderColor: '#F1F5F9',
        }}
      >
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 11,
            backgroundColor: '#F1F5F9',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={17} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
            Destruction Scan
          </Text>
          <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
            RFID Tag Scanner
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#EFF6FF',
            borderWidth: 1,
            borderColor: '#BFDBFE',
            borderRadius: 18,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Feather
            name="map-pin"
            size={10}
            color="#3B82F6"
            style={{ marginRight: 4 }}
          />
          <Text
            style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}
            numberOfLines={1}
          >
            {warehouseLabel ?? 'N/A'}
          </Text>
        </View>
      </View>

      {/* ── TOOLBAR ── */}
      <View
        style={{
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          gap: 8,
        }}
      >
        {/* Row 1: Remark + SCAN */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#94A3B8',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Remark
          </Text>
          <View
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderWidth: 2,
              borderColor: '#E2E8F0',
              borderRadius: 13,
              paddingHorizontal: 12,
              height: 38,
              justifyContent: 'center',
            }}
          >
            <TextInput
              value={remark}
              onChangeText={setRemark}
              style={{ fontSize: 13, color: '#0F172A', padding: 0 }}
              placeholderTextColor="#CBD5E1"
            />
          </View>
          <TouchableOpacity
            style={{
              height: 38,
              paddingHorizontal: 18,
              backgroundColor: scanning ? '#EF4444' : '#3B82F6',
              borderRadius: 19,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: scanning ? '#EF4444' : '#3B82F6',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={() => setScanning(!scanning)}
            activeOpacity={0.8}
          >
            <Feather
              name={scanning ? 'square' : 'radio'}
              size={14}
              color="white"
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: 'white',
                letterSpacing: 1,
              }}
            >
              {scanning ? 'STOP' : 'SCAN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2a: Refresh / Save / Clear */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconBtn
            icon="refresh-cw"
            label="Refresh"
            bg="#EFF6FF"
            border="#BFDBFE"
            iconColor="#2563EB"
            textColor="#1D4ED8"
          />
          <IconBtn
            icon="save"
            label="Save"
            bg="#10B981"
            border="#10B981"
            iconColor="white"
            textColor="white"
          />
          <IconBtn
            icon="trash-2"
            label="Clear"
            bg="#FEF2F2"
            border="#FECACA"
            iconColor="#DC2626"
            textColor="#B91C1C"
          />
          <View style={{ width: 1, height: 22, backgroundColor: '#E2E8F0' }} />
          <View style={{ flex: 1 }}>
            <CompactDropdown
              value={filter}
              options={FILTER_LIST}
              onSelect={setFilter}
              height={38}
              borderRadius={13}
              fontSize={13}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Checkbox
            value={releaseTag}
            onToggle={() => setReleaseTag(!releaseTag)}
            label="Release Tag"
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setPage(Math.max(1, page - 1))}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={13} color="#475569" />
            </TouchableOpacity>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#BFDBFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}
              >
                {page}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setPage(page + 1)}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={13} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── STATS STRIP ── */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        {[
          {
            label: 'SCANNED',
            value: scannedCount,
            sub: 'tags read',
            blue: true,
          },
          { label: 'NOT YET', value: notYetCount, sub: 'pending', blue: false },
          { label: 'TOTAL', value: totalCount, sub: 'in batch', blue: false },
        ].map((item, i) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: item.blue ? '#EFF6FF' : 'white',
              borderLeftWidth: i > 0 ? 1 : 0,
              borderColor: '#E2E8F0',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: item.blue ? '#2563EB' : '#94A3B8',
                marginBottom: 2,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '500',
                lineHeight: 24,
                color: item.blue
                  ? '#1E3A8A'
                  : item.value === 0
                    ? '#CBD5E1'
                    : '#0F172A',
              }}
            >
              {item.value}
            </Text>
            <Text
              style={{
                fontSize: 9,
                marginTop: 1,
                color: item.blue ? '#3B82F6' : '#94A3B8',
              }}
            >
              {item.sub}
            </Text>
          </View>
        ))}
      </View>

      {/* ── DATA TABLE ── */}
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Section label */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
            gap: 8,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#94A3B8',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Scanned Tags
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              gap: 4,
              backgroundColor: scanning ? '#EFF6FF' : '#F1F5F9',
            }}
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
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: scanning ? '#2563EB' : '#94A3B8',
              }}
            >
              {SCAN_DATA.length}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          persistentScrollbar
        >
          <View>
            {/* Table header */}
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 2,
                borderColor: '#DBEAFE',
                backgroundColor: '#F0F5FF',
              }}
            >
              {scanCols.map((c) => (
                <View
                  key={c.label}
                  style={{
                    width: c.width,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRightWidth: 1,
                    borderColor: '#DBEAFE',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: '#1D4ED8',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>

            <FlatList
              data={SCAN_DATA}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => {
                const sel = selRow === index;
                const rowBg = sel
                  ? '#EFF6FF'
                  : index % 2 === 0
                    ? '#FFFFFF'
                    : '#F8FAFC';
                return (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      borderBottomWidth: 1,
                      borderColor: '#F1F5F9',
                      alignItems: 'center',
                      backgroundColor: rowBg,
                    }}
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
                        style={{
                          width: col.width,
                          paddingHorizontal: 12,
                          paddingLeft: ci === 0 && sel ? 16 : 12,
                          paddingVertical: 10,
                          fontSize: 12,
                          fontWeight: sel ? '600' : '400',
                          color: sel ? '#1D4ED8' : '#475569',
                          borderRightWidth: 1,
                          borderColor: '#F1F5F9',
                        }}
                        numberOfLines={1}
                      >
                        {String(item[col.key] ?? '') || '—'}
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
