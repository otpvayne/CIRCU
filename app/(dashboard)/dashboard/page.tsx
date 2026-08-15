"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import {
  actualizarEstadosCuotasVencidas,
  obtenerPrestamosConProgreso,
  obtenerResumenGeneral,
} from "@/lib/prestamos";
import ResumenCard from "@/components/dashboard/ResumenCard";
import ProximasVencer from "@/components/dashboard/ProximasVencer";
import ListaPrestamos from "@/components/dashboard/ListaPrestamos";
import type { PrestamoConProgreso, ResumenGeneral } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [prestamos, setPrestamos] = useState<PrestamoConProgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      try {
        await actualizarEstadosCuotasVencidas(session.user.id);
        const [resumenData, prestamosData] = await Promise.all([
          obtenerResumenGeneral(session.user.id),
          obtenerPrestamosConProgreso(session.user.id),
        ]);
        setResumen(resumenData);
        setPrestamos(prestamosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="text-white text-center py-20">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <button
          onClick={() => router.push("/dashboard/prestamos/nuevo")}
          className="bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-3 px-5 rounded text-base whitespace-nowrap"
        >
          + Registrar préstamo
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {resumen && (
        <>
          <ResumenCard
            capitalTotalPrestado={resumen.capitalTotalPrestado}
            totalRecuperado={resumen.totalRecuperado}
            totalPorRecuperar={resumen.totalPorRecuperar}
            cuotasVencidas={resumen.cuotasVencidas}
            cuotasPendientesHoy={resumen.cuotasPendientesHoy}
          />
          <ProximasVencer cuotas={resumen.cuotasProximos7Dias} />
        </>
      )}

      <ListaPrestamos prestamos={prestamos} />
    </div>
  );
}
