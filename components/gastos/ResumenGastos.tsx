"use client";

import { motion } from "motion/react";
import { ArrowDown, ArrowUp, Minus, Receipt } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { PeriodoResumenGastos, ResumenGastos as ResumenGastosType } from "@/lib/types";

const PERIODO_LABEL: Record<PeriodoResumenGastos, string> = {
  semana: "Semana",
  mes: "Mes",
  año: "Año",
};

const CATEGORIA_COLOR: Record<string, string> = {
  Transporte: "#3B82F6",
  Comida: "#F59E0B",
  Servicios: "#8B5CF6",
  Personal: "#10B981",
  Otro: "#6B7280",
};

function colorCategoria(categoria: string): string {
  return CATEGORIA_COLOR[categoria] ?? "#6B7280";
}

function BadgeComparacion({ diferenciaPorcentual }: { diferenciaPorcentual: number | null }) {
  if (diferenciaPorcentual === null) {
    return <span className="text-xs text-gray-500">Sin gastos en el período anterior para comparar</span>;
  }

  const subio = diferenciaPorcentual > 0;
  const bajo = diferenciaPorcentual < 0;
  const Icono = subio ? ArrowUp : bajo ? ArrowDown : Minus;
  const clase = subio
    ? "bg-red-900 text-red-300 border-red-700"
    : bajo
      ? "bg-green-900 text-green-300 border-green-700"
      : "bg-gray-800 text-gray-400 border-gray-600";

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border whitespace-nowrap ${clase}`}>
      <Icono className="w-3 h-3" /> {Math.abs(diferenciaPorcentual).toFixed(0)}% vs período anterior
    </span>
  );
}

export default function ResumenGastos({
  resumen,
  periodo,
  onPeriodoChange,
}: {
  resumen: ResumenGastosType | null;
  periodo: PeriodoResumenGastos;
  onPeriodoChange: (periodo: PeriodoResumenGastos) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-[#2C2C2C] p-1 bg-[#0D0D0D]">
        {(Object.keys(PERIODO_LABEL) as PeriodoResumenGastos[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodoChange(p)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              periodo === p ? "bg-[#FF2E2E] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {PERIODO_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,46,46,0.16), transparent 70%)" }}
          aria-hidden
        />

        <div className="relative flex items-center gap-2 text-gray-500 mb-1">
          <Receipt className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-widest">
            Gastos de {PERIODO_LABEL[periodo].toLowerCase()}
          </span>
        </div>

        <AnimatedNumber
          value={resumen?.totalPeriodo ?? 0}
          formatter={formatCOP}
          className="relative block text-5xl sm:text-6xl font-bold text-white tabular-nums"
        />

        <div className="relative mt-3 flex items-center gap-3 flex-wrap">
          <BadgeComparacion diferenciaPorcentual={resumen?.comparacionPeriodoAnterior.diferenciaPorcentual ?? 0} />
        </div>

        <p className="relative mt-4 pt-4 border-t border-[#2C2C2C] text-sm text-gray-500">
          Promedio diario:{" "}
          <span className="text-gray-300 font-medium">{formatCOP(resumen?.promedioDiario ?? 0)}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-4 sm:p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Gasto por categoría</h3>

        {!resumen || resumen.totalPorCategoria.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay gastos registrados en este período.</p>
        ) : (
          <div className="space-y-3">
            {resumen.totalPorCategoria.map((item) => (
              <div key={item.categoria}>
                <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
                  <span className="text-gray-300">{item.categoria}</span>
                  <span className="text-white font-medium tabular-nums whitespace-nowrap">
                    {formatCOP(item.total)} · {item.porcentaje.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colorCategoria(item.categoria) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.porcentaje}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
