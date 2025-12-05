# Fix: Firebase Auth + MMKV Persistence Issue

## Problem
Setiap reload app lewat terminal, user selalu balik ke halaman login padahal sebelumnya sudah login. Issue ini terjadi karena:

1. **Firebase Auth initialize async** - Firebase Auth belum selesai initialize ketika app render
2. **MMKV data tidak disimpan dengan benar** - Data MMKV bisa ter-override oleh Firebase Auth
3. **Layout render sebelum auth ready** - App render UI sebelum Firebase Auth siap

## Solution

### 1. Buat AuthContext.tsx
File baru: `AuthContext.tsx` - Ini adalah "jantung" fix

**Cara kerjanya:**
- Subscribe ke `onAuthStateChanged` dari Firebase Auth
- Tunggu Firebase selesai initialize (bukan hanya baca MMKV)
- Simpan user state ke context
- Provide `isInitialized` flag agar layout tahu kapan auth ready

```tsx
const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    storage.set("userId", currentUser.uid);
    setUser(currentUser);
  } else {
    storage.remove("userId");
    setUser(null);
  }
  setIsInitialized(true);  // INI PENTING!
});
```

### 2. Update app/_layout.tsx
```tsx
// Wrap dengan AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Block render sampai auth ready
function RootLayoutNav() {
  const { isInitialized } = useAuth();
  
  if (!isInitialized) {
    return <ActivityIndicator />;  // Loading screen
  }
  
  return <Stack>...</Stack>;
}
```

### 3. Simplify app/index.tsx
```tsx
export default function Index() {
  const { user, isInitialized } = useAuth();
  
  if (!isInitialized) return null;
  
  return user ? <Redirect href="/home" /> : <Redirect href="/login" />;
}
```

**Sebelumnya:** Cek MMKV dengan timer (tidak reliable)
**Sekarang:** Langsung gunakan user state dari AuthContext (100% reliable)

### 4. Update app/home.tsx
```tsx
export default function HomeScreen() {
  const { user } = useAuth();  // Gunakan hook ini
  
  useEffect(() => {
    if (user) {
      fetchMahasiswaData();
    }
  }, [user]);
}
```

## Flow Diagram

```
App Start
    ↓
_layout.tsx render
    ↓
AuthProvider initialize
    ↓
onAuthStateChanged subscribe
    ↓
Firebase Auth initialize complete
    ↓
isInitialized = true
    ↓
RootLayoutNav render
    ↓
index.tsx route
    ↓
user ? home : login
```

## Key Points

✅ **Firebase Auth adalah source of truth**, bukan MMKV
✅ **MMKV hanya untuk local cache**, tidak untuk core logic
✅ **Block entire app render sampai auth ready**
✅ **Hindari auth.currentUser di component, gunakan useAuth hook**

## Testing

1. Login → Simpan kredensial
2. Tekan "Reload" di Expo devtools atau terminal
3. Expected: Langsung ke home tanpa pass login
4. Tekan Logout
5. Tekan "Reload"
6. Expected: Langsung ke login

## Technical Details

- `onAuthStateChanged` auto-restore session dari Firebase internal storage + MMKV
- Firebase menggunakan MMKV untuk persistence (sudah konfigurasi di firebaseConfig.js)
- AuthContext menunggu `onAuthStateChanged` callback sebelum mark `isInitialized = true`
- Tidak ada race condition lagi!
