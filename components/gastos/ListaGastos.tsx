"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Pencil, Trash2 } from "lucide-react";
import { actualizarGasto, CATEGORIAS_GASTO, eliminarGasto } from "@/lib/gastos";
import { formatCOP, formatDate } from "@/lib/utils";
import { staggerItem, staggerList } from "@/lib/motion";
import { LoadingDots } from "@/components/ui/LoadingDots";
import type { Gasto } from "@/lib/types";

export default function ListaGastos({
  gastos,
  onCambio,
}: {
  gastos: Gasto[];
  onCambio: () => void;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fechaEdit, setFechaEdit] = useState("");
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [montoEdit, setMontoEdit] = useState("");
  const [categoriaEdit, setCategoriaEdit] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function abrirEdicion(g: Gasto) {
    setEditandoId(g.id);
    setFechaEdit(g.fecha);
    setDescripcionEdit(g.descripcion);
    setMontoEdit(String(g.monto));
    setCategoriaEdit(g.categoria ?? CATEGORIAS_GASTO[0]);
    setError("");
  }

  async function guardarEdicion() {
    if (!editandoId) return;
    const monto = Number(montoEdit);
    if (!descripcionEdit.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!(monto > 0)) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await actualizarGasto(editandoId, {
        fecha: new Date(fechaEdit),
        descripcion: descripcionEdit.trim(),
        monto,
        categoria: categoriaEdit,
      });
      onCambio();
      setEditandoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(g: Gasto) {
    if (!confirm(`¿Eliminar el gasto "${g.descripcion}"? Esta acción no se puede deshacer.`)) return;

    setEliminandoId(g.id);
    setError("");
    try {
      await eliminarGasto(g.id);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el gasto");
    } finally {
      setEliminandoId(null);
    }
  }

  if (gastos.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Gastos</h3>
        <p className="text-gray-500 text-sm">No hay gastos registrados en este período.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#2C2C2C] bg-[#1A1A1A] p-4 sm:p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Gastos</h3>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm mb-3">{error}</div>
      )}

      <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-2">
        {gastos.map((g) => (
          <motion.li
            key={g.id}
            variants={staggerItem}
            className="bg-[#0D0D0D] border border-[#2C2C2C] rounded-lg p-3"
          >
            {editandoId === g.id ? (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={fechaEdit}
                    onChange={(e) => setFechaEdit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded text-white text-sm"
                  />
                  <select
                    value={categoriaEdit}
                    onChange={(e) => setCategoriaEdit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded text-white text-sm"
                  >
                    {CATEGORIAS_GASTO.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={descripcionEdit}
                  onChange={(e) => setDescripcionEdit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded text-white text-sm"
                  placeholder="Descripción"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step="any"
                  value={montoEdit}
                  onChange={(e) => setMontoEdit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded text-white text-sm"
                  placeholder="Monto"
                />
                <div className="flex gap-2">
                  <button
                    onClick={guardarEdicion}
                    disabled={guardando}
                    className="flex-1 bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-2 rounded text-sm disabled:opacity-50"
                  >
                    {guardando ? <LoadingDots size={5} color="#fff" className="mx-auto" /> : "Guardar"}
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="px-4 py-2 border border-[#2C2C2C] text-gray-300 rounded text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium truncate">{g.descripcion}</p>
                    {g.categoria && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-800 text-gray-300 border-gray-600 whitespace-nowrap">
                        {g.categoria}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{formatDate(g.fecha)}</p>
                </div>
                <p className="text-white font-bold tabular-nums shrink-0">{formatCOP(Number(g.monto))}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirEdicion(g)}
                    aria-label={`Editar ${g.descripcion}`}
                    className="p-2 rounded text-gray-400 hover:text-white hover:bg-[#2C2C2C]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEliminar(g)}
                    disabled={eliminandoId === g.id}
                    aria-label={`Eliminar ${g.descripcion}`}
                    className="p-2 rounded text-red-500 hover:bg-red-900/30 disabled:opacity-50"
                  >
                    {eliminandoId === g.id ? (
                      <LoadingDots size={4} color="#ef4444" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
