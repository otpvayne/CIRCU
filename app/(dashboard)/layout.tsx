"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield } from "lucide-react";
import { signOutUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/db";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    // Consulta fresca a la tabla "users" en cada carga del navbar: nunca desde
    // localStorage/sessionStorage ni de metadata cacheada del JWT de Supabase Auth.
    async function cargarRol() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("users").select("rol").eq("id", user.id).maybeSingle();
      if (vigente) setRol(data?.rol?.trim() ?? null);
    }

    cargarRol();
    return () => {
      vigente = false;
    };
  }, []);

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
    <div className="min-h-screen">
      <nav className="flex justify-between items-center p-4 bg-[#0D0D0D] border-b border-[#2C2C2C]">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-512.png" alt="CIRCU" width={36} height={36} className="rounded-lg" priority />
          {rol === "admin" && (
            <span className="text-xs font-bold text-red-300 bg-red-900 border border-red-700 px-2 py-0.5 rounded-full tracking-wide">
              ADMIN
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rol === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-1.5 border border-[#2C2C2C] text-gray-400 hover:text-white hover:border-gray-500 px-3 py-2 rounded text-sm transition-colors"
            >
              <Shield className="w-4 h-4" /> Panel Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 bg-[#FF2E2E] hover:bg-red-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {loading ? <LoadingDots size={5} color="#fff" /> : "Cerrar sesión"}
          </button>
        </div>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
