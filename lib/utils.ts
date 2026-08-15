import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function estadoCuotaBadge(estado: string): { label: string; emoji: string; className: string } {
  switch (estado) {
    case "pagado":
      return { label: "Pagado", emoji: "🟢", className: "bg-green-900 text-green-300 border-green-700" };
    case "pagado_parcial":
      return { label: "Pago parcial", emoji: "🟡", className: "bg-yellow-900 text-yellow-300 border-yellow-700" };
    case "vencido":
      return { label: "Vencido", emoji: "🔴", className: "bg-red-900 text-red-300 border-red-700" };
    default:
      return { label: "Pendiente", emoji: "🟡", className: "bg-gray-800 text-gray-300 border-gray-600" };
  }
}
