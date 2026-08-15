import { calcularMontosCuota } from "./amortizacion";

export interface SimulacionResultado {
  interesMensual: number;
  amortizacionMensual: number;
  cuotaMensual: number;
  totalAPagar: number;
  totalIntereses: number;
  cuotas: Array<{
    mes: number;
    interes: number;
    amortizacion: number;
    cuotaTotal: number;
    saldoRestante: number;
  }>;
}

/**
 * Cálculo 100% en el cliente, sin Supabase — sirve para negociar con un cliente potencial
 * antes de registrar nada. Usa la misma fórmula que calcularCuotasPrestamo (lib/prestamos.ts),
 * así que para el mismo capital/tasa/plazo da exactamente los mismos números que un préstamo real.
 */
export function simularPrestamo(
  capital: number,
  tasaInteresMensual: number,
  plazoMeses: number = 6
): SimulacionResultado {
  const { interesMensual, amortizacionMensual, cuotaMensual } = calcularMontosCuota(
    capital,
    tasaInteresMensual,
    plazoMeses
  );

  const cuotas = Array.from({ length: plazoMeses }, (_, i) => {
    const mes = i + 1;
    return {
      mes,
      interes: interesMensual,
      amortizacion: amortizacionMensual,
      cuotaTotal: cuotaMensual,
      saldoRestante: Math.max(capital - amortizacionMensual * mes, 0),
    };
  });

  return {
    interesMensual,
    amortizacionMensual,
    cuotaMensual,
    totalAPagar: cuotaMensual * plazoMeses,
    totalIntereses: interesMensual * plazoMeses,
    cuotas,
  };
}
