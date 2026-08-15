"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/db";
import { limitesPeriodo, obtenerGastos, obtenerResumenGastos } from "@/lib/gastos";
import { fadeUp } from "@/lib/motion";
import FormNuevoGasto from "@/components/gastos/FormNuevoGasto";
import ResumenGastos from "@/components/gastos/ResumenGastos";
import ListaGastos from "@/components/gastos/ListaGastos";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { Gasto, PeriodoResumenGastos, ResumenGastos as ResumenGastosType } from "@/lib/types";

export default function GastosPage() {
  const [periodo, setPeriodo] = useState<PeriodoResumenGastos>("mes");
  const [resumen, setResumen] = useState<ResumenGastosType | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async (periodoActual: PeriodoResumenGastos) => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { inicio, fin } = limitesPeriodo(periodoActual, new Date());
      const [resumenData, gastosData] = await Promise.all([
        obtenerResumenGastos(user.id, periodoActual),
        obtenerGastos(user.id, inicio, fin),
      ]);
      setResumen(resumenData);
      setGastos(gastosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(periodo);
  }, [periodo, cargar]);

  function handleGastoCreado() {
    setMostrarForm(false);
    cargar(periodo);
  }

  if (loading && !resumen) {
    return <LoadingScreen message="Cargando tus gastos..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        <h2 className="text-2xl font-bold text-white">Gastos</h2>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-3 px-5 rounded-lg text-base whitespace-nowrap transition-colors"
        >
          {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mostrarForm ? "Cancelar" : "Registrar gasto"}
        </button>
      </motion.div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">{error}</div>
      )}

      {mostrarForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <FormNuevoGasto onGastoCreado={handleGastoCreado} />
        </motion.div>
      )}

      <motion.div custom={0.1} initial="hidden" animate="show" variants={fadeUp}>
        <ResumenGastos resumen={resumen} periodo={periodo} onPeriodoChange={setPeriodo} />
      </motion.div>

      <motion.div custom={0.2} initial="hidden" animate="show" variants={fadeUp}>
        <ListaGastos gastos={gastos} onCambio={() => cargar(periodo)} />
      </motion.div>
    </div>
  );
}
