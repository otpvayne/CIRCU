"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { crearPrestamoConCuotas } from "@/lib/prestamos";
import { supabase } from "@/lib/db";
import { formatCOP } from "@/lib/utils";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function FormNuevoPrestamo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clienteNombre, setClienteNombre] = useState("");
  const [capitalInicial, setCapitalInicial] = useState(() => searchParams.get("capital") ?? "");
  const [tasaInteresMensual, setTasaInteresMensual] = useState(() => searchParams.get("tasa") ?? "");
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const capital = Number(capitalInicial);
    const tasa = Number(tasaInteresMensual);

    if (!clienteNombre.trim()) {
      setError("El nombre del cliente es obligatorio");
      return;
    }
    if (!(capital > 0)) {
      setError("El capital debe ser mayor a 0");
      return;
    }
    if (!(tasa > 0)) {
      setError("La tasa de interés debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      const { prestamo } = await crearPrestamoConCuotas(
        user.id,
        clienteNombre.trim(),
        capital,
        tasa,
        new Date(fechaInicio)
      );

      router.push(`/prestamos/${prestamo.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el préstamo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del cliente</label>
        <input
          type="text"
          value={clienteNombre}
          onChange={(e) => setClienteNombre(e.target.value)}
          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
          placeholder="Nombre completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Capital inicial (COP)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step="any"
          value={capitalInicial}
          onChange={(e) => setCapitalInicial(e.target.value)}
          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
          placeholder="1000000"
          required
        />
        {capitalInicial && !Number.isNaN(Number(capitalInicial)) && (
          <p className="text-gray-500 text-sm mt-1">{formatCOP(Number(capitalInicial))}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tasa de interés mensual (%)
        </label>
        <input
          type="number"
          inputMode="decimal"
          min={0.1}
          step="any"
          value={tasaInteresMensual}
          onChange={(e) => setTasaInteresMensual(e.target.value)}
          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
          placeholder="10"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Fecha de inicio</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white text-lg focus:outline-none focus:border-[#FF2E2E]"
          required
        />
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FF2E2E] hover:bg-red-700 text-white font-bold text-lg py-4 px-4 rounded disabled:opacity-50"
      >
        {loading ? <LoadingDots size={6} color="#fff" /> : "Registrar préstamo"}
      </button>
    </form>
  );
}
