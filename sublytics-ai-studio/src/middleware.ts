import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/auth/callback"];
const PUBLIC_API = ["/api/auth/forgot-password"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isPublicApi = PUBLIC_API.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute && !isPublicApi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabaseAdmin
      .from("staff_users")
      .select("role, is_active, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (profile.must_change_password && pathname !== "/reset-password" && pathname !== "/auth/callback") {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }

    if (pathname.startsWith("/staff") && !["ADMIN", "MANAGER"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if ((pathname === "/login" || pathname === "/forgot-password") && !profile.must_change_password) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
