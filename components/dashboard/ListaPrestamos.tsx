"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCOP } from "@/lib/utils";
import type { PrestamoConProgreso } from "@/lib/types";

const ESTADO_BADGE: Record<string, string> = {
  activo: "bg-blue-900 text-blue-300 border-blue-700",
  pagado_completo: "bg-green-900 text-green-300 border-green-700",
  vencido: "bg-red-900 text-red-300 border-red-700",
  archivado: "bg-gray-800 text-gray-400 border-gray-600",
};

export default function ListaPrestamos({ prestamos }: { prestamos: PrestamoConProgreso[] }) {
  const router = useRouter();
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const activos = prestamos.filter((p) => p.estado !== "archivado");
  const archivados = prestamos.filter((p) => p.estado === "archivado");
  const visibles = mostrarArchivados ? prestamos : activos;

  if (prestamos.length === 0) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-2">Préstamos</h3>
        <p className="text-gray-400 text-sm">Todavía no has registrado ningún préstamo.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-white">Préstamos</h3>
        {archivados.length > 0 && (
          <button
            onClick={() => setMostrarArchivados((v) => !v)}
            className="text-gray-400 text-sm underline underline-offset-2 hover:text-gray-300"
          >
            {mostrarArchivados ? "Ocultar archivados" : `Ver archivados (${archivados.length})`}
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay préstamos activos.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {visibles.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/prestamos/${p.id}`)}
                className="w-full text-left bg-[#0D0D0D] border border-[#2C2C2C] rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-white font-bold">{p.cliente_nombre}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${ESTADO_BADGE[p.estado] ?? ""}`}
                  >
                    {p.estado}
                  </span>
                </div>
                <p className="text-white text-lg font-bold">{formatCOP(Number(p.capital_inicial))}</p>
                <div className="mt-2 h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF2E2E]" style={{ width: `${p.progreso}%` }} />
                </div>
                <p className="text-gray-400 text-xs mt-1">{p.progreso}% recuperado</p>
              </button>
            ))}
          </div>

          <table className="w-full hidden sm:table">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-[#2C2C2C]">
                <th className="py-2 font-medium">Cliente</th>
                <th className="py-2 font-medium">Capital</th>
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 font-medium">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/prestamos/${p.id}`)}
                  className="cursor-pointer border-b border-[#2C2C2C] hover:bg-[#0D0D0D]"
                >
                  <td className="py-3 text-white">{p.cliente_nombre}</td>
                  <td className="py-3 text-white">{formatCOP(Number(p.capital_inicial))}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded border ${ESTADO_BADGE[p.estado] ?? ""}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3 text-white">{p.progreso}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
