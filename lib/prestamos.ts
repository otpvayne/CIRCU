import { addMonths, differenceInCalendarDays } from "date-fns";
import { supabase } from "./db";
import type {
  Cuota,
  CuotaCalculada,
  CuotaConCliente,
  EstadoCuota,
  Prestamo,
  PrestamoConProgreso,
  ResumenGeneral,
} from "./types";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function calcularCuotasPrestamo(
  capitalInicial: number,
  tasaInteresMensual: number,
  plazoMeses: number,
  fechaInicio: Date
): CuotaCalculada[] {
  const interesMensual = capitalInicial * (tasaInteresMensual / 100);
  const amortizacionCapital = capitalInicial / plazoMeses;
  const cuotaTotal = interesMensual + amortizacionCapital;

  return Array.from({ length: plazoMeses }, (_, i) => {
    const mes = i + 1;
    return {
      mes,
      fechaVencimiento: addMonths(fechaInicio, mes),
      interesMensual,
      amortizacionCapital,
      cuotaTotal,
    };
  });
}

export function calcularInteresProrrateado(
  interesMensual: number,
  fechaInicioMes: Date,
  fechaPago: Date
): number {
  const diasTranscurridos = differenceInCalendarDays(fechaPago, fechaInicioMes);
  const interesProrrateado = (interesMensual / 30) * diasTranscurridos;
  return Math.min(Math.max(interesProrrateado, 0), interesMensual);
}

export async function crearPrestamoConCuotas(
  userId: string,
  clienteNombre: string,
  capitalInicial: number,
  tasaInteresMensual: number,
  fechaInicio: Date,
  plazoMeses = 6
): Promise<{ prestamo: Prestamo; cuotas: Cuota[] }> {
  const { data: prestamo, error: prestamoError } = await supabase
    .from("prestamos")
    .insert([
      {
        user_id: userId,
        cliente_nombre: clienteNombre,
        capital_inicial: capitalInicial,
        tasa_interes_mensual: tasaInteresMensual,
        plazo_meses: plazoMeses,
        fecha_inicio: toDateOnly(fechaInicio),
      },
    ])
    .select()
    .single();

  if (prestamoError) throw prestamoError;

  const cuotasCalculadas = calcularCuotasPrestamo(
    capitalInicial,
    tasaInteresMensual,
    plazoMeses,
    fechaInicio
  );

  const { data: cuotas, error: cuotasError } = await supabase
    .from("cuotas")
    .insert(
      cuotasCalculadas.map((c) => ({
        prestamo_id: prestamo.id,
        mes: c.mes,
        fecha_vencimiento: toDateOnly(c.fechaVencimiento),
        interes_mensual: c.interesMensual,
        amortizacion_capital: c.amortizacionCapital,
        cuota_total: c.cuotaTotal,
      }))
    )
    .select();

  if (cuotasError) throw cuotasError;

  return { prestamo: prestamo as Prestamo, cuotas: (cuotas ?? []) as Cuota[] };
}

export async function obtenerResumenGeneral(userId: string): Promise<ResumenGeneral> {
  const { data: prestamos, error: prestamosError } = await supabase
    .from("prestamos")
    .select("id, capital_inicial")
    .eq("user_id", userId);

  if (prestamosError) throw prestamosError;

  const capitalTotalPrestado = (prestamos ?? []).reduce(
    (sum, p) => sum + Number(p.capital_inicial),
    0
  );
  const prestamoIds = (prestamos ?? []).map((p) => p.id);

  if (prestamoIds.length === 0) {
    return {
      capitalTotalPrestado: 0,
      totalRecuperado: 0,
      totalPorRecuperar: 0,
      cuotasVencidas: 0,
      cuotasPendientesHoy: 0,
      cuotasProximos7Dias: [],
    };
  }

  const { data: cuotas, error: cuotasError } = await supabase
    .from("cuotas")
    .select("monto_pagado, fecha_vencimiento, estado")
    .in("prestamo_id", prestamoIds);

  if (cuotasError) throw cuotasError;

  const totalRecuperado = (cuotas ?? []).reduce((sum, c) => sum + Number(c.monto_pagado), 0);
  const totalPorRecuperar = capitalTotalPrestado - totalRecuperado;

  const hoy = new Date();
  const hoyStr = toDateOnly(hoy);
  const en7Dias = new Date(hoy);
  en7Dias.setUTCDate(en7Dias.getUTCDate() + 7);
  const en7DiasStr = toDateOnly(en7Dias);

  const cuotasVencidas = (cuotas ?? []).filter(
    (c) => c.fecha_vencimiento < hoyStr && c.estado !== "pagado"
  ).length;
  const cuotasPendientesHoy = (cuotas ?? []).filter((c) => c.fecha_vencimiento === hoyStr).length;

  const { data: proximas, error: proximasError } = await supabase
    .from("cuotas")
    .select("*, prestamos!inner(cliente_nombre, user_id)")
    .eq("prestamos.user_id", userId)
    .eq("estado", "pendiente")
    .gte("fecha_vencimiento", hoyStr)
    .lte("fecha_vencimiento", en7DiasStr)
    .order("fecha_vencimiento", { ascending: true });

  if (proximasError) throw proximasError;

  type ProximaRow = Cuota & { prestamos: { cliente_nombre: string; user_id: string } };

  const cuotasProximos7Dias: CuotaConCliente[] = ((proximas ?? []) as ProximaRow[]).map((c) => {
    const { prestamos: relatedPrestamo, ...cuota } = c;
    return { ...cuota, cliente_nombre: relatedPrestamo.cliente_nombre };
  });

  return {
    capitalTotalPrestado,
    totalRecuperado,
    totalPorRecuperar,
    cuotasVencidas,
    cuotasPendientesHoy,
    cuotasProximos7Dias,
  };
}

