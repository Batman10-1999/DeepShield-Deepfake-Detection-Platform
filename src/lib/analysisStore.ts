// User-scoped store for DeepShield analysis results.
//
// Source of truth for an authenticated user is the `analyses` table in the DeepShield
// backend database (RLS-isolated per user). localStorage is used only as a per-user cache
// so previews and the pinned dashboard analysis survive a refresh instantly
// and remain available while the network round-trip is in flight.

import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PredictionResult } from "./api";
import {
  coerceVerificationStatus,
  determineVerificationStatus,
  generateCertificateId,
  type VerificationStatus,
} from "./verification";

export interface AnalysisEntry {
  id: string; // internal row id
  certificateId: string; // public DS-YYYYMMDD-HHMMSS-XXXX id
  verificationStatus: VerificationStatus;
  fileName: string;
  fileType: string | null;
  prediction: string;
  modelConfidence: number;
  authenticityScore: number;
  analyzedAt: string; // ISO
  previewDataUrl: string | null;
  result: PredictionResult;
}

const MAX_ENTRIES = 50;

type Listener = () => void;
const listeners = new Set<Listener>();

let userId: string | null = null;
let cache: AnalysisEntry[] = [];
let currentId: string | null = null;

function historyKey() {
  return `deepshield.history.v1:${userId ?? "anon"}`;
}
function currentKey() {
  return `deepshield.current.v1:${userId ?? "anon"}`;
}

function notify() {
  listeners.forEach((l) => l());
}

function normalizeEntry(e: Partial<AnalysisEntry>): AnalysisEntry {
  const when = e.analyzedAt ? new Date(e.analyzedAt) : new Date();
  const certificateId = e.certificateId ?? generateCertificateId(when);
  const prediction = String(e.prediction ?? e.result?.prediction ?? "FAKE").toUpperCase();
  const binaryPrediction = prediction === "REAL" ? "REAL" : "FAKE";
  return {
    ...e,
    certificateId,
    prediction: binaryPrediction,
    verificationStatus: coerceVerificationStatus(e.verificationStatus, binaryPrediction),
  } as AnalysisEntry;
}

function readLocal(): AnalysisEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(historyKey());
    const parsed = raw ? (JSON.parse(raw) as Partial<AnalysisEntry>[]) : [];
    return parsed.map(normalizeEntry);
  } catch {
    return [];
  }
}

/**
 * Writes history to localStorage. Preview images are data URLs, so a long
 * history can exceed the storage quota; on failure we progressively drop
 * previews from the oldest entries rather than losing the history itself.
 */
function writeLocal(next: AnalysisEntry[]) {
  if (typeof window === "undefined") return;
  const attempts: AnalysisEntry[][] = [
    next,
    next.map((e, i) => (i === 0 ? e : { ...e, previewDataUrl: null })),
    next.slice(0, 10).map((e, i) => (i === 0 ? e : { ...e, previewDataUrl: null })),
  ];
  for (const candidate of attempts) {
    try {
      window.localStorage.setItem(historyKey(), JSON.stringify(candidate));
      return;
    } catch {
      /* quota — try a lighter payload */
    }
  }
}

function persist(next: AnalysisEntry[]) {
  cache = next;
  writeLocal(next);
  notify();
}

function writeCurrentId(id: string | null) {
  currentId = id;
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(currentKey(), id);
    else window.localStorage.removeItem(currentKey());
  } catch {
    /* storage unavailable — in-memory only */
  }
}

function readCurrentId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(currentKey());
  } catch {
    return null;
  }
}

/** Merges rows from the database with locally cached previews. */
async function syncFromCloud() {
  if (!userId) return;
  const scoped = userId;
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, certificate_id, file_name, file_type, prediction, verification_status, model_confidence, authenticity_score, analyzed_at, result",
    )
    .order("analyzed_at", { ascending: false })
    .limit(MAX_ENTRIES);
  if (error || !data || scoped !== userId) return;

  const previews = new Map(cache.map((e) => [e.certificateId, e.previewDataUrl]));
  const merged = data.map((row) =>
    normalizeEntry({
      id: row.id,
      certificateId: row.certificate_id,
      verificationStatus: row.verification_status as VerificationStatus,
      fileName: row.file_name,
      fileType: row.file_type,
      prediction: row.prediction,
      modelConfidence: Number(row.model_confidence),
      authenticityScore: Number(row.authenticity_score),
      analyzedAt: new Date(row.analyzed_at).toISOString(),
      previewDataUrl: previews.get(row.certificate_id) ?? null,
      result: row.result as unknown as PredictionResult,
    }),
  );
  persist(merged);
}

