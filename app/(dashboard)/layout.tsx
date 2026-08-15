"use client";

import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOutUser();
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="flex justify-between items-center p-4 bg-[#0D0D0D] border-b border-[#2C2C2C]">
        <h1 className="text-2xl font-bold text-white">CIRCU</h1>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="bg-[#FF2E2E] hover:bg-red-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
