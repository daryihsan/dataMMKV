import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth, db } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;
    if (!email || !password) {
      Alert.alert("Error", "Email dan password harus diisi");
      return;
    }
    
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("REGISTER: User berhasil dibuat, uid =", user.uid);

      // Bisa simpan data user ke Firestore 
      // await setDoc(doc(db, "users", user.uid), {
      //   email: user.email,
      //   createdAt: new Date(),
      // });

      Alert.alert("Berhasil", "Akun berhasil dibuat!");
      router.replace("/login");
    } catch (error: any) {
      console.error("Register Error:", error);
      Alert.alert("Register Gagal", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Akun</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={handleRegister}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleRegister}
        secureTextEntry
      />

      <Button
        title={loading ? "Loading..." : "Register"}
        onPress={handleRegister}
        disabled={loading}
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title="Sudah punya akun? Login"
          onPress={() => router.push("/login")}
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
