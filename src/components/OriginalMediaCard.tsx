import { ImageOff } from "lucide-react";

interface Props {
  previewDataUrl: string | null;
}

export function OriginalMediaCard({ previewDataUrl }: Props) {
  return (
    <div className="flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
      {previewDataUrl ? (
        <img
          src={previewDataUrl}
          alt="Original media preview"
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center px-6 text-center">
          <ImageOff className="mb-3 h-7 w-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground/70">No media uploaded yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your uploaded file preview will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
