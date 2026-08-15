import { formatCOP } from "@/lib/utils";

interface ResumenCardProps {
  capitalTotalPrestado: number;
  totalRecuperado: number;
  totalPorRecuperar: number;
  cuotasVencidas: number;
  cuotasPendientesHoy: number;
}

export default function ResumenCard({
  capitalTotalPrestado,
  totalRecuperado,
  totalPorRecuperar,
  cuotasVencidas,
  cuotasPendientesHoy,
}: ResumenCardProps) {
  const porcentaje =
    capitalTotalPrestado > 0
      ? Math.min(100, Math.round((totalRecuperado / capitalTotalPrestado) * 100))
      : 0;

  return (
    <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">💰 Resumen general</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Capital total prestado</span>
          <span className="text-white text-2xl font-bold">{formatCOP(capitalTotalPrestado)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total recuperado</span>
          <span className="text-white text-2xl font-bold">{formatCOP(totalRecuperado)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Falta recuperar</span>
          <span className="text-[#FF2E2E] text-2xl font-bold">{formatCOP(totalPorRecuperar)}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-3 bg-[#2C2C2C] rounded-full overflow-hidden">
          <div className="h-full bg-[#FF2E2E]" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="text-gray-400 text-sm mt-1">{porcentaje}% recuperado</p>
      </div>

      <div className="flex gap-4 mt-6 pt-4 border-t border-[#2C2C2C]">
        <div className="flex-1">
          <p className="text-gray-400 text-sm">Cuotas vencidas</p>
          <p className={`text-2xl font-bold ${cuotasVencidas > 0 ? "text-[#FF2E2E]" : "text-white"}`}>
            {cuotasVencidas}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-sm">Vencen hoy</p>
          <p className={`text-2xl font-bold ${cuotasPendientesHoy > 0 ? "text-yellow-400" : "text-white"}`}>
            {cuotasPendientesHoy}
          </p>
        </div>
      </div>
    </div>
  );
}
