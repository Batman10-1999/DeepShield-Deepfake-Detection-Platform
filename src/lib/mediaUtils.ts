// Shared media utilities used by the dashboard analysis flow.

export function humanType(f: File): string {
  if (f.type === "image/jpeg") return "Image (JPG)";
  if (f.type === "image/png") return "Image (PNG)";
  if (f.type.startsWith("video/"))
    return `Video (${(f.name.split(".").pop() ?? "MP4").toUpperCase()})`;
  return f.type || "Unknown";
}

export async function buildPreview(file: File, kind: "image" | "video"): Promise<string | null> {
  try {
    if (kind === "image") return await imagePreview(file);
    if (kind === "video") return await videoPreview(file);
    return null;
  } catch {
    return null;
  }
}

function imagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxW = 1280;
      const ratio = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(img.width * ratio);
      canvas.height = Math.floor(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not supported"));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function videoPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const maxW = 1280;
      const vw = video.videoWidth || 320;
      const vh = video.videoHeight || 180;
      const ratio = Math.min(1, maxW / vw);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vw * ratio);
      canvas.height = Math.floor(vh * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not supported"));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video"));
    };
  });
}
