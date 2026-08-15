"use client";

import { supabase } from "./db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes;
}

/** Feature detection: navegador/SO sin soporte para push no debe romper nada. */
export function notificacionesSoportadas(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function permisoNotificaciones(): NotificationPermission | null {
  if (!notificacionesSoportadas()) return null;
  return Notification.permission;
}

export async function solicitarPermisoNotificaciones(): Promise<NotificationPermission | null> {
  if (!notificacionesSoportadas()) return null;
  try {
    return await Notification.requestPermission();
  } catch {
    return null;
  }
}

/** Registra la suscripción push del navegador y la guarda en push_subscriptions. */
export async function suscribirsePush(userId: string): Promise<boolean> {
  if (!notificacionesSoportadas() || !VAPID_PUBLIC_KEY) return false;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    // Sin permiso de UPDATE por RLS: se reemplaza la fila con delete + insert.
    await supabase.from("push_subscriptions").delete().eq("endpoint", json.endpoint);

    const { error } = await supabase.from("push_subscriptions").insert([
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    ]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error al suscribirse a notificaciones push:", err);
    return false;
  }
}
