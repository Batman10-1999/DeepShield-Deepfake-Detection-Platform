// Loads the DeepShield logo as a data URL so it can be embedded into
// generated PDFs (jsPDF cannot read a bundler URL directly).

import logoUrl from "@/assets/deepshield-logo.png";

let cached: string | null | undefined;
let inflight: Promise<string | null> | null = null;

export async function loadLogoDataUrl(): Promise<string | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(logoUrl);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      cached = dataUrl;
    } catch {
      cached = null;
    } finally {
      inflight = null;
    }
    return cached ?? null;
  })();
  return inflight;
}

export { logoUrl };
