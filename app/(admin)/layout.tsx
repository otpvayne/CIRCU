"use client";

import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/db";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.rol === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/dashboard");
        return;
      }
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  async function handleLogout() {
    await signOutUser();
    router.push("/sign-in");
    router.refresh();
  }

  if (loading) {
    return <LoadingScreen message="Verificando acceso..." />;
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <nav className="flex justify-between items-center p-4 bg-[#0D0D0D] border-b border-[#FF2E2E]">
        <h1 className="text-2xl font-bold text-[#FF2E2E]">CIRCU — ADMIN</h1>
        <button
          onClick={handleLogout}
          className="bg-[#FF2E2E] hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
        >
          Cerrar sesión
        </button>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
