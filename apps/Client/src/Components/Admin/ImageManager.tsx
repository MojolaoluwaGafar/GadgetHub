import { useRef, useState, type DragEvent } from "react";
import { CloudUpload, LoaderCircle, Star, X } from "lucide-react";
import type { ProductImage } from "../../types";
import { adminService } from "../../API/services/adminService";
import { apiErrorMessage } from "../../utils/apiError";
import { cx } from "../../utils/format";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES = 6;

// Product photos: drop or pick several at once. Each uploads through the API
// (which stores it in Cloudinary) as soon as it's chosen; the first photo is
// the cover shown on cards.
export default function ImageManager({
  images,
  onChange,
  error,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Uploads finish one by one; keep the latest list to append to.
  const latest = useRef(images);
  latest.current = images;

  const upload = async (files: File[]) => {
    setLocalError(null);
    const room = MAX_IMAGES - latest.current.length - uploading;
    if (room <= 0) return setLocalError(`A product can have up to ${MAX_IMAGES} photos.`);
    const picked = files.slice(0, room);
    const bad = picked.find((file) => !ALLOWED.includes(file.type) || file.size > MAX_BYTES);
    if (bad) return setLocalError(`${bad.name}: use a JPG, PNG or WebP photo up to 5 MB.`);

    setUploading((n) => n + picked.length);
    for (const file of picked) {
      try {
        const uploaded = await adminService.uploadImage(file);
        onChange([...latest.current, uploaded]);
      } catch (err) {
        setLocalError(apiErrorMessage(err, `${file.name} didn't upload. Try again.`));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void upload([...event.dataTransfer.files]);
  };

  const makeCover = (index: number) => onChange([images[index]!, ...images.filter((_, i) => i !== index)]);
  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));
  const shownError = localError ?? error;

  return (
    <div>
      {images.length + uploading > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <li key={image.url} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-panel">
              <img src={image.url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold opacity-100 shadow sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Star className="h-3 w-3" /> Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-danger shadow"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li key={`uploading-${i}`} className="flex aspect-square items-center justify-center rounded-md border border-dashed border-brand bg-brand-soft">
              <LoaderCircle className="h-6 w-6 text-brand motion-safe:animate-spin" aria-label="Uploading" />
            </li>
          ))}
        </ul>
      )}

      {images.length + uploading < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            "flex w-full flex-col items-center justify-center gap-2 rounded-md border p-6 text-center transition",
            dragging ? "border-brand bg-brand-soft" : shownError ? "border-danger bg-danger-soft/40" : "border-[#e6eff5] hover:bg-brand-soft",
          )}
          aria-describedby={shownError ? "images-error" : undefined}
        >
          <CloudUpload className="h-8 w-8 text-ink-soft" />
          <span className="text-sm text-[#494747]">Drag & drop product image here or click to upload (JPG/PNG, max 5mb)</span>
          <span className="text-xs text-muted">
            {images.length} of {MAX_IMAGES} photos. The first one is the cover.
          </span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          void upload([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      {shownError && (
        <p id="images-error" className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}
