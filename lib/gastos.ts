import { supabase } from "./db";
import type { ComparacionPeriodoGastos, Gasto, PeriodoResumenGastos, ResumenGastos, TotalPorCategoria } from "./types";

export const CATEGORIAS_GASTO = ["Transporte", "Comida", "Servicios", "Personal", "Otro"] as const;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Toda la aritmética de períodos se hace en UTC puro (Date.UTC), nunca con helpers de
 * date-fns como startOfWeek/endOfWeek: esos calculan en la hora LOCAL del navegador, y como
 * "fecha" en la tabla gastos es un DATE sin zona horaria (comparado como string YYYY-MM-DD
 * vía toDateOnly, que sí es UTC), mezclar ambos corre el límite "fin" un día completo para
 * usuarios en zonas horarias detrás de UTC (ej. Colombia, UTC-5) — cerca de medianoche local
 * el fin de semana/mes/año cae ya en el día UTC siguiente.
 */
function diaUTC(fecha: Date): { y: number; m: number; d: number } {
  return { y: fecha.getUTCFullYear(), m: fecha.getUTCMonth(), d: fecha.getUTCDate() };
}

export function limitesPeriodo(periodo: PeriodoResumenGastos, fechaReferencia: Date): { inicio: Date; fin: Date } {
  const { y, m, d } = diaUTC(fechaReferencia);

  switch (periodo) {
    case "semana": {
      const hoyUTC = new Date(Date.UTC(y, m, d));
      const offsetLunes = (hoyUTC.getUTCDay() + 6) % 7; // días transcurridos desde el lunes
      const inicio = new Date(Date.UTC(y, m, d - offsetLunes));
      const fin = new Date(Date.UTC(y, m, d - offsetLunes + 6));
      return { inicio, fin };
    }
    case "mes":
      return { inicio: new Date(Date.UTC(y, m, 1)), fin: new Date(Date.UTC(y, m + 1, 0)) };
    case "año":
      return { inicio: new Date(Date.UTC(y, 0, 1)), fin: new Date(Date.UTC(y, 11, 31)) };
  }
}

function fechaPeriodoAnterior(periodo: PeriodoResumenGastos, fechaReferencia: Date): Date {
  const { y, m, d } = diaUTC(fechaReferencia);

  switch (periodo) {
    case "semana":
      return new Date(Date.UTC(y, m, d - 7));
    case "mes":
      return new Date(Date.UTC(y, m - 1, d));
    case "año":
      return new Date(Date.UTC(y - 1, m, d));
  }
}

/** Días transcurridos del período hasta fechaReferencia (o el período completo si ya terminó). Mínimo 1. */
function diasTranscurridos(inicio: Date, fin: Date, fechaReferencia: Date): number {
  const { y, m, d } = diaUTC(fechaReferencia);
  const refUTC = Date.UTC(y, m, d);
  const limite = Math.min(refUTC, fin.getTime());
  return Math.max(1, Math.round((limite - inicio.getTime()) / MS_POR_DIA) + 1);
}

export async function crearGasto(
  userId: string,
  fecha: Date,
  descripcion: string,
  monto: number,
  categoria: string
): Promise<Gasto> {
  const { data, error } = await supabase
    .from("gastos")
    .insert([
      {
        user_id: userId,
        fecha: toDateOnly(fecha),
        descripcion,
        monto,
        categoria,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Gasto;
}

export async function obtenerGastos(userId: string, desde?: Date, hasta?: Date): Promise<Gasto[]> {
  let query = supabase.from("gastos").select("*").eq("user_id", userId).order("fecha", { ascending: false });

  if (desde) query = query.gte("fecha", toDateOnly(desde));
  if (hasta) query = query.lte("fecha", toDateOnly(hasta));

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Gasto[];
}

export async function actualizarGasto(
  gastoId: string,
  cambios: { fecha?: Date; descripcion?: string; monto?: number; categoria?: string }
): Promise<Gasto> {
  const updates: Record<string, unknown> = {};
  if (cambios.fecha !== undefined) updates.fecha = toDateOnly(cambios.fecha);
  if (cambios.descripcion !== undefined) updates.descripcion = cambios.descripcion;
  if (cambios.monto !== undefined) updates.monto = cambios.monto;
  if (cambios.categoria !== undefined) updates.categoria = cambios.categoria;

  const { data, error } = await supabase.from("gastos").update(updates).eq("id", gastoId).select().single();
  if (error) throw error;
  return data as Gasto;
}

export async function eliminarGasto(gastoId: string): Promise<void> {
  const { error } = await supabase.from("gastos").delete().eq("id", gastoId);
  if (error) throw error;
}

export async function obtenerResumenGastos(
  userId: string,
  periodo: PeriodoResumenGastos,
  fechaReferencia: Date = new Date()
): Promise<ResumenGastos> {
  const { inicio, fin } = limitesPeriodo(periodo, fechaReferencia);
  const { inicio: inicioAnterior, fin: finAnterior } = limitesPeriodo(
    periodo,
    fechaPeriodoAnterior(periodo, fechaReferencia)
  );

  const [gastosPeriodo, gastosAnterior] = await Promise.all([
    obtenerGastos(userId, inicio, fin),
    obtenerGastos(userId, inicioAnterior, finAnterior),
  ]);

  const totalPeriodo = gastosPeriodo.reduce((sum, g) => sum + Number(g.monto), 0);
  const totalAnterior = gastosAnterior.reduce((sum, g) => sum + Number(g.monto), 0);

  const porCategoria = new Map<string, number>();
  for (const g of gastosPeriodo) {
    const categoria = g.categoria?.trim() || "Otro";
    porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + Number(g.monto));
  }

  const totalPorCategoria: TotalPorCategoria[] = Array.from(porCategoria.entries())
    .map(([categoria, total]) => ({
      categoria,
      total,
      porcentaje: totalPeriodo > 0 ? (total / totalPeriodo) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  let diferenciaPorcentual: number | null;
  if (totalAnterior > 0) {
    diferenciaPorcentual = ((totalPeriodo - totalAnterior) / totalAnterior) * 100;
  } else if (totalPeriodo > 0) {
    diferenciaPorcentual = null;
  } else {
    diferenciaPorcentual = 0;
  }

  const comparacionPeriodoAnterior: ComparacionPeriodoGastos = { totalAnterior, diferenciaPorcentual };
  const promedioDiario = totalPeriodo / diasTranscurridos(inicio, fin, fechaReferencia);

  return { totalPeriodo, totalPorCategoria, comparacionPeriodoAnterior, promedioDiario };
}
