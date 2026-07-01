import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// ─── TYPES ────────────────────────────────────────────────────

export interface CompactDropdownOption {
  label: string;
  value: string;
}

export type CompactDropdownOptionInput = string | CompactDropdownOption;

interface CompactDropdownBaseProps {
  options: CompactDropdownOptionInput[];
  placeholder?: string;
  loading?: boolean;
  height?: number;
  borderRadius?: number;
  paddingHorizontal?: number;
  fontSize?: number;
  iconSize?: number;
  searchable?: boolean;
  /** Cho phép người dùng nhập giá trị tự do, không có trong `options` */
  creatable?: boolean;
}

interface CompactDropdownSingleProps extends CompactDropdownBaseProps {
  multiple?: false;
  value: string;
  onSelect: (value: string) => void;
}

interface CompactDropdownMultipleProps extends CompactDropdownBaseProps {
  multiple: true;
  value: string[];
  onSelect: (value: string[]) => void;
}

export type CompactDropdownProps =
  | CompactDropdownSingleProps
  | CompactDropdownMultipleProps;

// ─── HELPERS ──────────────────────────────────────────────────

const SEARCH_THRESHOLD = 8;
// Lấy kích thước màn hình vật lý thực, không bị ảnh hưởng bởi keyboard
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

function normalizeOptions(
  options: CompactDropdownOptionInput[],
): CompactDropdownOption[] {
  return options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o,
  );
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// ─── COMPONENT ────────────────────────────────────────────────