export async function actualizarEstadosCuotasVencidas(userId: string): Promise<void> {
  const { data: prestamos, error: prestamosError } = await supabase
    .from("prestamos")
    .select("id")
    .eq("user_id", userId);

  if (prestamosError) throw prestamosError;

  const prestamoIds = (prestamos ?? []).map((p) => p.id);
  if (prestamoIds.length === 0) return;

  const hoyStr = toDateOnly(new Date());

  const { error } = await supabase
    .from("cuotas")
    .update({ estado: "vencido" })
    .in("prestamo_id", prestamoIds)
    .eq("estado", "pendiente")
    .lt("fecha_vencimiento", hoyStr);

  if (error) throw error;
}

export async function obtenerPrestamosConProgreso(userId: string): Promise<PrestamoConProgreso[]> {
  const { data: prestamos, error: prestamosError } = await supabase
    .from("prestamos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (prestamosError) throw prestamosError;
  if (!prestamos || prestamos.length === 0) return [];

  const prestamoIds = prestamos.map((p) => p.id);

  const { data: cuotas, error: cuotasError } = await supabase
    .from("cuotas")
    .select("prestamo_id, cuota_total, monto_pagado")
    .in("prestamo_id", prestamoIds);

  if (cuotasError) throw cuotasError;

  const totales = new Map<string, { totalAPagar: number; totalRecuperado: number }>();
  for (const c of cuotas ?? []) {
    const acc = totales.get(c.prestamo_id) ?? { totalAPagar: 0, totalRecuperado: 0 };
    acc.totalAPagar += Number(c.cuota_total);
    acc.totalRecuperado += Number(c.monto_pagado);
    totales.set(c.prestamo_id, acc);
  }

  return (prestamos as Prestamo[]).map((p) => {
    const t = totales.get(p.id) ?? { totalAPagar: 0, totalRecuperado: 0 };
    const progreso = t.totalAPagar > 0 ? Math.round((t.totalRecuperado / t.totalAPagar) * 100) : 0;
    return { ...p, progreso, totalAPagar: t.totalAPagar, totalRecuperado: t.totalRecuperado };
  });
}

export async function obtenerPrestamoDetalle(
  prestamoId: string
): Promise<{ prestamo: Prestamo; cuotas: Cuota[] }> {
  const { data: prestamo, error: prestamoError } = await supabase
    .from("prestamos")
    .select("*")
    .eq("id", prestamoId)
    .single();

  if (prestamoError) throw prestamoError;

  const { data: cuotas, error: cuotasError } = await supabase
    .from("cuotas")
    .select("*")
    .eq("prestamo_id", prestamoId)
    .order("mes", { ascending: true });

  if (cuotasError) throw cuotasError;

  return { prestamo: prestamo as Prestamo, cuotas: (cuotas ?? []) as Cuota[] };
}

export async function registrarPagoCuota(
  cuota: Cuota,
  fechaInicioPrestamo: string,
  montoPagado: number,
  fechaPago: Date
): Promise<Cuota> {
  const fechaVencimiento = new Date(cuota.fecha_vencimiento);
  const fechaInicioMes = addMonths(new Date(fechaInicioPrestamo), cuota.mes - 1);

  let cuotaTotalAjustada = Number(cuota.cuota_total);

  if (fechaPago < fechaVencimiento) {
    const interesProrrateado = calcularInteresProrrateado(
      Number(cuota.interes_mensual),
      fechaInicioMes,
      fechaPago
    );
    cuotaTotalAjustada = interesProrrateado + Number(cuota.amortizacion_capital);
  }

  const montoTotalPagado = Number(cuota.monto_pagado) + montoPagado;
  const estado: EstadoCuota = montoTotalPagado >= cuotaTotalAjustada ? "pagado" : "pagado_parcial";

  const { data, error } = await supabase
    .from("cuotas")
    .update({
      monto_pagado: montoTotalPagado,
      fecha_pago: fechaPago.toISOString(),
      estado,
      cuota_total: cuotaTotalAjustada,
    })
    .eq("id", cuota.id)
    .select()
    .single();

  if (error) throw error;
  return data as Cuota;
}
