"use client";

export default function SuspendedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#1A1A1A] border border-[#FF2E2E] rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-[#FF2E2E] mb-4">Cuenta Suspendida</h1>
          <p className="text-gray-300 mb-6">
            Tu cuenta ha sido suspendida temporalmente.
          </p>
          <p className="text-gray-400 mb-6">Contacta a NETRIX para reactivarla:</p>
          <a
            href="https://wa.me/573172785407?text=Hola%2C%20necesito%20reactivar%20mi%20cuenta%20de%20CIRCU"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