async function pushToCloud(entry: AnalysisEntry) {
  if (!userId) return;
  const { error } = await supabase.from("analyses").insert({
    id: entry.id,
    user_id: userId,
    certificate_id: entry.certificateId,
    file_name: entry.fileName,
    file_type: entry.fileType,
    prediction: entry.prediction,
    verification_status: entry.verificationStatus,
    model_confidence: entry.modelConfidence,
    authenticity_score: entry.authenticityScore,
    analyzed_at: entry.analyzedAt,
    result: entry.result as unknown as never,
  });
  if (error) console.error("Failed to save analysis to the backend:", error.message);
}

/**
 * Builds a canonical AnalysisEntry from a raw PredictionResult. Centralised
 * so every call site (dashboard, upload page, future batch runner) produces
 * identical history + certificate metadata. The backend certificate ID is
 * preferred so the API, the UI and the PDF always agree.
 */
export function buildAnalysisEntry(input: {
  result: PredictionResult;
  fileName: string;
  fileType: string | null;
  previewDataUrl: string | null;
  analyzedAt?: Date;
}): AnalysisEntry {
  const when =
    input.analyzedAt ?? (input.result.timestamp ? new Date(input.result.timestamp) : new Date());
  const badge = determineVerificationStatus(input.result);
  const certificateId = input.result.certificateId ?? generateCertificateId(when);
  return {
    id: crypto.randomUUID(),
    certificateId,
    verificationStatus: badge.status,
    fileName: input.fileName,
    fileType: input.fileType,
    prediction: String(input.result.prediction).toUpperCase(),
    modelConfidence: input.result.modelConfidence,
    authenticityScore: input.result.authenticityScore,
    analyzedAt: when.toISOString(),
    previewDataUrl: input.previewDataUrl,
    result: input.result,
  };
}

export const analysisStore = {
  /** Rebinds the store to the signed-in user; clears everything on sign-out. */
  setUser(id: string | null) {
    if (id === userId) return;
    userId = id;
    if (!id) {
      cache = [];
      currentId = null;
      notify();
      return;
    }
    cache = readLocal();
    currentId = readCurrentId();
    notify();
    void syncFromCloud();
  },
  all(): AnalysisEntry[] {
    return cache;
  },
  latest(): AnalysisEntry | null {
    return cache[0] ?? null;
  },
  byCertificateId(id: string): AnalysisEntry | null {
    return cache.find((e) => e.certificateId === id) ?? null;
  },
  /** The analysis currently pinned to the dashboard, if it still exists. */
  current(): AnalysisEntry | null {
    if (!currentId) return null;
    return cache.find((e) => e.id === currentId) ?? null;
  },
  /** Adds an entry to history and pins it as the current dashboard analysis. */
  add(entry: AnalysisEntry) {
    writeCurrentId(entry.id);
    persist([entry, ...cache].slice(0, MAX_ENTRIES));
    void pushToCloud(entry);
  },
  /** Pins an existing history entry to the dashboard. */
  setCurrent(id: string | null) {
    writeCurrentId(id);
    notify();
  },
  /** Clears only the dashboard analysis — history is untouched. */
  clearCurrent() {
    writeCurrentId(null);
    notify();
  },
  /** Clears history (explicit user action) and the current pin with it. */
  clear() {
    writeCurrentId(null);
    persist([]);
    if (userId) {
      void supabase
        .from("analyses")
        .delete()
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) console.error("Failed to clear cloud history:", error.message);
        });
    }
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

const EMPTY: AnalysisEntry[] = [];

export function useAnalysisHistory(): AnalysisEntry[] {
  return useSyncExternalStore(
    analysisStore.subscribe,
    () => cache,
    () => EMPTY,
  );
}

export function useLatestAnalysis(): AnalysisEntry | null {
  const all = useAnalysisHistory();
  return all[0] ?? null;
}

/** Dashboard-scoped analysis: survives navigation and page refresh. */
export function useCurrentAnalysis(): AnalysisEntry | null {
  return useSyncExternalStore(
    analysisStore.subscribe,
    () => analysisStore.current(),
    () => null,
  );
}
