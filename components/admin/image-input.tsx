"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * Resizes an uploaded image in the browser and returns a compact JPEG data URL.
 * In local demo mode images are stored inside the browser, so keeping them
 * small matters. With a real backend, swap this for an upload to Blob/S3.
 */
export async function compressImage(file: File, maxSize = 1200, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Images must be under 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That image couldn't be read."));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing isn't supported in this browser.");
    ctx.fillStyle = "#f7f2e9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const isLikelyUrl = (v: string) => /^(https?:\/\/|\/)[^\s]+$/i.test(v.trim());

function UrlAdder({ onAdd, label = "Add by URL" }: { onAdd: (url: string) => void; label?: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="field !pl-9"
            placeholder="https://… or /art/…"
            value={value}
            aria-label={label}
            aria-invalid={!!error}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.currentTarget.parentElement?.nextElementSibling as HTMLButtonElement | null)?.click();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline border-line"
          onClick={() => {
            if (!isLikelyUrl(value)) {
              setError("Enter a full image URL starting with https:// or a path starting with /");
              return;
            }
            onAdd(value.trim());
            setValue("");
          }}
        >
          Add
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function UploadButton({ onAdd, multiple = true }: { onAdd: (urls: string[]) => void; multiple?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload images"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          const out: string[] = [];
          for (const f of files) {
            try {
              out.push(await compressImage(f));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Upload failed");
            }
          }
          setBusy(false);
          if (out.length) onAdd(out);
        }}
      />
      <button type="button" className="btn btn-outline border-line" onClick={() => ref.current?.click()} disabled={busy}>
        <Upload className="size-4" /> {busy ? "Processing…" : "Upload"}
      </button>
    </>
  );
}

export function ImageListEditor({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-sand/40 px-4 py-10 text-center text-sm text-muted">
          <ImagePlus className="mb-2 size-6" />
          No images yet. The first image is used on product cards.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(0, 40)}`} className="group relative overflow-hidden rounded-xl border border-line bg-paper">
              <SmartImage src={src} alt={`Image ${i + 1}`} className="aspect-[4/5]" />
              {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-ink px-2 py-0.5 text-[0.65rem] font-bold text-gold-soft">Cover</span>}
              <div className="flex items-center justify-between gap-1 border-t border-line p-1">
                <button type="button" className="icon-btn size-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>
                  <ArrowLeft className="size-4" />
                </button>
                <button type="button" className="icon-btn size-9 text-danger" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`}>
                  <Trash2 className="size-4" />
                </button>
                <button type="button" className="icon-btn size-9" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Move image ${i + 1} later`}>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <UrlAdder onAdd={(u) => onChange([...images, u])} />
        </div>
        <UploadButton onAdd={(urls) => onChange([...images, ...urls])} />
      </div>
      <p className="hint">Use portrait images (4:5) for the best fit. Uploads are resized to 1200px and stored in this browser in demo mode.</p>
    </div>
  );
}

export function SingleImageInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex gap-4">
      <SmartImage src={value} alt="" className="aspect-[4/5] w-24 shrink-0 rounded-xl border border-line" />
      <div className="flex-1 space-y-2">
        <input className="field" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder="https://… or /art/…" />
        <UploadButton multiple={false} onAdd={(urls) => onChange(urls[0])} />
      </div>
    </div>
  );
}
