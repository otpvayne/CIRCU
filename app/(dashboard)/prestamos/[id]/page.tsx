"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerHistorialPagos, obtenerPrestamoDetalle, registrarPagoCuota } from "@/lib/prestamos";
import { estadoCuotaBadge, formatCOP, formatDate } from "@/lib/utils";
import type { Cuota, HistorialPago, MetodoPago, Prestamo } from "@/lib/types";

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  otro: "Otro",
};

export default function PrestamoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cuotaEnPago, setCuotaEnPago] = useState<string | null>(null);
  const [montoPago, setMontoPago] = useState("");
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().slice(0, 10));
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [bancoDestino, setBancoDestino] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [cuotaExpandida, setCuotaExpandida] = useState<string | null>(null);
  const [historialPorCuota, setHistorialPorCuota] = useState<Record<string, HistorialPago[]>>({});
  const [cargandoHistorial, setCargandoHistorial] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await obtenerPrestamoDetalle(params.id);
      setPrestamo(data.prestamo);
      setCuotas(data.cuotas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el préstamo");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function toggleHistorial(cuotaId: string) {
    if (cuotaExpandida === cuotaId) {
      setCuotaExpandida(null);
      return;
    }

    setCuotaExpandida(cuotaId);

    if (!historialPorCuota[cuotaId]) {
      setCargandoHistorial(cuotaId);
      try {
        const pagos = await obtenerHistorialPagos(cuotaId);
        setHistorialPorCuota((prev) => ({ ...prev, [cuotaId]: pagos }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial de pagos");
      } finally {
        setCargandoHistorial(null);
      }
    }
  }

  function resetFormularioPago() {
    setCuotaEnPago(null);
    setMontoPago("");
    setFechaPago(new Date().toISOString().slice(0, 10));
    setMetodoPago("efectivo");
    setBancoDestino("");
  }

  async function handleRegistrarPago(cuota: Cuota) {
    if (!prestamo) return;
    const monto = Number(montoPago);
    if (!(monto > 0)) {
      setError("El monto pagado debe ser mayor a 0");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await registrarPagoCuota(
        cuota,
        prestamo.fecha_inicio,
        monto,
        new Date(fechaPago),
        metodoPago,
        bancoDestino || undefined
      );
      resetFormularioPago();
      setHistorialPorCuota((prev) => {
        const next = { ...prev };
        delete next[cuota.id];
        return next;
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <div className="text-white text-center py-20">Cargando...</div>;
  if (!prestamo) {
    return (
      <div className="text-white text-center py-20">
        <p>{error || "Préstamo no encontrado"}</p>
      </div>
    );
  }

  const totalAPagar = cuotas.reduce((sum, c) => sum + Number(c.cuota_total), 0);
  const totalPagado = cuotas.reduce((sum, c) => sum + Number(c.monto_pagado), 0);
  const progreso = totalAPagar > 0 ? Math.round((totalPagado / totalAPagar) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.push("/dashboard")} className="text-gray-400 text-sm">
        ← Volver
      </button>

      {prestamo.estado === "pagado_completo" && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-center font-bold">
          Préstamo completado ✅
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">{prestamo.cliente_nombre}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Capital</p>
            <p className="text-white text-xl font-bold">{formatCOP(Number(prestamo.capital_inicial))}</p>
          </div>
          <div>
            <p className="text-gray-400">Tasa mensual</p>
            <p className="text-white text-xl font-bold">{Number(prestamo.tasa_interes_mensual)}%</p>
          </div>
          <div>
            <p className="text-gray-400">Plazo</p>
            <p className="text-white text-xl font-bold">{prestamo.plazo_meses} meses</p>
          </div>
          <div>
            <p className="text-gray-400">Fecha de inicio</p>
            <p className="text-white text-xl font-bold">{formatDate(prestamo.fecha_inicio)}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-sm">Pagado hasta hoy</p>
            <p className="text-white text-2xl font-bold">{formatCOP(totalPagado)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Falta pagar</p>
            <p className="text-white text-2xl font-bold">
              {formatCOP(Math.max(totalAPagar - totalPagado, 0))}
            </p>
          </div>
        </div>
        <div className="h-3 bg-[#2C2C2C] rounded-full overflow-hidden">
          <div className="h-full bg-[#FF2E2E]" style={{ width: `${progreso}%` }} />
        </div>
        <p className="text-gray-400 text-sm mt-1">{progreso}% recuperado</p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {cuotas.map((cuota) => {
          const badge = estadoCuotaBadge(cuota.estado);
          const puedePagar = cuota.estado !== "pagado";

          return (
            <div key={cuota.id} className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-4">
              <button
                onClick={() => toggleHistorial(cuota.id)}
                className="w-full flex justify-between items-center gap-3 text-left"
              >
                <div>
                  <p className="text-white font-bold">Mes {cuota.mes}</p>
                  <p className="text-gray-400 text-sm">{formatDate(cuota.fecha_vencimiento)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-lg font-bold">{formatCOP(Number(cuota.cuota_total))}</p>
                  <span className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${badge.className}`}>
                    {badge.emoji} {badge.label}
                  </span>
                </div>
              </button>

              {cuotaExpandida === cuota.id && (
                <div className="mt-3 pt-3 border-t border-[#2C2C2C]">
                  {cargandoHistorial === cuota.id ? (
                    <p className="text-gray-400 text-sm">Cargando historial...</p>
                  ) : (historialPorCuota[cuota.id]?.length ?? 0) === 0 ? (
                    <p className="text-gray-400 text-sm">Sin pagos registrados todavía.</p>
                  ) : (
                    <ul className="space-y-1">
                      {historialPorCuota[cuota.id].map((pago) => (
                        <li key={pago.id} className="text-sm text-gray-300">
                          <div className="flex justify-between items-center">
                            <span>{formatDate(pago.fecha_pago)}</span>
                            <span>
                              {METODO_LABEL[pago.metodo] ?? pago.metodo}
                              {pago.notas ? ` (${pago.notas})` : ""}
                            </span>
                            <span className="text-white font-medium">{formatCOP(Number(pago.monto))}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {puedePagar && (
                <div className="mt-3">
                  {cuotaEnPago === cuota.id ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Monto pagado"
                        value={montoPago}
                        onChange={(e) => setMontoPago(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white"
                      />
                      <input
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white"
                      />
                      <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                        className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-base focus:outline-none focus:border-[#FF2E2E]"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="otro">Otro</option>
                      </select>
                      {metodoPago === "transferencia" && (
                        <input
                          type="text"
                          placeholder="Banco o cuenta (ej: Bancolombia, Nequi)"
                          value={bancoDestino}
                          onChange={(e) => setBancoDestino(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-base focus:outline-none focus:border-[#FF2E2E] mt-2"
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegistrarPago(cuota)}
                          disabled={guardando}
                          className="flex-1 bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-2 rounded disabled:opacity-50"
                        >
                          {guardando ? "Guardando..." : "Confirmar pago"}
                        </button>
                        <button
                          onClick={resetFormularioPago}
                          className="px-4 py-2 border border-[#2C2C2C] text-gray-300 rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCuotaEnPago(cuota.id);
                        setMontoPago(String(Number(cuota.cuota_total) - Number(cuota.monto_pagado)));
                        setMetodoPago("efectivo");
                        setBancoDestino("");
                      }}
                      className="w-full bg-[#2C2C2C] hover:bg-[#3a3a3a] text-white font-bold py-2 rounded"
                    >
                      Registrar pago
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
