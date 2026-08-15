"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpUser } from "@/lib/auth";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUpUser(email, password, "usuario");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2">CIRCU</h1>
          <p className="text-gray-400 mb-6">Crea tu cuenta</p>

          <form onSubmit={handleSignUp} className="space-y-4">
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
                Contraseña (mín. 6 caracteres)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
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
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
