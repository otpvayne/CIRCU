"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db";
import { suspendUser, reactivateUser } from "@/lib/auth";

interface Subscription {
  user_id: string;
  estado: string;
  monto_mensual: number;
  fecha_proximo_pago: string | null;
  dias_mora_actuales: number;
}

interface User {
  id: string;
  email: string;
  rol: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, Subscription>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("rol", "usuario");

      const { data: subsData } = await supabase.from("subscriptions").select("*");

      if (usersData) setUsers(usersData as User[]);
      if (subsData) {
        const subsMap = (subsData as Subscription[]).reduce((acc, sub) => {
          acc[sub.user_id] = sub;
          return acc;
        }, {} as Record<string, Subscription>);
        setSubscriptions(subsMap);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleSuspend(userId: string) {
    if (!confirm("¿Suspender acceso a este usuario?")) return;
    try {
      await suspendUser(userId, "Impago de mensualidad");
      alert("Usuario suspendido");
      window.location.reload();
    } catch {
      alert("Error al suspender usuario");
    }
  }

  async function handleReactivate(userId: string) {
    if (!confirm("¿Reactivar acceso a este usuario?")) return;
    try {
      await reactivateUser(userId);
      alert("Usuario reactivado");
      window.location.reload();
    } catch {
      alert("Error al reactivar usuario");
    }
  }

  if (loading) return <div className="text-white">Cargando...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Panel Administrativo</h2>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => {
          const sub = subscriptions[user.id];
          return (
            <div key={user.id} className="bg-[#1A1A1A] border border-[#2C2C2C] p-4 rounded">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white font-bold">{user.email}</p>
                  <p className="text-gray-400 text-sm">
                    Estado:{" "}
                    <span className={sub?.estado === "activo" ? "text-green-500" : "text-red-500"}>
                      {sub?.estado || "—"}
                    </span>
                  </p>
                  {(sub?.dias_mora_actuales ?? 0) > 0 && (
                    <p className="text-red-400 text-sm">
                      {sub.dias_mora_actuales} días de mora
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {sub?.estado === "activo" ? (
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Suspender
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(user.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
