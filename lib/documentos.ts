import { supabase } from "./db";
import type { Documento } from "./types";

const BUCKET = "documentos-prestamos";
const MAX_BYTES = 5 * 1024 * 1024;
const DIEZ_ANIOS_SEGUNDOS = 60 * 60 * 24 * 365 * 10;

const EXTENSIONES_PERMITIDAS: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function validarArchivo(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return "El archivo supera el tamaño máximo permitido (5 MB).";
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ext in EXTENSIONES_PERMITIDAS)) {
    return "Tipo de archivo no permitido. Usa PDF, JPG, JPEG, PNG, DOC o DOCX.";
  }
  return null;
}

function sanitizarNombre(nombre: string): string {
  return nombre.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/** Extrae el path dentro del bucket a partir de la signed URL guardada en url_archivo. */
function extraerPathStorage(urlArchivo: string): string | null {
  const marker = `/object/sign/${BUCKET}/`;
  const idx = urlArchivo.indexOf(marker);
  if (idx === -1) return null;
  const resto = urlArchivo.slice(idx + marker.length);
  return decodeURIComponent(resto.split("?")[0]);
}

export async function subirDocumento(prestamoId: string, userId: string, file: File): Promise<Documento> {
  const errorValidacion = validarArchivo(file);
  if (errorValidacion) throw new Error(errorValidacion);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = file.type || EXTENSIONES_PERMITIDAS[ext];
  const path = `${userId}/${prestamoId}/${Date.now()}-${sanitizarNombre(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });

  if (uploadError) throw uploadError;

  // Bucket privado: se firma la URL al momento de subir, con vencimiento largo (10 años),
  // en lugar de getPublicUrl (que no funciona en buckets privados).
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, DIEZ_ANIOS_SEGUNDOS);

  if (signedError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw signedError;
  }

  const { data, error } = await supabase
    .from("documentos")
    .insert([
      {
        prestamo_id: prestamoId,
        nombre_archivo: file.name,
        url_archivo: signedData.signedUrl,
        tipo_archivo: contentType,
        tamaño: file.size,
      },
    ])
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }

  return data as Documento;
}

export async function obtenerDocumentos(prestamoId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("prestamo_id", prestamoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Documento[];
}

export async function eliminarDocumento(documentoId: string, urlArchivo: string): Promise<void> {
  const path = extraerPathStorage(urlArchivo);
  if (path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("documentos").delete().eq("id", documentoId);
  if (error) throw error;
}
