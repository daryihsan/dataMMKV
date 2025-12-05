// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../AuthContext";

export default function Index() {
  const { user, isInitialized } = useAuth();

  // Tunggu sampai auth sudah di-initialize
  // (Loading screen sudah ditangani di _layout.tsx)
  if (!isInitialized) {
    return null; // Tidak akan pernah reach sini karena _layout sudah block
  }

  // Redirect berdasarkan user state
  return user ? (
    <Redirect href="/home" />
  ) : (
    <Redirect href="/login" />
  );
}