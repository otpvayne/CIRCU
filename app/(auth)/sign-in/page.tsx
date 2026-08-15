"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInUser } from "@/lib/auth";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInUser(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2">CIRCU</h1>
          <p className="text-gray-400 mb-6">Control de préstamos y capital</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white focus:outline-none focus:border-[#FF2E2E]"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D0D0D] border border-[#2C2C2C] rounded text-white focus:outline-none focus:border-[#FF2E2E]"
                placeholder="••••••••"
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
              className="w-full bg-[#FF2E2E] hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? <LoadingDots size={6} color="#fff" className="mx-auto" /> : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-gray-400 text-sm mt-6">
            ¿No tienes cuenta? Contacta a NETRIX para registrarte.
          </p>
        </div>
      </div>
    </div>
  );
}
