"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { simularPrestamo } from "@/lib/simulador";
import { formatCOP } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export default function SimuladorPrestamo() {
  const router = useRouter();
  const [capital, setCapital] = useState("1000000");
  const [tasa, setTasa] = useState("10");
  const [plazoMeses, setPlazoMeses] = useState("6");

  const capitalNum = Number(capital);
  const tasaNum = Number(tasa);
  const plazoNum = Number(plazoMeses);

  const valido = capitalNum > 0 && tasaNum > 0 && plazoNum >= 1 && plazoNum <= 12;

  const resultado = useMemo(() => {
    if (!valido) return null;
    return simularPrestamo(capitalNum, tasaNum, plazoNum);
  }, [capitalNum, tasaNum, plazoNum, valido]);

  function handleRegistrar() {
    if (!valido) return;
    router.push(`/prestamos/nuevo?capital=${capitalNum}&tasa=${tasaNum}`);
  }

  return (
    <div className="space-y-6">
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Capital a prestar (COP)</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step="any"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
          />
          {capitalNum > 0 && <p className="text-gray-500 text-sm mt-1">{formatCOP(capitalNum)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tasa mensual (%)</label>
            <input
              type="number"
              inputMode="decimal"
              min={0.1}
              step="any"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plazo (meses)</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              step={1}
              value={plazoMeses}
              onChange={(e) => setPlazoMeses(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
            />
          </div>
        </div>

        {!valido && (
          <p className="text-gray-500 text-sm">
            Ingresa un capital y una tasa mayores a 0, y un plazo entre 1 y 12 meses.
          </p>
        )}
      </motion.div>

      {resultado && (
        <>
          <motion.div
            custom={0.1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-6 sm:p-8"
          >
            <div
              className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-70 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(255,46,46,0.16), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-500">
                Cuota mensual del cliente
              </span>
              <AnimatedNumber
                value={resultado.cuotaMensual}
                formatter={formatCOP}
                duration={0.6}
                className="mt-1 block text-5xl sm:text-6xl font-bold text-white tabular-nums"
              />
            </div>

            <div className="relative mt-8 pt-6 border-t border-[#2C2C2C] grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">
                  Total a pagar ({plazoNum} {plazoNum === 1 ? "mes" : "meses"})
                </p>
                <p className="text-xl font-bold text-white tabular-nums">{formatCOP(resultado.totalAPagar)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">
                  Total de intereses (tu ganancia)
                </p>
                <p className="text-xl font-bold text-[#FF2E2E] tabular-nums">
                  {formatCOP(resultado.totalIntereses)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            custom={0.2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl p-4 sm:p-5 overflow-x-auto"
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              Detalle mes a mes
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-widest border-b border-[#2C2C2C]">
                  <th className="py-2 font-medium">Mes</th>
                  <th className="py-2 font-medium">Interés</th>
                  <th className="py-2 font-medium">Amortización</th>
                  <th className="py-2 font-medium">Cuota</th>
                  <th className="py-2 font-medium">Saldo restante</th>
                </tr>
              </thead>
              <tbody>
                {resultado.cuotas.map((c) => (
                  <tr key={c.mes} className="border-b border-[#2C2C2C] last:border-0">
                    <td className="py-2 text-white">{c.mes}</td>
                    <td className="py-2 text-gray-300 tabular-nums">{formatCOP(c.interes)}</td>
                    <td className="py-2 text-gray-300 tabular-nums">{formatCOP(c.amortizacion)}</td>
                    <td className="py-2 text-white font-medium tabular-nums">{formatCOP(c.cuotaTotal)}</td>
                    <td className="py-2 text-gray-400 tabular-nums">{formatCOP(c.saldoRestante)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.button
            custom={0.3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            onClick={handleRegistrar}
            className="w-full flex items-center justify-center gap-2 bg-[#FF2E2E] hover:bg-red-700 text-white font-bold text-lg py-4 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" /> Registrar este préstamo
          </motion.button>
        </>
      )}
    </div>
  );
}
