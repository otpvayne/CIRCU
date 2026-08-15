import SimuladorPrestamo from "@/components/dashboard/SimuladorPrestamo";

export default function SimuladorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white">Simulador de préstamo</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        Calcula cuotas antes de negociar con tu cliente — no se guarda nada hasta que registres el préstamo.
      </p>
      <SimuladorPrestamo />
    </div>
  );
}
