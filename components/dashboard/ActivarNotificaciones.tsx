"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/db";
import {
  notificacionesSoportadas,
  permisoNotificaciones,
  solicitarPermisoNotificaciones,
  suscribirsePush,
} from "@/lib/push";

type Estado = "oculto" | "disponible" | "activando" | "activado" | "denegado";

export default function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>("oculto");

  useEffect(() => {
    if (!notificacionesSoportadas()) {
      setEstado("oculto");
      return;
    }
    const permiso = permisoNotificaciones();
    if (permiso === "granted") setEstado("activado");
    else if (permiso === "denied") setEstado("denegado");
    else setEstado("disponible");
  }, []);

  async function activar() {
    setEstado("activando");

    const permiso = await solicitarPermisoNotificaciones();
    if (permiso !== "granted") {
      setEstado(permiso === "denied" ? "denegado" : "disponible");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setEstado("disponible");
      return;
    }

    const ok = await suscribirsePush(user.id);
    setEstado(ok ? "activado" : "disponible");
  }

  if (estado === "oculto" || estado === "activado" || estado === "denegado") return null;

  return (
    <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-[#FF2E2E] shrink-0" aria-hidden />
        <p className="text-sm text-gray-300">
          Activa las notificaciones para que te avisemos cuándo cobrar.
        </p>
      </div>
      <button
        onClick={activar}
        disabled={estado === "activando"}
        className="bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-3 px-5 rounded-lg text-sm whitespace-nowrap transition-colors disabled:opacity-50"
      >
        {estado === "activando" ? "Activando..." : "Activar notificaciones"}
      </button>
    </div>
  );
}
