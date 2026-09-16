import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { IntroExperience, useIntro } from "@/components/IntroExperience";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

/**
 * Real session gate. The Supabase session lives in the browser, so the check
 * runs after hydration: unauthenticated visitors are sent to /auth and the
 * page they wanted is preserved so they land back on it after signing in.
 */
function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const intro = useIntro();
  const navigate = useNavigate();
  const initialHref = useRouterState({ select: (s) => s.location.href });
  const intended = useRef(initialHref);
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || user || redirected.current) return;
    redirected.current = true;
    const target = intended.current.startsWith("/auth") ? "/" : intended.current;
    void navigate({ to: "/auth", search: { redirect: target }, replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {intro.show && <IntroExperience onDone={intro.dismiss} />}
      <Sidebar />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 md:px-8 md:py-7">
        <Header />
        <Outlet />
      </main>
    </div>
  );
}