export function CompactDropdown(props: CompactDropdownProps) {
  const {
    options,
    placeholder = 'Select...',
    loading,
    height = 40,
    borderRadius = 12,
    paddingHorizontal = 12,
    fontSize = 14,
    iconSize = 14,
    searchable,
    creatable,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalized = useMemo(() => normalizeOptions(options), [options]);

  // Chuẩn hoá value về mảng để dùng chung logic cho cả 2 chế độ
  const selectedValues: string[] = props.multiple
    ? props.value
    : props.value
      ? [props.value]
      : [];
  const hasSelection = selectedValues.length > 0;

  // Nhãn cho mỗi giá trị đã chọn: lấy label từ options nếu có,
  // nếu không (giá trị người dùng tự nhập) thì hiển thị chính giá trị đó.
  const labelFor = (v: string) =>
    normalized.find((o) => o.value === v)?.label ?? v;
  const selectedLabels = selectedValues.map(labelFor);

  // Các giá trị đã chọn nhưng không nằm trong danh sách options (tự nhập)
  const customSelectedValues = selectedValues.filter(
    (v) => !normalized.some((o) => o.value === v),
  );

  const displayText = !hasSelection
    ? placeholder
    : props.multiple
      ? selectedLabels.join(', ')
      : (selectedLabels[0] ?? props.value);

  const showSearch =
    searchable ?? (creatable || normalized.length > SEARCH_THRESHOLD);

  const trimmedQuery = query.trim();

  const filteredOptions = useMemo(() => {
    if (!showSearch || !trimmedQuery) return normalized;
    const q = normalizeText(trimmedQuery);
    return normalized.filter((o) => normalizeText(o.label).includes(q));
  }, [normalized, trimmedQuery, showSearch]);

  // Có hiển thị dòng "Thêm giá trị" hay không: cần bật creatable, có nhập
  // text, và giá trị đó chưa tồn tại y hệt trong options lẫn đã chọn.
  const canCreate =
    creatable &&
    trimmedQuery.length > 0 &&
    !normalized.some(
      (o) => normalizeText(o.label) === normalizeText(trimmedQuery),
    ) &&
    !selectedValues.some(
      (v) => normalizeText(v) === normalizeText(trimmedQuery),
    );

  const handleOpen = () => {
    if (loading) return;
    setQuery('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  // Multi-select: toggle và giữ modal mở để chọn tiếp.
  // Single-select: chọn xong đóng modal luôn (giữ nguyên hành vi cũ).
  const handleToggle = (itemValue: string) => {
    if (props.multiple) {
      const next = selectedValues.includes(itemValue)
        ? selectedValues.filter((v) => v !== itemValue)
        : [...selectedValues, itemValue];
      props.onSelect(next);
    } else {
      props.onSelect(itemValue);
      handleClose();
    }
  };

  // Thêm giá trị người dùng tự gõ (không có trong options) vào danh sách đã chọn.
  const handleCreate = () => {
    if (!canCreate) return;
    const newValue = trimmedQuery;
    if (props.multiple) {
      props.onSelect([...selectedValues, newValue]);
      setQuery('');
    } else {
      props.onSelect(newValue);
      handleClose();
    }
  };

  // Bỏ chọn một giá trị tự nhập (từ khu vực chip)
  const handleRemoveCustom = (v: string) => {
    if (props.multiple) {
      props.onSelect(selectedValues.filter((sv) => sv !== v));
    } else {
      props.onSelect('');
    }
  };

  const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;
  const MODAL_WIDTH = SCREEN_WIDTH - 48; // px-6 mỗi bên = 24px

  return (
    <View>
      {/* ── Trigger ── */}
      <TouchableOpacity
        className="flex-row items-center bg-white border-2 border-slate-200"
        style={{ height, borderRadius, paddingHorizontal }}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text
          style={{ fontSize }}
          className={`flex-1 font-medium ${hasSelection ? 'text-slate-900' : 'text-slate-400'}`}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#94A3B8" />
        ) : (
          <Feather name="chevron-down" size={iconSize} color="#94A3B8" />
        )}
      </TouchableOpacity>

      {/* ── Options modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/*
          Dùng StyleSheet.absoluteFillObject + kích thước screen vật lý
          thay vì flex — tránh bị hệ thống resize khi keyboard hiện.
        */}
        <View style={styles.overlay}>
          {/* Backdrop tap-to-close */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* Modal box — căn giữa tuyệt đối */}
          <View
            style={[
              styles.box,
              { width: MODAL_WIDTH, maxHeight: MODAL_MAX_HEIGHT },
            ]}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-slate-100">
              <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Select Option
              </Text>
              <View className="flex-row items-center gap-3">
                {props.multiple && selectedValues.length > 0 && (
                  <Text className="text-xs font-bold text-blue-500">
                    Đã chọn {selectedValues.length}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search */}
            {showSearch && (
              <View className="px-4 py-3 border-b border-slate-100">
                <View className="flex-row items-center bg-slate-100 rounded-xl px-3 h-10">
                  <Feather name="search" size={15} color="#94A3B8" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Tìm kiếm..."
                    placeholderTextColor="#94A3B8"
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={canCreate ? 'done' : 'search'}
                    onSubmitEditing={handleCreate}
                    className="flex-1 ml-2 text-sm text-slate-900"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="x-circle" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Chip các giá trị tự nhập đã chọn */}
            {customSelectedValues.length > 0 && (
              <View className="px-4 py-3 border-b border-slate-100 flex-row flex-wrap gap-2">
                {customSelectedValues.map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => handleRemoveCustom(v)}
                    className="flex-row items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full pl-3 pr-2 py-1.5"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-bold text-blue-600">{v}</Text>
                    <Feather name="x" size={12} color="#3B82F6" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                canCreate ? (
                  <TouchableOpacity
                    className="flex-row items-center gap-3 px-4 py-4 border-b border-slate-50 bg-emerald-50"
                    onPress={handleCreate}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: '#10B981',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="plus" size={11} color="#10B981" />
                    </View>
                    <Text className="flex-1 text-[15px] font-bold text-emerald-600">
                      Thêm "{trimmedQuery}"
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => {
                const sel = selectedValues.includes(item.value);
                return (
                  <TouchableOpacity
                    className={`flex-row items-center gap-3 px-4 py-4 border-b border-slate-50 ${sel ? 'bg-blue-50' : ''}`}
                    onPress={() => handleToggle(item.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: sel ? '#3B82F6' : '#CBD5E1',
                        backgroundColor: sel ? '#3B82F6' : '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {sel && <Feather name="check" size={11} color="white" />}
                    </View>
                    <Text
                      className={`flex-1 text-[15px] ${sel ? 'font-bold text-blue-600' : 'font-medium text-slate-800'}`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="px-4 py-10 items-center">
                  <Feather name="search" size={20} color="#CBD5E1" />
                  <Text className="text-sm text-slate-400 mt-2">
                    Không tìm thấy kết quả
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
});
