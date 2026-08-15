"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertCircle, Clock } from "lucide-react";
import { formatCOP, formatDate } from "@/lib/utils";
import { staggerItem, staggerList } from "@/lib/motion";
import type { CuotaConCliente } from "@/lib/types";

export default function ProximasVencer({ cuotas }: { cuotas: CuotaConCliente[] }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] overflow-hidden">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 p-4 pb-2">
        Próximas a vencer
      </h3>

      {cuotas.length === 0 ? (
        <p className="text-gray-500 text-sm px-4 pb-4">
          No hay cuotas próximas a vencer en los próximos 7 días.
        </p>
      ) : (
        <motion.ul variants={staggerList} initial="hidden" animate="show">
          {cuotas.map((cuota) => (
            <motion.li key={cuota.id} variants={staggerItem} className="border-t border-[#2C2C2C]">
              <button
                onClick={() => router.push(`/prestamos/${cuota.prestamo_id}`)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#222222] active:bg-[#262626]"
                style={{ minHeight: 60 }}
              >
                <span className="flex items-center gap-2 text-white text-base truncate">
                  {cuota.estado === "vencido" ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" aria-hidden />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500 shrink-0" aria-hidden />
                  )}
                  {cuota.cliente_nombre}
                </span>
                <span className="flex flex-col items-end shrink-0">
                  <span className="text-white font-bold tabular-nums">
                    {formatCOP(Number(cuota.cuota_total))}
                  </span>
                  <span className="text-gray-500 text-xs">{formatDate(cuota.fecha_vencimiento)}</span>
                </span>
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
