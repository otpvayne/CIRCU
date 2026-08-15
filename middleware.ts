import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/cuenta-suspendida"];

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (pathname.startsWith("/admin")) {
    const { data: userRow } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow?.rol !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("estado")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.estado === "suspendido") {
    return NextResponse.redirect(new URL("/cuenta-suspendida", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|api/cron).*)",
  ],
};
