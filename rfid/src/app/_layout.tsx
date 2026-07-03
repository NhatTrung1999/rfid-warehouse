import "../../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Provider } from "react-redux";
import { store } from "../store";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { bootstrapAuth } from "../store/slices/authSlice";

function AuthGate() {
  const dispatch = useAppDispatch();
  const { user, isBootstrapping } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isBootstrapping) return;

    const onLoginScreen = segments[segments.length - 1] === "Login";

    if (!user && !onLoginScreen) {
      router.replace("/Login");
    } else if (user && onLoginScreen) {
      router.replace("/");
    }
  }, [user, isBootstrapping, segments, router]);

  if (!isBootstrapping) return null;

  return (
    <View style={styles.bootOverlay}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" />
        <Stack.Screen name="CheckIn" />
        <Stack.Screen name="CheckOut" />
        <Stack.Screen name="DestructionScan" />
        <Stack.Screen name="DestroyRequest" />
      </Stack>
      <AuthGate />
    </Provider>
  );
}

const styles = StyleSheet.create({
  bootOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
  },
});
