import { CloudUpload, FileImage, FileVideo, Loader2, FolderOpen } from "lucide-react";
import { useRef, useState } from "react";
import {
  validateMedia,
  detectMediaKind,
  fileSignature,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  MAX_VIDEO_SIZE_MB,
} from "@/lib/validation";

interface Props {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

// Combined accept attribute — kept in sync with the reusable validators.
const ACCEPT = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
].join(",");

export function UploadCard({ onAnalyze, isAnalyzing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (f: File | undefined | null) => {
    if (!f) return;
    if (isAnalyzing) {
      setError("A file is already being processed. Please wait.");
      return;
    }

    const result = validateMedia(f);
    if (!result.isValid) {
      setError(result.error ?? "Invalid file.");
      setFile(null);
      return;
    }

    const signature = fileSignature(f);
    if (signature === lastProcessed) {
      setError("This exact file has already been processed. Choose a different file.");
      return;
    }

    setError(null);
    setFile(f);
    setLastProcessed(signature);
    onAnalyze(f);
  };

  const kind = file ? detectMediaKind(file) : "unknown";
  const Icon = kind === "video" ? FileVideo : FileImage;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 -mt-2">
        Upload an image or video file for deepfake analysis
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !isAnalyzing && inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed py-10 px-6 text-center transition-colors ${
          drag
            ? "border-primary bg-accent/60"
            : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-accent/30"
        }`}
      >
        <div className="mx-auto h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-3 shadow-sm">
          {isAnalyzing ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <CloudUpload className="h-7 w-7 text-primary" />
          )}
        </div>
        <p className="text-sm font-semibold text-foreground">Drag &amp; Drop your file here</p>
        <p className="text-xs text-muted-foreground my-2">or</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all disabled:opacity-60"
        >
          <FolderOpen className="h-4 w-4" /> Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            // Allow re-selecting the same file after clearing the guard.
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Supported Formats: JPG, JPEG, PNG, MP4, AVI, MOV</span>
        <span>Max File Size: {MAX_VIDEO_SIZE_MB}MB</span>
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-xs text-foreground">{file.name}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
