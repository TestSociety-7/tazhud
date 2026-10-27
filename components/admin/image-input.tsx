"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";

/** Resizes an image in the browser so phone photos upload quickly. */
async function resize(file: File, maxSize: number) {
  if (!file.type.startsWith("image/")) throw new Error("يرجى اختيار ملف صورة.");
  if (file.size > 25 * 1024 * 1024) throw new Error("يجب أن يكون حجم الصورة أقل من 25 ميغابايت.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("تعذّرت قراءة هذه الصورة."));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("هذا المتصفح لا يدعم معالجة الصور.");
    ctx.fillStyle = "#f7f2e9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Turns a chosen photo into an image URL.
 * - Shared storage: uploads a resized JPEG to Vercel Blob and returns its public URL.
 * - Local demo mode: returns a small JPEG data URL kept in this browser.
 */
export async function prepareImage(file: File, shared: boolean): Promise<string> {
  if (!shared) return (await resize(file, 1200)).toDataURL("image/jpeg", 0.82);
  const canvas = await resize(file, 1800);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("تعذّر تجهيز الصورة."))), "image/jpeg", 0.86),
  );
  const name = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const result = await upload(name, blob, { access: "public", handleUploadUrl: "/api/admin/upload", contentType: "image/jpeg" });
  return result.url;
}

const isLikelyUrl = (v: string) => /^(https?:\/\/|\/)[^\s]+$/i.test(v.trim());

function UrlAdder({ onAdd, label = "إضافة صورة برابط" }: { onAdd: (url: string) => void; label?: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const add = () => {
    if (!isLikelyUrl(value)) {
      setError("أدخل رابط صورة كاملًا يبدأ بـ https:// أو مسارًا يبدأ بـ /");
      return;
    }
    onAdd(value.trim());
    setValue("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="field ltr !ps-9"
            type="url"
            placeholder="https://…"
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
                add();
              }
            }}
          />
        </div>
        <button type="button" className="btn btn-outline border-line" onClick={add}>
          إضافة
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function useUploader(onAdd: (urls: string[]) => void) {
  const { isLocalOnly } = useStore();
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  async function handle(files: File[]) {
    if (!files.length) return;
    setBusy({ done: 0, total: files.length });
    const out: string[] = [];
    for (const [i, f] of files.entries()) {
      try {
        out.push(await prepareImage(f, !isLocalOnly));
      } catch (err) {
        toast.error("تعذّر رفع صورة", { description: err instanceof Error ? err.message : undefined });
      }
      setBusy({ done: i + 1, total: files.length });
    }
    setBusy(null);
    if (out.length) {
      onAdd(out);
      toast.success(out.length === 1 ? "تمت إضافة الصورة" : `تمت إضافة ${out.length} صور`);
    }
  }
  return { busy, handle };
}

function FileInput({ inputRef, multiple, capture, onFiles, label }: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  multiple: boolean;
  capture?: boolean;
  onFiles: (files: File[]) => void;
  label: string;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple={multiple}
      capture={capture ? "environment" : undefined}
      className="sr-only"
      tabIndex={-1}
      aria-label={label}
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        onFiles(files);
      }}
    />
  );
}

function UploadButtons({ onAdd, multiple = true }: { onAdd: (urls: string[]) => void; multiple?: boolean }) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const { busy, handle } = useUploader(onAdd);
  return (
    <div className="flex gap-2">
      <FileInput inputRef={gallery} multiple={multiple} onFiles={handle} label="رفع صور من الجهاز" />
      <FileInput inputRef={camera} multiple={false} capture onFiles={handle} label="التقاط صورة بالكاميرا" />
      <button type="button" className="btn btn-primary flex-1" onClick={() => gallery.current?.click()} disabled={!!busy}>
        <Upload className="size-4" /> {busy ? `جارٍ الرفع ${busy.done}/${busy.total}…` : multiple ? "رفع صور" : "رفع صورة"}
      </button>
      <button type="button" className="btn btn-outline border-line sm:hidden" onClick={() => camera.current?.click()} disabled={!!busy} aria-label="التقاط صورة بالكاميرا">
        <Camera className="size-4" />
      </button>
    </div>
  );
}

export function ImageListEditor({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const { isLocalOnly } = useStore();
  const empty = useRef<HTMLInputElement>(null);
  const { busy, handle } = useUploader((urls) => onChange([...images, ...urls]));
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
        <>
          <FileInput inputRef={empty} multiple onFiles={handle} label="رفع صور المنتج" />
          <button
            type="button"
            onClick={() => empty.current?.click()}
            disabled={!!busy}
            className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-gold/50 bg-sand/40 px-4 py-10 text-center text-sm text-muted transition-colors hover:border-gold hover:bg-sand/70"
          >
            <ImagePlus className="mb-2 size-8 text-gold-deep" />
            <span className="font-semibold text-ink">{busy ? `جارٍ الرفع ${busy.done}/${busy.total}…` : "اضغط لاختيار صور المنتج"}</span>
            <span className="mt-1 block text-xs">يمكنك اختيار عدة صور مرة واحدة. الصورة الأولى تظهر في بطاقة المنتج.</span>
          </button>
        </>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(0, 40)}`} className="group relative overflow-hidden rounded-xl border border-line bg-paper">
              <SmartImage src={src} alt={`الصورة ${i + 1}`} className="aspect-[4/5]" />
              {i === 0 && <span className="absolute top-2 start-2 rounded-full bg-ink px-2 py-0.5 text-[0.7rem] font-bold text-gold-soft">الغلاف</span>}
              <div className="flex items-center justify-between gap-1 border-t border-line p-1">
                <button type="button" className="icon-btn size-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`تقديم الصورة ${i + 1}`}>
                  <ArrowRight className="size-4" />
                </button>
                <button type="button" className="icon-btn size-10 text-danger" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label={`حذف الصورة ${i + 1}`}>
                  <Trash2 className="size-4" />
                </button>
                <button type="button" className="icon-btn size-10" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`تأخير الصورة ${i + 1}`}>
                  <ArrowLeft className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <UploadButtons onAdd={(urls) => onChange([...images, ...urls])} />
      <details className="text-sm">
        <summary className="cursor-pointer py-1 text-xs font-semibold text-forest">أو أضف صورة برابط</summary>
        <div className="mt-2">
          <UrlAdder onAdd={(u) => onChange([...images, u])} />
        </div>
      </details>
      <p className="hint">
        الأفضل صور طولية بنسبة 4:5. تُصغَّر الصور تلقائيًا قبل الرفع.
        {isLocalOnly && " في الوضع التجريبي تُحفظ الصور في هذا المتصفح فقط."}
      </p>
    </div>
  );
}

export function SingleImageInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex gap-4">
      <SmartImage src={value} alt="" className="aspect-[4/5] w-24 shrink-0 rounded-xl border border-line" />
      <div className="min-w-0 flex-1 space-y-2">
        <UploadButtons multiple={false} onAdd={(urls) => onChange(urls[0])} />
        <input className="field ltr" value={value.startsWith("data:") ? "" : value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder={value.startsWith("data:") ? "صورة مرفوعة" : "https://…"} />
      </div>
    </div>
  );
}
