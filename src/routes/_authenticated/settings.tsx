import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Palette, Sun, Moon, User, LogOut } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { analysisStore, useAnalysisHistory } from "@/lib/analysisStore";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — DeepShield" },
      {
        name: "description",
        content: "Manage DeepShield appearance, your account and stored analysis history.",
      },
      { property: "og:title", content: "DeepShield Settings" },
      { property: "og:description", content: "Appearance, account and data controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const THEMES: { id: Theme; label: string; hint: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", hint: "Original DeepShield palette", icon: Sun },
  { id: "dark", label: "Dark", hint: "Black & white monochrome", icon: Moon },
];

function SettingsPage() {
  const history = useAnalysisHistory();
  const { theme, setTheme } = useTheme();
  const { user, displayName, signOut } = useAuth();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard icon={Palette} title="Appearance">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Choose how DeepShield looks. Your selection is remembered on this device.
          </p>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <t.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className="block truncate text-[11px]">{t.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={User} title="Account">
        <div className="flex flex-col gap-4">
          <div className="px-1">
            <div className="flex items-center justify-between gap-4 border-b border-border py-3">
              <span className="text-sm font-medium text-muted-foreground">Name</span>
              <span className="truncate text-sm font-semibold text-foreground">
                {displayName || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <span className="truncate text-sm font-semibold text-foreground">
                {user?.email ?? "—"}
              </span>
            </div>
          </div>
          <button
            onClick={() => void signOut()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={Trash2} title="Data & Privacy">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Analysis history and certificates are stored privately against your account and are
            never visible to other users. Clearing removes every saved prediction ({history.length}{" "}
            stored). Uploaded media itself is never persisted by DeepShield.
          </p>
          <button
            onClick={() => {
              if (confirm("Clear all analysis history from your account?")) analysisStore.clear();
            }}
            disabled={history.length === 0}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Clear analysis history
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
