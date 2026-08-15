import { TrendingUp, Wallet } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface ResumenCardProps {
  capitalTotalPrestado: number;
  totalRecuperado: number;
  totalPorRecuperar: number;
  gananciaTotal: number;
  gananciaProyectada: number;
  cuotasVencidas: number;
  cuotasPendientesHoy: number;
}

export default function ResumenCard({
  capitalTotalPrestado,
  totalRecuperado,
  totalPorRecuperar,
  gananciaTotal,
  gananciaProyectada,
  cuotasVencidas,
  cuotasPendientesHoy,
}: ResumenCardProps) {
  const porcentaje =
    capitalTotalPrestado > 0
      ? Math.min(100, Math.round((totalRecuperado / capitalTotalPrestado) * 100))
      : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,46,46,0.16), transparent 70%)" }}
        aria-hidden
      />

      <div className="relative grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Ganancia cobrada</span>
          </div>
          <AnimatedNumber
            value={gananciaTotal}
            formatter={formatCOP}
            className="mt-1 block text-5xl sm:text-6xl font-bold text-white tabular-nums"
          />
          <p className="mt-2 text-sm text-gray-500">
            Proyectada si se completa todo:{" "}
            <span className="text-gray-300 font-medium">{formatCOP(gananciaProyectada)}</span>
          </p>
        </div>

        <ProgressRing percentage={porcentaje} label="Recuperado" />
      </div>

      <div className="relative mt-8 pt-6 border-t border-[#2C2C2C] grid grid-cols-2 sm:grid-cols-3 gap-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#0D0D0D] p-2 shrink-0">
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">Capital prestado</p>
            <p className="text-xl font-bold text-white tabular-nums">{formatCOP(capitalTotalPrestado)}</p>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">Recuperado</p>
          <p className="text-xl font-bold text-white tabular-nums">{formatCOP(totalRecuperado)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">Falta recuperar</p>
          <p className="text-xl font-bold text-[#FF2E2E] tabular-nums">{formatCOP(totalPorRecuperar)}</p>
        </div>
      </div>

      <div className="relative mt-6 flex gap-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">Cuotas vencidas</p>
          <p className={`text-lg font-bold ${cuotasVencidas > 0 ? "text-[#FF2E2E]" : "text-white"}`}>
            {cuotasVencidas}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">Vencen hoy</p>
          <p className={`text-lg font-bold ${cuotasPendientesHoy > 0 ? "text-yellow-400" : "text-white"}`}>
            {cuotasPendientesHoy}
          </p>
        </div>
      </div>
    </div>
  );
}
