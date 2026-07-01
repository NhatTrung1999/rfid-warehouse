import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchModelNames,
  fetchStages,
  fetchSeasons,
  fetchCategories,
  fetchArticles,
  fetchFDs,
  fetchNoticeNos,
  fetchLocations,
} from '../store/slices/destroyRequestSlice';

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
// STATUS chưa có API endpoint — giữ lại mock tạm
const STATUS_LIST = [
  'ALL',
  'Pending Destroy',
  'Sys pending destroy',
  'FD confirm',
  'Data Export',
  'WH confirm',
  'Destroy InProcess',
  'Destroy Adopt',
  'Keep',
];

const TABLE_DATA = [
  {
    EPC: 'E280699500000401701636SDB',
    Article: 'JP6078',
    Model: 'COPA PREMIERE',
    Category: 'PDX(SKB)',
    Stage: 'TS2',
    Size: '8.5',
    Season: 'FW25',
    NoticeNo: '122507723',
    FD: 'MY HANH',
    DeviceType: 'Inline',
    ShoesType: 'Finish Shoes',
    ConfirmDate: '',
    ConfirmUser: '',
    Status: 'FD confirm',
    Destroy: true,
    Reason: '',
  },
  {
    EPC: 'E280699500000401701635609',
    Article: 'JP6078',
    Model: 'COPA PREMIERE',
    Category: 'PDX(SKB)',
    Stage: 'TS2',
    Size: '8.5',
    Season: 'FW25',
    NoticeNo: '122507723',
    FD: 'MY HANH',
    DeviceType: 'Inline',
    ShoesType: 'Finish Shoes',
    ConfirmDate: '',
    ConfirmUser: '',
    Status: 'FD confirm',
    Destroy: false,
    Reason: '',
  },
  {
    EPC: 'E280699500000401701635600',
    Article: 'JP6078',
    Model: 'COPA PREMIERE',
    Category: 'PDX(SKB)',
    Stage: 'TS2',
    Size: '8.5',
    Season: 'FW25',
    NoticeNo: '122507723',
    FD: 'MY HANH',
    DeviceType: 'Inline',
    ShoesType: 'Finish Shoes',
    ConfirmDate: '',
    ConfirmUser: '',
    Status: 'FD confirm',
    Destroy: false,
    Reason: '',
  },
  {
    EPC: 'E280699500000501701635509',
    Article: 'JP6078',
    Model: 'COPA PREMIERE',
    Category: 'PDX(SKB)',
    Stage: 'TS2',
    Size: '8.5',
    Season: 'FW25',
    NoticeNo: '122507723',
    FD: 'MY HANH',
    DeviceType: 'Inline',
    ShoesType: 'Finish Shoes',
    ConfirmDate: '',
    ConfirmUser: '',
    Status: 'FD confirm',
    Destroy: false,
    Reason: '',
  },
  {
    EPC: 'E280699500000501701635SF1',
    Article: 'JP6078',
    Model: 'COPA PREMIERE',
    Category: 'PDX(SKB)',
    Stage: 'TS2',
    Size: '8.5',
    Season: 'FW25',
    NoticeNo: '122507723',
    FD: 'MY HANH',
    DeviceType: 'Inline',
    ShoesType: 'Finish Shoes',
    ConfirmDate: '',
    ConfirmUser: '',
    Status: 'FD confirm',
    Destroy: false,
    Reason: '',
  },
  {
    EPC: 'E280699500000501701635SF2',
    Article: 'JP6078',
    Model: 'COPA PREMIERE',
    Category: 'PDX(SKB)',
    Stage: 'TS2',
    Size: '8.5',
    Season: 'FW25',
    NoticeNo: '122507723',
    FD: 'MY HANH',
    DeviceType: 'Inline',
    ShoesType: 'Finish Shoes',
    ConfirmDate: '',
    ConfirmUser: '',
    Status: 'FD confirm',
    Destroy: false,
    Reason: '',
  },
];

