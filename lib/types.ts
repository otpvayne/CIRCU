export type EstadoPrestamo = "activo" | "pagado_completo" | "vencido" | "archivado";
export type EstadoCuota = "pendiente" | "vencido" | "pagado" | "pagado_parcial";
export type MetodoPago = "efectivo" | "transferencia" | "otro";

export interface Prestamo {
  id: string;
  user_id: string;
  cliente_nombre: string;
  capital_inicial: number;
  tasa_interes_mensual: number;
  plazo_meses: number;
  fecha_inicio: string;
  estado: EstadoPrestamo;
  created_at: string;
  updated_at: string;
}

export interface Cuota {
  id: string;
  prestamo_id: string;
  mes: number;
  fecha_vencimiento: string;
  interes_mensual: number;
  amortizacion_capital: number;
  cuota_total: number;
  monto_pagado: number;
  fecha_pago: string | null;
  estado: EstadoCuota;
  created_at: string;
  updated_at: string;
}

export interface CuotaCalculada {
  mes: number;
  fechaVencimiento: Date;
  interesMensual: number;
  amortizacionCapital: number;
  cuotaTotal: number;
}

export interface CuotaConCliente extends Cuota {
  cliente_nombre: string;
}

export interface PrestamoConProgreso extends Prestamo {
  progreso: number;
  totalAPagar: number;
  totalRecuperado: number;
}

export interface ResumenGeneral {
  capitalTotalPrestado: number;
  totalRecuperado: number;
  totalPorRecuperar: number;
  cuotasVencidas: number;
  cuotasPendientesHoy: number;
  cuotasProximos7Dias: CuotaConCliente[];
}

export interface HistorialPago {
  id: string;
  cuota_id: string;
  monto: number;
  fecha_pago: string;
  metodo: MetodoPago;
  notas?: string | null;
  created_at: string;
}

export interface Documento {
  id: string;
  prestamo_id: string;
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo: string;
  tamaño: number;
}
