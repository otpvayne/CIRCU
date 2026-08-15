"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { formatCOP } from "@/lib/utils";
import { staggerItem, staggerList } from "@/lib/motion";
import type { PrestamoConProgreso } from "@/lib/types";

const ESTADO_BADGE: Record<string, string> = {
  activo: "bg-blue-900 text-blue-300 border-blue-700",
  pagado_completo: "bg-green-900 text-green-300 border-green-700",
  vencido: "bg-red-900 text-red-300 border-red-700",
  archivado: "bg-gray-800 text-gray-400 border-gray-600",
};

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${ESTADO_BADGE[estado] ?? ""} ${
        estado === "vencido" ? "animate-pulse-glow-red" : ""
      }`}
    >
      {estado}
    </span>
  );
}

function ProgressBar({ progreso }: { progreso: number }) {
  return (
    <div className="h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#FF2E2E]"
        initial={{ width: 0 }}
        animate={{ width: `${progreso}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

export default function ListaPrestamos({ prestamos }: { prestamos: PrestamoConProgreso[] }) {
  const router = useRouter();
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const activos = prestamos.filter((p) => p.estado !== "archivado");
  const archivados = prestamos.filter((p) => p.estado === "archivado");
  const visibles = mostrarArchivados ? prestamos : activos;

  if (prestamos.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Préstamos</h3>
        <p className="text-gray-500 text-sm">Todavía no has registrado ningún préstamo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Préstamos</h3>
        {archivados.length > 0 && (
          <button
            onClick={() => setMostrarArchivados((v) => !v)}
            className="text-gray-500 text-sm underline underline-offset-2 hover:text-gray-300 transition-colors"
          >
            {mostrarArchivados ? "Ocultar archivados" : `Ver archivados (${archivados.length})`}
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay préstamos activos.</p>
      ) : (
        <>
          <motion.div variants={staggerList} initial="hidden" animate="show" className="grid gap-3 sm:hidden">
            {visibles.map((p) => (
              <motion.button
                key={p.id}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/prestamos/${p.id}`)}
                className="w-full text-left bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl p-4 transition-colors hover:border-gray-600"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-white font-bold">{p.cliente_nombre}</span>
                  <EstadoBadge estado={p.estado} />
                </div>
                <p className="text-white text-lg font-bold tabular-nums">
                  {formatCOP(Number(p.capital_inicial))}
                </p>
                <div className="mt-2">
                  <ProgressBar progreso={p.progreso} />
                </div>
                <p className="text-gray-500 text-xs mt-1">{p.progreso}% recuperado</p>
              </motion.button>
            ))}
          </motion.div>

          <table className="w-full hidden sm:table">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-widest border-b border-[#2C2C2C]">
                <th className="py-2 font-medium">Cliente</th>
                <th className="py-2 font-medium">Capital</th>
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 font-medium">Progreso</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerList} initial="hidden" animate="show">
              {visibles.map((p) => (
                <motion.tr
                  key={p.id}
                  variants={staggerItem}
                  onClick={() => router.push(`/prestamos/${p.id}`)}
                  className="cursor-pointer border-b border-[#2C2C2C] transition-colors hover:bg-[#222222]"
                >
                  <td className="py-3 text-white">{p.cliente_nombre}</td>
                  <td className="py-3 text-white tabular-nums">{formatCOP(Number(p.capital_inicial))}</td>
                  <td className="py-3">
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td className="py-3 text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <ProgressBar progreso={p.progreso} />
                      </div>
                      <span className="tabular-nums text-sm text-gray-400">{p.progreso}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </>
      )}
    </div>
  );
}
