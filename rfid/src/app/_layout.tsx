import '../../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapAuth } from '../store/slices/authSlice';

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isBootstrapping } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isBootstrapping) return;

    const onLoginScreen = segments[segments.length - 1] === 'Login';

    if (!user && !onLoginScreen) {
      router.replace('/Login');
    } else if (user && onLoginScreen) {
      router.replace('/');
    }
  }, [user, isBootstrapping, segments]);

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthGate>
        <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" />
          <Stack.Screen name="CheckIn" />
          <Stack.Screen name="CheckOut" />
          <Stack.Screen name="DestructionScan" />
          <Stack.Screen name="DestroyRequest" />
        </Stack>
      </AuthGate>
    </Provider>
  );
}
