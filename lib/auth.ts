import { supabase } from "./db";

export async function signUpUser(email: string, password: string, rol: string = "usuario") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          rol,
        },
      ]);

    if (insertError) throw insertError;

    if (rol === "usuario") {
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert([
          {
            user_id: data.user.id,
            estado: "activo",
            monto_mensual: 150000,
          },
        ]);
      if (subError) throw subError;
    }
  }

  return data;
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.rol ?? "usuario";
}

export async function suspendUser(userId: string, razon: string) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      estado: "suspendido",
      razon_suspension: razon,
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function reactivateUser(userId: string) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      estado: "activo",
      razon_suspension: null,
    })
    .eq("user_id", userId);

  if (error) throw error;
}
