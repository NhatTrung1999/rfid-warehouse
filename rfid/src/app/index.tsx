import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { warehousesService, Warehouse } from '../lib/warehouses-service';

const FUNCTIONS = [
  { label: 'Check In', value: 'CheckIn' },
  { label: 'Check Out', value: 'CheckOut' },
  { label: 'Destruction Scan', value: 'DestructionScan' },
];

interface ModernSelectProps {
  label: string;
  placeholder: string;
  value: string | null;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  icon: keyof typeof Feather.glyphMap;
  loading?: boolean;
}

function ModernSelect({
  label,
  placeholder,
  value,
  options,
  onSelect,
  icon,
  loading,
}: ModernSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
  const iconColor = value ? '#3B82F6' : '#94A3B8';

  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-slate-900 mb-2 ml-1">
        {label}
      </Text>

      <TouchableOpacity
        className={`bg-white border-2 rounded-2xl p-4 shadow-sm flex-row items-center ${
          value ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'
        }`}
        onPress={() => !loading && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View className="mr-3">
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-medium ${value ? 'text-slate-900' : 'text-slate-400'}`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#94A3B8" />
        ) : (
          <Feather name="chevron-down" size={16} color="#94A3B8" />
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 bg-slate-900/40 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View className="bg-white rounded-t-3xl pt-6 px-5 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-slate-900">{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather
                  name="x"
                  size={24}
                  color="#94A3B8"
                  style={{ padding: 4 }}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingBottom: 30 }}
              renderItem={({ item }) => {
                const isSelected = value === item.value;
                return (
                  <TouchableOpacity
                    className={`flex-row justify-between items-center py-4 border-b border-slate-200 ${
                      isSelected
                        ? 'bg-blue-50 rounded-xl border-b-0 px-4 my-1'
                        : ''
                    }`}
                    onPress={() => {
                      onSelect(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <Text
                        className={`text-base font-semibold ${isSelected ? 'text-blue-500' : 'text-slate-900'}`}
                      >
                        {item.label}
                      </Text>
                      {/* <Text className="text-xs text-slate-400 mt-0.5">
                        {item.value}
                      </Text> */}
                    </View>
                    {isSelected && (
                      <Feather name="check" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function IndexScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [selectedFunc, setSelectedFunc] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    null,
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const isReady = selectedFunc && selectedWarehouse;

  useEffect(() => {
    warehousesService
      .getWarehouses()
      .then(setWarehouses)
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách kho'))
      .finally(() => setLoadingWarehouses(false));
  }, []);

  const handleConfirm = () => {
    if (!isReady) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn cả chức năng và kho.');
      return;
    }
    router.push({
      pathname: `/${selectedFunc}` as any,
      params: {
        warehouse: selectedWarehouse,
        warehouseLabel:
          warehouses.find((w) => w.value === selectedWarehouse)?.label ?? '',
      },
    });
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const warehouseOptions = warehouses.map((w) => ({
    label: w.label,
    value: w.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center border-2 border-blue-200">
            <Text className="text-blue-500 text-lg font-extrabold">RF</Text>
          </View>
          <View>
            <Text className="text-xl font-bold text-slate-900">
              RFID Manager
            </Text>
            {user && (
              <Text className="text-sm text-slate-500">
                Xin chào, {user.username}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 items-center justify-center"
          hitSlop={8}
        >
          <Feather name="log-out" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 justify-center">
        <ModernSelect
          label="Select Functions"
          placeholder="Choose function..."
          value={selectedFunc}
          options={FUNCTIONS}
          onSelect={setSelectedFunc}
          icon="layers"
        />
        <ModernSelect
          label="Warehouse"
          placeholder={
            loadingWarehouses ? 'Đang tải...' : 'Choose warehouse...'
          }
          value={selectedWarehouse}
          options={warehouseOptions}
          onSelect={setSelectedWarehouse}
          icon="box"
          loading={loadingWarehouses}
        />
        <TouchableOpacity
          style={[
            {
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              borderRadius: 16,
              flexDirection: 'row',
              marginTop: 8,
            },
            !isReady
              ? { backgroundColor: '#94A3B8' }
              : {
                  backgroundColor: '#3B82F6',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text
            className="text-white text-lg font-bold"
            style={{ marginRight: isReady ? 8 : 0 }}
          >
            Confirm
          </Text>
          {isReady && <Feather name="arrow-right" size={20} color="white" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
