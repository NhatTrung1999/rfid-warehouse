import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  InteractionManager,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompactDropdown } from '../components/CompactDropdown';
import type { DestroyScanData } from '../lib/destroy-scan-service';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearError,
  fetchDestroyScanData,
  fetchDestroyScanOverview,
} from '../store/slices/destroyScanSlice';

const PAGE_SIZE = 50;
// Chiều cao cố định của 1 dòng trong bảng — dùng cho getItemLayout/scrollToIndex
// để cuộn tới đúng trang mà không cần FlatList tự đo (đo tự động dễ sai/chậm).
const ROW_HEIGHT = 38;

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
  { label: 'DevType', key: 'DevTp' },
  { label: 'Stage', key: 'Stage' },
  { label: 'Season', key: 'Season' },
  { label: 'ShoeName', key: 'ShoeName' },
  { label: 'Size', key: 'Size' },
  { label: 'Carton Number', key: 'CartonNumber' },
  { label: 'Export Time', key: 'ExportTime' },
  { label: 'Remark', key: 'Remark' },
  { label: 'Carton', key: 'Carton' },
] as const;

type ScanColumn = { label: string; key: keyof DestroyScanData; width: number };

// ─── SCAN ROW (memo hoá) ────────────────────────────────────────
// Tách riêng khỏi component cha để React.memo có thể chặn re-render của
// từng dòng khi các state không liên quan (remark, scanning, filter...)
// của màn hình cha thay đổi. Chỉ re-render khi item/index/selected/columns
// thực sự đổi.
const ScanRow = memo(function ScanRow({
  item,
  index,
  selected,
  columns,
  onPress,
}: {
  item: DestroyScanData;
  index: number;
  selected: boolean;
  columns: ScanColumn[];
  onPress: (index: number) => void;
}) {
  const rowBg = selected ? '#EFF6FF' : index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

  return (
    <TouchableOpacity
      style={{
        height: ROW_HEIGHT,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        backgroundColor: rowBg,
      }}
      onPress={() => onPress(index)}
      activeOpacity={0.7}
    >
      {selected && (
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
      {columns.map((col, ci) => (
        <Text
          key={ci}
          style={{
            width: col.width,
            paddingHorizontal: 12,
            paddingLeft: ci === 0 && selected ? 16 : 12,
            height: ROW_HEIGHT,
            lineHeight: ROW_HEIGHT,
            fontSize: 12,
            fontWeight: selected ? '600' : '400',
            color: selected ? '#1D4ED8' : '#475569',
            borderRightWidth: 1,
            borderColor: '#F1F5F9',
            textAlignVertical: 'center',
          }}
          numberOfLines={1}
        >
          {String(item[col.key] ?? '') || '—'}
        </Text>
      ))}
    </TouchableOpacity>
  );
});

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
function LoadMoreSkeleton({
  columns,
  rows = 2,
}: {
  columns: ReadonlyArray<{ readonly width: number }>;
  rows?: number;
}) {
  const pulse = useMemo(() => new Animated.Value(0.35), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            height: 38,
            borderBottomWidth: 1,
            borderColor: '#F1F5F9',
            backgroundColor: rowIndex % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
          }}
        >
          {columns.map((column, colIndex) => {
            const fillRatio =
              colIndex % 3 === 0 ? 0.72 : colIndex % 3 === 1 ? 0.48 : 0.6;
            return (
              <View
                key={colIndex}
                style={{
                  width: column.width,
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  borderRightWidth: 1,
                  borderColor: '#F1F5F9',
                }}
              >
                <Animated.View
                  style={{
                    opacity: pulse,
                    height: 9,
                    width: Math.max(
                      18,
                      Math.min(column.width - 24, column.width * fillRatio),
                    ),
                    borderRadius: 999,
                    backgroundColor: '#E2E8F0',
                  }}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function DestructionScan() {
  const router = useRouter();
  const { warehouse, warehouseLabel } = useLocalSearchParams<{
    warehouse: string;
    warehouseLabel: string;
  }>();
  const locationId = Array.isArray(warehouse) ? warehouse[0] : warehouse;
  const dispatch = useAppDispatch();
  const {
    rows,
    overview,
    loadingRows,
    loadingMore,
    loadingOverview,
    loadingPage,
    total,
    page,
    pageSize,
    totalPages,
    error,
  } = useAppSelector((state) => state.destroyScan);
  const effectivePageSize = pageSize || PAGE_SIZE;

  const [remark, setRemark] = useState('');
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState(FILTER_LIST[0]);
  const [releaseTag, setReleaseTag] = useState(false);
  const [selRow, setSelRow] = useState<number | null>(null);
  const [instantLoadingMore, setInstantLoadingMore] = useState(false);
  // "viewPage" = trang người dùng ĐANG XEM trên UI (phân trang thủ công).
  // Khác với "page" trong redux, vốn là trang CUỐI CÙNG đã tải/gộp dữ liệu
  // (infinite scroll). Tách riêng 2 khái niệm này để nút Prev/Next không
  // làm reset/append nhầm danh sách đã cuộn vô hạn.
  const [viewPage, setViewPage] = useState(1);
  const requestedPageRef = useRef<number | null>(null);
  const initialLocationRef = useRef<string | undefined>(undefined);
  const flatListRef = useRef<FlatList<DestroyScanData>>(null);
  const pendingScrollPageRef = useRef<number | null>(null);
  const prefetchRef = useRef<() => void>(() => {});
  const scrollStateRef = useRef({
    loadingRows: false,
    loadingMore: false,
    page: 1,
    totalPages: 0,
    rowsLength: 0,
  });
  // Chặn side-effect (cuộn FlatList) chạy khi màn hình chưa mount xong hoặc
  // đã unmount — tránh cảnh báo "state update on a component that hasn't
  // mounted yet" khi requestAnimationFrame bắn ra ngay trong lúc Expo Router
  // đang chuyển màn hình (native stack transition).
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    (nextPage = 1) => {
      if (requestedPageRef.current === nextPage || loadingPage === nextPage) {
        return;
      }

      requestedPageRef.current = nextPage;
      dispatch(
        fetchDestroyScanData({
          locationId,
          page: nextPage,
          pageSize: PAGE_SIZE,
        }),
      ).finally(() => {
        if (requestedPageRef.current === nextPage) {
          requestedPageRef.current = null;
        }
      });
    },
    [dispatch, loadingPage, locationId],
  );

  const refreshData = useCallback(() => {
    if (locationId) {
      dispatch(fetchDestroyScanOverview(locationId));
    }
    pendingScrollPageRef.current = null;
    setViewPage(1);
    loadPage(1);
    InteractionManager.runAfterInteractions(() => {
      if (!isMountedRef.current) return;
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [dispatch, loadPage, locationId]);

  const prefetchNextPage = useCallback(() => {
    if (loadingRows || loadingMore || page >= totalPages || totalPages <= 1) {
      return;
    }

    setInstantLoadingMore(true);
    loadPage(page + 1);
  }, [loadPage, loadingMore, loadingRows, page, totalPages]);

  const handleLoadMore = useCallback(() => {
    prefetchNextPage();
  }, [prefetchNextPage]);

  useEffect(() => {
    prefetchRef.current = prefetchNextPage;
    scrollStateRef.current = {
      loadingRows,
      loadingMore,
      page,
      totalPages,
      rowsLength: rows.length,
    };
  }, [loadingMore, loadingRows, page, prefetchNextPage, rows.length, totalPages]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
    minimumViewTime: 40,
  }).current;

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ index: number | null }>;
    }) => {
      const lastVisibleIndex = viewableItems.reduce((max, item) => {
        if (item.index === null) return max;
        return Math.max(max, item.index);
      }, -1);
      const state = scrollStateRef.current;
      const prefetchIndex = Math.max(
        0,
        state.rowsLength - Math.ceil(PAGE_SIZE * 0.3),
      );

      if (
        lastVisibleIndex >= prefetchIndex &&
        !state.loadingRows &&
        !state.loadingMore &&
        state.page < state.totalPages
      ) {
        prefetchRef.current();
      }
    },
  ).current;

  useEffect(() => {
    if (!loadingMore) {
      setInstantLoadingMore(false);
    }
  }, [loadingMore, page]);

  // Cuộn FlatList tới đúng vị trí bắt đầu của một trang đã có sẵn dữ liệu.
  // Dùng InteractionManager thay vì requestAnimationFrame để đợi animation
  // chuyển màn hình / tương tác hiện tại kết thúc hẳn rồi mới đụng vào ref.
  const scrollToPageStart = useCallback(
    (targetPage: number) => {
      const index = (targetPage - 1) * effectivePageSize;
      InteractionManager.runAfterInteractions(() => {
        if (!isMountedRef.current) return;
        flatListRef.current?.scrollToIndex({ index, animated: true });
      });
    },
    [effectivePageSize],
  );

  // Điều hướng thủ công (nút Prev/Next). KHÔNG dùng chung reducer logic với
  // infinite scroll: nếu trang đã có sẵn trong "rows" (do đã cuộn/tải trước
  // đó) thì chỉ cuộn tới, không gọi API và không đụng vào danh sách đã gộp.
  // Chỉ gọi API khi thật sự chưa có dữ liệu của trang đó.
  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.max(1, Math.min(target, totalPages || 1));
      if (clamped === viewPage) return;

      if (clamped <= page) {
        setViewPage(clamped);
        scrollToPageStart(clamped);
        return;
      }

      // Trang chưa được tải — fetch (append) rồi cuộn tới khi dữ liệu về.
      pendingScrollPageRef.current = clamped;
      setViewPage(clamped);
      loadPage(clamped);
    },
    [loadPage, page, scrollToPageStart, totalPages, viewPage],
  );

  // Khi dữ liệu của trang đang chờ (do bấm Next vượt quá phần đã tải) đã
  // về tới nơi, thực hiện cuộn tới đúng vị trí.
  useEffect(() => {
    if (
      pendingScrollPageRef.current !== null &&
      page >= pendingScrollPageRef.current
    ) {
      const target = pendingScrollPageRef.current;
      pendingScrollPageRef.current = null;
      scrollToPageStart(target);
    }
  }, [page, scrollToPageStart]);

  useEffect(() => {
    if (initialLocationRef.current === locationId) return;
    initialLocationRef.current = locationId;
    pendingScrollPageRef.current = null;
    setViewPage(1);
    if (locationId) {
      dispatch(fetchDestroyScanOverview(locationId));
    }
    loadPage(1);
  }, [dispatch, loadPage, locationId]);

  useEffect(() => {
    if (!error) return;
    Alert.alert('Error', error);
    dispatch(clearError());
  }, [dispatch, error]);

  useEffect(() => {
    setSelRow((current) => {
      if (rows.length === 0) return null;
      if (current === null) return 0;
      return current >= rows.length ? null : current;
    });
  }, [rows]);

  const tableData = useMemo(() => {
    if (filter === 'Scanned') {
      return rows.filter((row) => row.UserScan);
    }
    if (filter === 'Not yet scan') {
      return rows.filter((row) => !row.UserScan);
    }
    return rows;
  }, [filter, rows]);

  const scannedCount = Number(overview.ScannedCount ?? 0);
  const notYetCount = Number(overview.NotScannedCount ?? 0);
  const totalCount = Number(overview.Total ?? total);

  const scanCols = useMemo(() => calcColWidths(SCAN_COLS_DEF, []), []);

  // Ổn định identity của renderItem/keyExtractor: chỉ đổi khi selRow/scanCols
  // thực sự đổi — KHÔNG đổi khi remark/scanning/filter/... thay đổi. Nhờ đó
  // FlatList không phải re-render toàn bộ cell mỗi lần người dùng gõ phím
  // vào ô Remark hoặc bấm các nút không liên quan tới bảng.
  const handleSelectRow = useCallback((index: number) => {
    setSelRow(index);
  }, []);

  const keyExtractor = useCallback(
    (item: DestroyScanData, i: number) =>
      `${item.EPC ?? ''}|${item.BatchNo ?? ''}|${item.STT ?? ''}|${item.SerialNo ?? ''}|${item.CartonNumber ?? ''}|${i}`,
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DestroyScanData; index: number }) => (
      <ScanRow
        item={item}
        index={index}
        selected={selRow === index}
        columns={scanCols}
        onPress={handleSelectRow}
      />
    ),
    [selRow, scanCols, handleSelectRow],
  );

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
            onPress={() => refreshData()}
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
              onPress={() => goToPage(viewPage - 1)}
              activeOpacity={0.7}
              disabled={loadingRows || viewPage <= 1}
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
                {loadingRows ? '...' : viewPage}
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
              onPress={() => goToPage(viewPage + 1)}
              activeOpacity={0.7}
              disabled={
                loadingRows || loadingMore || viewPage >= (totalPages || 1)
              }
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
              {tableData.length}/{total}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          persistentScrollbar
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }}>
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
              ref={flatListRef}
              style={{ flex: 1 }}
              data={tableData}
              keyExtractor={keyExtractor}
              getItemLayout={(_, index) => ({
                length: ROW_HEIGHT,
                offset: ROW_HEIGHT * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                // Fallback nếu index vượt quá số dòng đang render sẵn
                InteractionManager.runAfterInteractions(() => {
                  if (!isMountedRef.current) return;
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                });
              }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.75}
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              initialNumToRender={60}
              maxToRenderPerBatch={60}
              updateCellsBatchingPeriod={16}
              windowSize={25}
              removeClippedSubviews={false}
              ListEmptyComponent={
                !loadingRows ? (
                  <View
                    style={{
                      alignItems: 'center',
                      paddingVertical: 32,
                      width: 280,
                    }}
                  >
                    <Feather name="inbox" size={28} color="#CBD5E1" />
                    <Text
                      style={{
                        color: '#94A3B8',
                        fontSize: 12,
                        fontWeight: '600',
                        marginTop: 8,
                      }}
                    >
                      No data
                    </Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                loadingMore || instantLoadingMore ? (
                  <LoadMoreSkeleton columns={scanCols} />
                ) : loadingRows ? (
                  <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </View>
                ) : null
              }
              renderItem={renderItem}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
