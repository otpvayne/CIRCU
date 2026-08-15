"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Clock } from "lucide-react";
import { formatCOP, formatDate } from "@/lib/utils";
import type { CuotaConCliente } from "@/lib/types";

export default function ProximasVencer({ cuotas }: { cuotas: CuotaConCliente[] }) {
  const router = useRouter();

  return (
    <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg overflow-hidden">
      <h3 className="text-lg font-bold text-white p-4 pb-2">Próximas a vencer</h3>

      {cuotas.length === 0 ? (
        <p className="text-gray-400 text-sm px-4 pb-4">
          No hay cuotas próximas a vencer en los próximos 7 días.
        </p>
      ) : (
        <ul>
          {cuotas.map((cuota) => (
            <li key={cuota.id} className="border-t border-[#2C2C2C]">
              <button
                onClick={() => router.push(`/prestamos/${cuota.prestamo_id}`)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
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
                  <span className="text-white font-bold">{formatCOP(Number(cuota.cuota_total))}</span>
                  <span className="text-gray-400 text-xs">{formatDate(cuota.fecha_vencimiento)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
