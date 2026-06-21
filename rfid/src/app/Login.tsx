import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/slices/authSlice';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  autoCapitalize = 'none',
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const active = isFocused || value.length > 0;

  return (
    <View className="mb-5">
      <Text className="text-sm font-semibold text-slate-900 mb-2 ml-1">
        {label}
      </Text>

      <View
        className={`bg-white border-2 rounded-2xl px-4 flex-row items-center ${
          active ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'
        }`}
      >
        <Feather name={icon} size={20} color={active ? '#3B82F6' : '#94A3B8'} />

        <TextInput
          className="flex-1 py-4 px-3 text-base font-medium text-slate-900"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReady = username.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isReady || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await dispatch(login({ username: username.trim(), password })).unwrap();
      router.replace('/');
    } catch (error) {
      const message =
        typeof error === 'string' ? error : 'Không thể kết nối tới máy chủ';
      Alert.alert('Đăng nhập thất bại', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-10">
            {/* Logo + tiêu đề: gom thành 1 khối căn giữa, cách đều phần form bên dưới */}
            <View className="items-center mb-10">
              <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center border-2 border-blue-200 mb-4">
                <Text className="text-blue-500 text-2xl font-extrabold">
                  RF
                </Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900">
                RFID Manager
              </Text>
              <Text className="text-base text-slate-500 mt-1">
                Đăng nhập để tiếp tục
              </Text>
            </View>

            {/* Form: 2 input nhóm liền nhau, nút hành động tách riêng bên dưới với khoảng cách rõ ràng */}
            <View>
              <InputField
                label="Tên đăng nhập"
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập"
                icon="user"
              />

              <InputField
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                icon="lock"
                secureTextEntry
              />
            </View>

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
                !isReady || isSubmitting
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
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={!isReady || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text
                    className="text-white text-lg font-bold"
                    style={{ marginRight: 8 }}
                  >
                    Đăng nhập
                  </Text>
                  <Feather name="arrow-right" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
