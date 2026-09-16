import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ShieldCheck, Upload as UploadIcon, ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { CertificateCard } from "@/components/CertificateCard";
import { analysisStore, useAnalysisHistory, useLatestAnalysis } from "@/lib/analysisStore";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/_authenticated/certificate")({
  validateSearch: search,
  component: CertificatePage,
  head: () => ({
    meta: [
      { title: "Verification Certificate — DeepShield" },
      {
        name: "description",
        content: "Download the DeepShield verification certificate for any analysis.",
      },
      { property: "og:title", content: "DeepShield Verification Certificate" },
      {
        property: "og:description",
        content:
          "Tamper-evident PDF certificate with SHA-256 hash, verdict and confidence for each analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CertificatePage() {
  const { id } = Route.useSearch();
  // Subscribe so navigation after a fresh analysis refreshes the view.
  useAnalysisHistory();
  const latest = useLatestAnalysis();
  const entry = id ? analysisStore.byCertificateId(id) : latest;

  if (!entry) {
    return (
      <SectionCard icon={ShieldCheck} title="Verification Certificate">
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">
              {id ? "Certificate not found" : "No analysis yet"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              {id
                ? "This certificate ID is not in your local history."
                : "Run a deepfake analysis to generate your first verification certificate."}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UploadIcon className="h-4 w-4" /> Analyze on Dashboard
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={ShieldCheck}
      title="Verification Certificate"
      badge={
        id ? (
          <Link
            to="/history"
            className="inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground hover:text-primary px-2.5 py-1 text-[11px] font-semibold transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> History
          </Link>
        ) : undefined
      }
    >
      <CertificateCard entry={entry} full />
    </SectionCard>
  );
}
