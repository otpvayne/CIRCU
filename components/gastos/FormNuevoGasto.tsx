"use client";

import { useState } from "react";
import { CATEGORIAS_GASTO, crearGasto } from "@/lib/gastos";
import { supabase } from "@/lib/db";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function FormNuevoGasto({ onGastoCreado }: { onGastoCreado: () => void }) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_GASTO[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmacion, setConfirmacion] = useState(false);

  function resetForm() {
    setFecha(new Date().toISOString().slice(0, 10));
    setDescripcion("");
    setMonto("");
    setCategoria(CATEGORIAS_GASTO[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConfirmacion(false);

    const montoNum = Number(monto);
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!(montoNum > 0)) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setGuardando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      await crearGasto(user.id, new Date(fecha), descripcion.trim(), montoNum, categoria);
      onGastoCreado();
      resetForm();
      setConfirmacion(true);
      setTimeout(() => setConfirmacion(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-base focus:outline-none focus:border-[#FF2E2E]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-base focus:outline-none focus:border-[#FF2E2E]"
          >
            {CATEGORIAS_GASTO.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-base focus:outline-none focus:border-[#FF2E2E]"
          placeholder="Ej: Gasolina, mercado, recarga celular"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Monto (COP)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step="any"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-base focus:outline-none focus:border-[#FF2E2E]"
          placeholder="50000"
          required
        />
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">{error}</div>
      )}

      {confirmacion && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded text-sm">
          Gasto registrado.
        </div>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
      >
        {guardando ? <LoadingDots size={6} color="#fff" className="mx-auto" /> : "Registrar gasto"}
      </button>
    </form>
  );
}
