"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Download, FileText, Image as ImageIcon, Paperclip, Trash2 } from "lucide-react";
import { eliminarDocumento, obtenerDocumentos, subirDocumento } from "@/lib/documentos";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { fadeUp, staggerItem, staggerList } from "@/lib/motion";
import type { Documento } from "@/lib/types";

function formatearTamaño(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short", day: "numeric" }).format(
    new Date(fecha)
  );
}

export default function DocumentosPrestamo({
  prestamoId,
  userId,
  delay = 0,
}: {
  prestamoId: string;
  userId: string;
  delay?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      setDocumentos(await obtenerDocumentos(prestamoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los documentos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestamoId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSubiendo(true);
    setError("");
    try {
      const nuevo = await subirDocumento(prestamoId, userId, file);
      setDocumentos((prev) => [nuevo, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el documento");
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(doc: Documento) {
    if (!confirm(`¿Eliminar "${doc.nombre_archivo}"? Esta acción no se puede deshacer.`)) return;

    setEliminandoId(doc.id);
    setError("");
    try {
      await eliminarDocumento(doc.id, doc.url_archivo);
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el documento");
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <motion.div
      custom={delay}
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-white font-bold">Documentos</h3>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="flex items-center gap-1.5 bg-[#2C2C2C] hover:bg-[#3a3a3a] text-white font-medium py-2 px-3 rounded-lg text-sm disabled:opacity-50"
        >
          {subiendo ? (
            <LoadingDots size={5} color="#fff" />
          ) : (
            <>
              <Paperclip className="w-4 h-4" /> Agregar documento
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm mb-3">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando documentos...</p>
      ) : documentos.length === 0 ? (
        <p className="text-gray-500 text-sm">Aún no has subido ningún documento para este préstamo.</p>
      ) : (
        <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-2">
          {documentos.map((doc) => {
            const Icono = doc.tipo_archivo.startsWith("image/") ? ImageIcon : FileText;
            return (
              <motion.li
                key={doc.id}
                variants={staggerItem}
                className="flex items-center gap-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded-lg p-3"
              >
                <Icono className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{doc.nombre_archivo}</p>
                  <p className="text-gray-500 text-xs">
                    {formatearTamaño(doc.tamaño)} · {formatearFecha(doc.created_at)}
                  </p>
                </div>
                <a
                  href={doc.url_archivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ver o descargar ${doc.nombre_archivo}`}
                  className="p-2 rounded text-gray-300 hover:text-white hover:bg-[#2C2C2C] shrink-0"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleEliminar(doc)}
                  disabled={eliminandoId === doc.id}
                  aria-label={`Eliminar ${doc.nombre_archivo}`}
                  className="p-2 rounded text-red-500 hover:bg-red-900/30 disabled:opacity-50 shrink-0"
                >
                  {eliminandoId === doc.id ? (
                    <LoadingDots size={4} color="#ef4444" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </motion.div>
  );
}
