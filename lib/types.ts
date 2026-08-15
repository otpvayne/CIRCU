export type EstadoPrestamo = "activo" | "finalizado" | "moroso";
export type EstadoCuota = "pendiente" | "pagada" | "vencida";
export type MetodoPago = "efectivo" | "transferencia" | "otro";

export interface Prestamo {
  id: string;
  userId: string;
  clienteNombre: string;
  capitalInicial: number;
  tasaInteresMensual: number;
  plazoMeses: number;
  fechaInicio: string;
  estado: EstadoPrestamo;
  createdAt: string;
  updatedAt: string;
}

export interface Cuota {
  id: string;
  prestamoId: string;
  mes: number;
  fechaVencimiento: string;
  interesMensual: number;
  amortizacionCapital: number;
  cuotaTotal: number;
  montoPagado: number;
  fechaPago: string | null;
  estado: EstadoCuota;
}

export interface HistorialPago {
  id: string;
  cuotaId: string;
  monto: number;
  fechaPago: string;
  metodo: MetodoPago;
  notas?: string | null;
}

export interface Documento {
  id: string;
  prestamoId: string;
  nombreArchivo: string;
  urlArchivo: string;
  tipoArchivo: string;
  tamaño: number;
}
