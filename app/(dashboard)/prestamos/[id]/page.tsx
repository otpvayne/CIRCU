"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Archive, ArrowLeft, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import {
  actualizarDatosPrestamo,
  archivarPrestamo,
  eliminarPrestamo,
  obtenerHistorialPagos,
  obtenerPrestamoDetalle,
  registrarPagoCuota,
} from "@/lib/prestamos";
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

  const [editando, setEditando] = useState(false);
  const [nombreEdit, setNombreEdit] = useState("");
  const [tasaEdit, setTasaEdit] = useState("");
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const [eliminando, setEliminando] = useState(false);
  const [ofrecerArchivar, setOfrecerArchivar] = useState(false);

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

  function abrirEdicion() {
    if (!prestamo) return;
    setNombreEdit(prestamo.cliente_nombre);
    setTasaEdit(String(prestamo.tasa_interes_mensual));
    setEditando(true);
  }

  async function handleGuardarEdicion() {
    if (!prestamo) return;
    const nombre = nombreEdit.trim();
    const tasa = Number(tasaEdit);

    if (!nombre) {
      setError("El nombre del cliente es obligatorio");
      return;
    }
    if (!(tasa > 0)) {
      setError("La tasa de interés debe ser mayor a 0");
      return;
    }

    setGuardandoEdit(true);
    setError("");
    try {
      await actualizarDatosPrestamo(prestamo.id, { clienteNombre: nombre, tasaInteresMensual: tasa });
      setEditando(false);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el préstamo");
    } finally {
      setGuardandoEdit(false);
    }
  }

  async function handleEliminar() {
    if (!prestamo) return;
    if (!confirm(`¿Eliminar el préstamo de ${prestamo.cliente_nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setEliminando(true);
    setError("");
    setOfrecerArchivar(false);
    try {
      await eliminarPrestamo(prestamo.id);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el préstamo");
      setOfrecerArchivar(true);
      setEliminando(false);
    }
  }

  async function handleArchivar() {
    if (!prestamo) return;
    setEliminando(true);
    setError("");
    try {
      await archivarPrestamo(prestamo.id);
      setOfrecerArchivar(false);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al archivar el préstamo");
    } finally {
      setEliminando(false);
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
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1 text-gray-400 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {prestamo.estado === "pagado_completo" && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-center font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Préstamo completado
        </div>
      )}

      {prestamo.estado === "archivado" && (
        <div className="bg-gray-800 border border-gray-600 text-gray-300 px-4 py-3 rounded-lg text-center font-bold flex items-center justify-center gap-2">
          <Archive className="w-5 h-5" /> Préstamo archivado — ya no recibe pagos
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold text-white">{prestamo.cliente_nombre}</h2>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={abrirEdicion}
              aria-label="Editar préstamo"
              className="p-2 rounded border border-[#2C2C2C] text-gray-300 hover:text-white hover:border-gray-500"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              aria-label="Eliminar préstamo"
              className="p-2 rounded border border-[#2C2C2C] text-red-500 hover:bg-red-900/30 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {editando && (
          <div className="mb-4 p-4 bg-[#0D0D0D] border border-[#2C2C2C] rounded-lg space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del cliente</label>
              <input
                type="text"
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tasa de interés mensual (%)</label>
              <input
                type="number"
                step="any"
                min={0.1}
                value={tasaEdit}
                onChange={(e) => setTasaEdit(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded text-white"
              />
              <p className="text-gray-500 text-xs mt-1">
                Solo se recalculan las cuotas pendientes o vencidas; las que ya tienen pagos no cambian.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGuardarEdicion}
                disabled={guardandoEdit}
                className="flex-1 bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-2 rounded disabled:opacity-50"
              >
                {guardandoEdit ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                onClick={() => setEditando(false)}
                className="px-4 py-2 border border-[#2C2C2C] text-gray-300 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm space-y-2">
          <p>{error}</p>
          {ofrecerArchivar && (
            <button
              onClick={handleArchivar}
              disabled={eliminando}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              <Archive className="w-4 h-4" /> Archivar en su lugar
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {cuotas.map((cuota) => {
          const badge = estadoCuotaBadge(cuota.estado);
          const BadgeIcon = badge.icon;
          const puedePagar = cuota.estado !== "pagado" && prestamo.estado !== "archivado";

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
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border whitespace-nowrap ${badge.className}`}
                  >
                    <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
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
