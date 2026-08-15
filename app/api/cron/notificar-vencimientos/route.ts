import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

function autorizado(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get("secret") === secret;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Días de atraso entre dos fechas "date only" (YYYY-MM-DD); 0 si vence hoy. */
function diasDeAtraso(fechaVencimiento: string, hoyStr: string): number {
  const msPorDia = 1000 * 60 * 60 * 24;
  const diff = Date.parse(hoyStr) - Date.parse(fechaVencimiento);
  return Math.max(0, Math.round(diff / msPorDia));
}

type CuotaRow = {
  id: string;
  prestamo_id: string;
  cuota_total: number;
  monto_pagado: number;
  fecha_vencimiento: string;
  estado: string;
  prestamos: { cliente_nombre: string; user_id: string };
};

type CuotaUrgente = {
  prestamoId: string;
  clienteNombre: string;
  montoPendiente: number;
  diasAtraso: number;
};

/**
 * Corre vía Vercel Cron (ver vercel.json), una vez al día. Por cada usuario con
 * suscripciones push activas, arma UN push con la cuota más urgente (más días de
 * atraso, luego mayor monto) entre las vencidas o que vencen hoy.
 */
export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: subscripciones, error: subsError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  if (!subscripciones || subscripciones.length === 0) {
    return NextResponse.json({ usuariosNotificados: 0, pushEnviados: 0, suscripcionesEliminadas: 0 });
  }

  const userIds = Array.from(new Set(subscripciones.map((s) => s.user_id)));
  const hoyStr = toDateOnly(new Date());

  const { data: cuotas, error: cuotasError } = await supabaseAdmin
    .from("cuotas")
    .select(
      "id, prestamo_id, cuota_total, monto_pagado, fecha_vencimiento, estado, prestamos!inner(cliente_nombre, user_id)"
    )
    .in("prestamos.user_id", userIds)
    .neq("estado", "pagado")
    .lte("fecha_vencimiento", hoyStr);

  if (cuotasError) {
    return NextResponse.json({ error: cuotasError.message }, { status: 500 });
  }

  const urgentesPorUsuario = new Map<string, CuotaUrgente[]>();

  for (const c of (cuotas ?? []) as unknown as CuotaRow[]) {
    const userId = c.prestamos.user_id;
    const lista = urgentesPorUsuario.get(userId) ?? [];
    lista.push({
      prestamoId: c.prestamo_id,
      clienteNombre: c.prestamos.cliente_nombre,
      montoPendiente: Number(c.cuota_total) - Number(c.monto_pagado),
      diasAtraso: diasDeAtraso(c.fecha_vencimiento, hoyStr),
    });
    urgentesPorUsuario.set(userId, lista);
  }

  let pushEnviados = 0;
  let suscripcionesEliminadas = 0;
  let usuariosNotificados = 0;

  for (const [userId, items] of Array.from(urgentesPorUsuario)) {
    // Prioridad: más días de atraso primero, luego mayor monto pendiente.
    items.sort((a, b) => b.diasAtraso - a.diasAtraso || b.montoPendiente - a.montoPendiente);
    const masUrgente = items[0];
    const n = items.length;

    let title: string;
    let body: string;
    if (n === 1) {
      if (masUrgente.diasAtraso > 0) {
        title = `Pago atrasado: ${masUrgente.clienteNombre}`;
        body = `${masUrgente.diasAtraso} día${masUrgente.diasAtraso === 1 ? "" : "s"} de atraso — ${formatCOP(masUrgente.montoPendiente)}`;
      } else {
        title = `Hoy vence el pago de ${masUrgente.clienteNombre}`;
        body = formatCOP(masUrgente.montoPendiente);
      }
    } else {
      title = `Tienes ${n} cobros pendientes`;
      body = `El más urgente: ${masUrgente.clienteNombre} — ${formatCOP(masUrgente.montoPendiente)}`;
    }

    const payload = JSON.stringify({ title, body, url: `/prestamos/${masUrgente.prestamoId}` });
    const subsUsuario = subscripciones.filter((s) => s.user_id === userId);
    let alMenosUnEnvioExitoso = false;

    for (const sub of subsUsuario) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        pushEnviados++;
        alMenosUnEnvioExitoso = true;
      } catch (err) {
        const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          suscripcionesEliminadas++;
        } else {
          console.error(`Error enviando push a suscripción ${sub.id}:`, err);
        }
      }
    }

    if (alMenosUnEnvioExitoso) usuariosNotificados++;
  }

  return NextResponse.json({ usuariosNotificados, pushEnviados, suscripcionesEliminadas });
}
