import { Feather } from '@expo/vector-icons';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  DateType,
  useDefaultStyles,
} from 'react-native-ui-datepicker';

// ─── TYPES ────────────────────────────────────────────────────

interface DatePickerFieldProps {
  value: DateType;
  onChange: (date: DateType) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────

export function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateType>(value);
  const defaultStyles = useDefaultStyles();

  const displayText = value
    ? dayjs(value as Dayjs).format('YYYY/MM/DD')
    : 'Select date';

  const handleOpen = () => {
    setPending(value);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(pending);
    setOpen(false);
  };

  return (
    <View>
      {/* ── Trigger button ── */}
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderWidth: 2,
          borderColor: '#E2E8F0',
          borderRadius: 12,
          paddingHorizontal: 10,
          height: 40,
          gap: 6,
        }}
      >
        <Feather name="calendar" size={13} color="#3B82F6" />
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: '600',
            color: value ? '#1E293B' : '#94A3B8',
          }}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Feather name="chevron-down" size={13} color="#94A3B8" />
      </TouchableOpacity>

      {/* ── Calendar modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(15,23,42,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          {/* Card — ngăn tap bên trong đóng modal */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              width: 310,
              padding: 16,
            }}
          >
            {/* Calendar */}
            <DateTimePicker
              mode="single"
              date={pending}
              onChange={({ date }) => setPending(date)}
              styles={{
                ...defaultStyles,
                // Header
                header: {
                  ...defaultStyles.header,
                  marginBottom: 8,
                },
                // Ngày hôm nay
                today: {
                  borderWidth: 1.5,
                  borderColor: '#2563EB',
                  borderRadius: 999,
                },
                today_label: {
                  color: '#2563EB',
                  fontWeight: '700',
                },
                // Ngày được chọn
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

            {/* ── Footer ── */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
                paddingTop: 12,
                marginTop: 8,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Selected
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#0F172A',
                    marginTop: 2,
                  }}
                >
                  {pending ? dayjs(pending as Dayjs).format('YYYY/MM/DD') : '—'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.8}
                style={{
                  backgroundColor: pending ? '#2563EB' : '#CBD5E1',
                  borderRadius: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}
                >
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
