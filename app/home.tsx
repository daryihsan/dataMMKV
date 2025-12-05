// home.tsx (atau app/home.tsx jika menggunakan Expo Router)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Button,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth"; // Tambahkan onAuthStateChanged dan User
// Import db, auth, dan storage dari firebaseConfig.js
import { db, auth, storage } from "../firebaseConfig"; // Perlu auth diimport
import { useAuth } from "../AuthContext"; // Import useAuth hook

// Tipe data untuk Mahasiswa
interface Mahasiswa {
  id: string; // ID Dokumen Firestore
  nama: string;
  prodi: string;
  fakultas: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticatedWithFirebase } = useAuth(); // Ambil flag ini
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fungsi untuk mengambil data mahasiswa dari Firestore
  const fetchMahasiswaData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "mahasiswa"));
      const data: Mahasiswa[] = [];
      querySnapshot.forEach((doc) => {
        // Ambil data dan tambahkan ID dokumen
        data.push({
          id: doc.id,
          // Pastikan nama field sesuai dengan Firestore Anda
          nama: doc.data().nama,
          prodi: doc.data().prodi,
          fakultas: doc.data().fakultas,
        });
      });
      setMahasiswaList(data);
    } catch (error) {
      // Error ini akan muncul jika user belum terautentikasi sepenuhnya
      console.error("Error fetching documents: ", error);
      alert("Gagal mengambil data mahasiswa. Cek koneksi atau status login.");
    } finally {
      setLoading(false);
    }
  };

  // Ambil data saat component mount
  useEffect(() => {
    if (user) {
      // Fetch data baik dari fallback maupun real Firebase
      console.log("HOME: User available (isAuthenticatedWithFirebase =", isAuthenticatedWithFirebase, "), fetching data...");
      
      // Jika user dari fallback, tunggu 1 detik untuk Firebase emit real user
      // Kemudian retry fetch jika masih error
      if (!isAuthenticatedWithFirebase) {
        console.log("HOME: User dari fallback, tunggu 1 detik sebelum fetch...");
        const delayTimer = setTimeout(() => {
          console.log("HOME: Retry fetching dengan real Firebase user...");
          fetchMahasiswaData();
        }, 1000);
        
        return () => clearTimeout(delayTimer);
      } else {
        fetchMahasiswaData();
      }
    } else {
      // Tidak ada user, redirect ke login
      console.log("HOME: No user, redirect to login");
      setLoading(false);
      router.replace("/login");
    }
  }, [user, isAuthenticatedWithFirebase]);

  // Fungsi Logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out dari Firebase Auth

      // Hapus SEMUA data dari MMKV, termasuk credentials
      storage.clearAll();

      // Navigasi kembali ke halaman index
      router.replace("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const onRefresh = async () => {
    if (user) {
      // Pastikan user ada sebelum refresh
      setRefreshing(true);
      await fetchMahasiswaData();
      setRefreshing(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Memuat data mahasiswa...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Mahasiswa }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.nama}</Text>
      <Text>NIM: {item.id}</Text>
      <Text>Prodi: {item.prodi}</Text>
      <Text>Fakultas: {item.fakultas}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Mahasiswa</Text>
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
      <FlatList
        data={mahasiswaList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Tidak ada data mahasiswa.</Text>
        }
      />
      <Button title="Refresh Data" onPress={onRefresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 10 },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "bold" },
  item: {
    padding: 18,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 16 },
});
