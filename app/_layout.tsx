// app/_layout.tsx
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../AuthContext";

function RootLayoutNav() {
  const { isInitialized } = useAuth();

  // Block render sampai Firebase Auth selesai initialize
  // INI SANGAT PENTING! Tanpa ini, app akan render sebelum auth ready
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack>
      {/* Route index.tsx (Redirect Logic) dan login.tsx (Login Screen) 
        Tidak perlu header karena mereka bagian dari flow Auth
      */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      {/* Route home.tsx
        Bisa menggunakan header atau tidak,z saya sarankan menggunakan header 
        untuk konsistensi aplikasi.
      */}
      <Stack.Screen
        name="home"
        options={{ title: "Daftar Mahasiswa" }} // Beri judul yang jelas
      />

      {/* Jika ada route lain, tambahkan di sini
       */}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}