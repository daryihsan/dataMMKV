// login.tsx (atau app/login.tsx jika menggunakan Expo Router)
import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
// Import auth dan storage dari firebaseConfig.js
import { auth, storage } from "../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Login Handler
  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      Alert.alert("Error", "Email dan password harus diisi");
      return;
    }
    
    setLoading(true);

    try {
      // 1. Lakukan Autentikasi Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("LOGIN: User login berhasil, uid =", user.uid);

      // 2. Simpan Informasi Login ke MMKV
      storage.set("userEmail", user.email || "");
      storage.set("userId", user.uid);
      // PENTING: Simpan password untuk auto-login saat startup!
      // Ini adalah workaround karena Firebase persistence di MMKV tidak bekerja di React Native
      storage.set("userPassword", password);

      console.log("LOGIN: Data disimpan ke MMKV (dengan password untuk auto-login)");

      // Navigasi ke halaman home setelah login berhasil
      router.replace("/home");
    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert("Login Gagal", error.message);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Mahasiswa</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={handleLogin} // ENTER = login
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onSubmitEditing={handleLogin} // ENTER = login
      />
      <Button
        title={loading ? "Loading..." : "Login"}
        onPress={handleLogin}
        disabled={loading}
      />
        <View style={{ marginTop: 20 }}>
      
      <Button 
        title="Belum punya akun? Register"
        onPress={() => router.push("/register")}
      />
        </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: "center" },
  title: {
    fontSize: 26,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    height: 45,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});