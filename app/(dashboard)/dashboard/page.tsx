"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/db";
import {
  actualizarEstadosCuotasVencidas,
  obtenerPrestamosConProgreso,
  obtenerResumenGeneral,
} from "@/lib/prestamos";
import { fadeUp } from "@/lib/motion";
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
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        await actualizarEstadosCuotasVencidas(user.id);
        const [resumenData, prestamosData] = await Promise.all([
          obtenerResumenGeneral(user.id),
          obtenerPrestamosConProgreso(user.id),
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
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="flex items-center justify-between gap-3"
      >
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <button
          onClick={() => router.push("/prestamos/nuevo")}
          className="flex items-center gap-1.5 bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-3 px-5 rounded-lg text-base whitespace-nowrap transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar préstamo
        </button>
      </motion.div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {resumen && (
        <motion.div custom={0.1} initial="hidden" animate="show" variants={fadeUp}>
          <ResumenCard
            capitalTotalPrestado={resumen.capitalTotalPrestado}
            totalRecuperado={resumen.totalRecuperado}
            totalPorRecuperar={resumen.totalPorRecuperar}
            gananciaTotal={resumen.gananciaTotal}
            gananciaProyectada={resumen.gananciaProyectada}
            cuotasVencidas={resumen.cuotasVencidas}
            cuotasPendientesHoy={resumen.cuotasPendientesHoy}
          />
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {resumen && (
          <motion.div
            custom={0.2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="lg:col-span-2"
          >
            <ProximasVencer cuotas={resumen.cuotasProximos7Dias} />
          </motion.div>
        )}

        <motion.div custom={0.3} initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-3">
          <ListaPrestamos prestamos={prestamos} />
        </motion.div>
      </div>
    </div>
  );
}
