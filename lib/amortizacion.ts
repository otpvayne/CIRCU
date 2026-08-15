export interface MontosCuota {
  interesMensual: number;
  amortizacionMensual: number;
  cuotaMensual: number;
}

/**
 * Fórmula central de CIRCU: interés y amortización FIJOS sobre el capital inicial durante
 * todo el plazo (no decrecientes). La usan tanto lib/prestamos.ts (préstamos reales) como
 * lib/simulador.ts (simulación sin guardar nada), para garantizar que dan el mismo resultado.
 */
export function calcularMontosCuota(
  capitalInicial: number,
  tasaInteresMensual: number,
  plazoMeses: number
): MontosCuota {
  if (plazoMeses <= 0) {
    return { interesMensual: 0, amortizacionMensual: 0, cuotaMensual: 0 };
  }

  const interesMensual = capitalInicial * (tasaInteresMensual / 100);
  const amortizacionMensual = capitalInicial / plazoMeses;
  const cuotaMensual = interesMensual + amortizacionMensual;

  return { interesMensual, amortizacionMensual, cuotaMensual };
}