// Columns: EPC | Article | Model | Category | Stage | Size | Season | Notice No | FD | Device Type | Shoes Type | Confirm Date | Confirm User | Status | Destroy | Reason
const TABLE_COLS_DEF = [
  { label: 'EPC', key: 'EPC' },
  { label: 'Article', key: 'Article' },
  { label: 'Model', key: 'Model' },
  { label: 'Category', key: 'Category' },
  { label: 'Stage', key: 'Stage' },
  { label: 'Size', key: 'Size' },
  { label: 'Season', key: 'Season' },
  { label: 'Notice No', key: 'NoticeNo' },
  { label: 'FD', key: 'FD' },
  { label: 'Device Type', key: 'DeviceType' },
  { label: 'Shoes Type', key: 'ShoesType' },
  { label: 'Confirm Date', key: 'ConfirmDate' },
  { label: 'Confirm User', key: 'ConfirmUser' },
  { label: 'Status', key: 'Status' },
  { label: 'Reason', key: 'Reason' },
] as const;

// ─── FIELD LABEL + CONTROL ────────────────────────────────────
function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, minWidth: 90 }}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          color: '#94A3B8',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

// ─── CHECKBOX ─────────────────────────────────────────────────
function Checkbox({
  value,
  onToggle,
  label,
}: {
  value: boolean;
  onToggle: () => void;
  label?: string;
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
      {label ? (
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function DestroyRequest() {
  const router = useRouter();
  const { warehouse, warehouseLabel } = useLocalSearchParams<{
    warehouse: string;
    warehouseLabel: string;
  }>();

  const dispatch = useAppDispatch();
  const {
    modelNames,
    loadingModelNames,
    stages,
    loadingStages,
    seasons,
    loadingSeasons,
    categories,
    loadingCategories,
    articles,
    loadingArticles,
    fds,
    loadingFDs,
    noticeNos,
    loadingNoticeNos,
    locations,
    loadingLocations,
  } = useAppSelector((state) => state.destroyRequest);

  // filter state
  const [epc, setEpc] = useState('');
  const [model, setModel] = useState<string[]>([]);
  const [stage, setStage] = useState<string[]>([]);
  const [season, setSeason] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [article, setArticle] = useState<string[]>([]);
  const [fd, setFd] = useState<string[]>([]);
  const [location, setLocation] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [noticeNo, setNoticeNo] = useState<string[]>([]);
  const [checkAll, setCheckAll] = useState(false);

  // API data
  useEffect(() => {
    dispatch(fetchModelNames());
    dispatch(fetchStages());
    dispatch(fetchSeasons());
    dispatch(fetchCategories());
    dispatch(fetchArticles());
    dispatch(fetchFDs());
    dispatch(fetchNoticeNos());
    dispatch(fetchLocations());
  }, [dispatch]);

  // table
  const [selRow, setSelRow] = useState<number | null>(0);
  const [destroyRows, setDestroyRows] = useState<boolean[]>(
    TABLE_DATA.map((r) => r.Destroy),
  );

  const tableCols = useMemo(
    () => calcColWidths(TABLE_COLS_DEF, TABLE_DATA),
    [],
  );

  const toggleDestroy = (index: number) => {
    setDestroyRows((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const toggleCheckAll = () => {
    const next = !checkAll;
    setCheckAll(next);
    setDestroyRows(TABLE_DATA.map(() => next));
  };

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
            Destroy Request
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
            {warehouseLabel || warehouse || 'N/A'}
          </Text>
        </View>
      </View>

      {/* ── TOOLBAR / FILTER ── */}
      <View
        style={{
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 8,
          gap: 6,
        }}
      >
        {/* Row 1: EPC (full width) */}
        <View>
          <Text
            style={{
              fontSize: 9,
              fontWeight: '700',
              color: '#94A3B8',
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            EPC
          </Text>
          <View
            style={{
              height: 34,
              backgroundColor: 'white',
              borderWidth: 2,
              borderColor: '#E2E8F0',
              borderRadius: 11,
              paddingHorizontal: 12,
              justifyContent: 'center',
            }}
          >
            <TextInput
              value={epc}
              onChangeText={setEpc}
              style={{ fontSize: 13, color: '#0F172A', padding: 0 }}
              placeholderTextColor="#CBD5E1"
              placeholder="Enter EPC..."
            />
          </View>
        </View>

        {/* Row 2: Model Name | Stage | Season */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FilterField label="Model Name">
            <CompactDropdown
              multiple
              creatable
              value={model}
              options={modelNames}
              onSelect={setModel}
              loading={loadingModelNames}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
          <FilterField label="Stage">
            <CompactDropdown
              multiple
              creatable
              value={stage}
              options={stages}
              onSelect={setStage}
              loading={loadingStages}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
          <FilterField label="Season">
            <CompactDropdown
              multiple
              creatable
              value={season}
              options={seasons}
              onSelect={setSeason}
              loading={loadingSeasons}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
        </View>

        {/* Row 3: Category | Article | FD */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FilterField label="Category">
            <CompactDropdown
              multiple
              creatable
              value={category}
              options={categories}
              onSelect={setCategory}
              loading={loadingCategories}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
          <FilterField label="Article">
            <CompactDropdown
              multiple
              creatable
              value={article}
              options={articles}
              onSelect={setArticle}
              loading={loadingArticles}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
          <FilterField label="FD">
            <CompactDropdown
              multiple
              creatable
              value={fd}
              options={fds}
              onSelect={setFd}
              loading={loadingFDs}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
        </View>

        {/* Row 4: Location | Status | Notice No */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FilterField label="Location">
            <CompactDropdown
              multiple
              creatable
              value={location}
              options={locations}
              onSelect={setLocation}
              loading={loadingLocations}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
          <FilterField label="Status">
            <CompactDropdown
              multiple
              value={status}
              options={STATUS_LIST}
              onSelect={setStatus}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
          <FilterField label="Notice No">
            <CompactDropdown
              multiple
              creatable
              value={noticeNo}
              options={noticeNos}
              onSelect={setNoticeNo}
              loading={loadingNoticeNos}
              placeholder="All"
              height={34}
              borderRadius={11}
              paddingHorizontal={10}
              fontSize={12}
              iconSize={13}
            />
          </FilterField>
        </View>

        {/* Row 5: Search | Confirm | □ Check All */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              height: 34,
              backgroundColor: '#3B82F6',
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            }}
            activeOpacity={0.8}
          >
            <Feather name="search" size={12} color="white" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              height: 34,
              backgroundColor: '#10B981',
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            activeOpacity={0.8}
          >
            <Feather name="check-circle" size={12} color="white" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
              Confirm
            </Text>
          </TouchableOpacity>

          <View style={{ width: 1, height: 22, backgroundColor: '#E2E8F0' }} />

          <Checkbox
            value={checkAll}
            onToggle={toggleCheckAll}
            label="Check All"
          />
        </View>
      </View>

      {/* ── DATA TABLE ── */}
      <View style={{ flex: 1, backgroundColor: 'white' }}>
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
              {/* Destroy checkbox column */}
              <View
                style={{
                  width: 54,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRightWidth: 1,
                  borderColor: '#DBEAFE',
                  alignItems: 'center',
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
                >
                  Destroy
                </Text>
              </View>
              {tableCols.map((c) => (
                <View
                  key={c.label}
                  style={{
                    width: c.width,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
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
              data={TABLE_DATA}
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

                    {/* Destroy checkbox cell */}
                    <View
                      style={{
                        width: 54,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 8,
                        borderRightWidth: 1,
                        borderColor: '#F1F5F9',
                        paddingLeft: sel ? 6 : 0,
                      }}
                    >
                      <Checkbox
                        value={destroyRows[index]}
                        onToggle={() => toggleDestroy(index)}
                      />
                    </View>

                    {tableCols.map((col, ci) => (
                      <Text
                        key={ci}
                        style={{
                          width: col.width,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
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
