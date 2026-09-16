// Reusable, UI-independent validation utilities for the DeepShield frontend.
// Mirrors backend/app/utils/validators.py so client- and server-side rules stay
// aligned. Returns structured results — callers decide how to render them.

export type MediaKind = "image" | "video" | "unknown";

export interface ValidationResult {
  isValid: boolean;
  mediaKind: MediaKind;
  filename: string;
  sizeBytes: number;
  extension: string;
  mimeType: string;
  error?: string;
}

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;

export const VIDEO_EXTENSIONS = [".mp4", ".avi", ".mov"] as const;
export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/avi",
] as const;

export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 200;

const extOf = (name: string): string => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
};

const base = (file: File): Omit<ValidationResult, "isValid" | "mediaKind" | "error"> => ({
  filename: file.name,
  sizeBytes: file.size,
  extension: extOf(file.name),
  mimeType: file.type,
});

/** Detect what kind of media a file *claims* to be, purely from ext + MIME. */
export function detectMediaKind(file: File): MediaKind {
  const ext = extOf(file.name);
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return "image";
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext)) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "unknown";
}

export function validateImage(file: File): ValidationResult {
  const b = base(file);
  if (file.size === 0)
    return { ...b, mediaKind: "image", isValid: false, error: "Uploaded file is empty." };
  if (!(IMAGE_EXTENSIONS as readonly string[]).includes(b.extension))
    return {
      ...b,
      mediaKind: "image",
      isValid: false,
      error: `Unsupported image extension "${b.extension || "none"}". Allowed: JPG, JPEG, PNG.`,
    };
  if (file.type && !(IMAGE_MIME_TYPES as readonly string[]).includes(file.type))
    return {
      ...b,
      mediaKind: "image",
      isValid: false,
      error: `Unsupported MIME type "${file.type}".`,
    };
  if (file.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB)
    return {
      ...b,
      mediaKind: "image",
      isValid: false,
      error: `Image exceeds ${MAX_IMAGE_SIZE_MB} MB limit.`,
    };
  return { ...b, mediaKind: "image", isValid: true };
}

export function validateVideo(file: File): ValidationResult {
  const b = base(file);
  if (file.size === 0)
    return { ...b, mediaKind: "video", isValid: false, error: "Uploaded file is empty." };
  if (!(VIDEO_EXTENSIONS as readonly string[]).includes(b.extension))
    return {
      ...b,
      mediaKind: "video",
      isValid: false,
      error: `Unsupported video extension "${b.extension || "none"}". Allowed: MP4, AVI, MOV.`,
    };
  if (file.type && !(VIDEO_MIME_TYPES as readonly string[]).includes(file.type))
    return {
      ...b,
      mediaKind: "video",
      isValid: false,
      error: `Unsupported MIME type "${file.type}".`,
    };
  if (file.size / (1024 * 1024) > MAX_VIDEO_SIZE_MB)
    return {
      ...b,
      mediaKind: "video",
      isValid: false,
      error: `Video exceeds ${MAX_VIDEO_SIZE_MB} MB limit.`,
    };
  return { ...b, mediaKind: "video", isValid: true };
}

/** Main entry point — routes to the correct validator based on detected kind. */
export function validateMedia(file: File): ValidationResult {
  if (!file || !file.name) {
    return {
      isValid: false,
      mediaKind: "unknown",
      filename: "",
      sizeBytes: 0,
      extension: "",
      mimeType: "",
      error: "No file provided.",
    };
  }
  const kind = detectMediaKind(file);
  if (kind === "image") return validateImage(file);
  if (kind === "video") return validateVideo(file);
  return {
    ...base(file),
    mediaKind: "unknown",
    isValid: false,
    error: "Unsupported file. Upload JPG, PNG, MP4, AVI, or MOV.",
  };
}

/** Stable signature used to guard against duplicate processing requests. */
export function fileSignature(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}
