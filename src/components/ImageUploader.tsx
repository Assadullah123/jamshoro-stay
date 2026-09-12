import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadListingImage } from "@/lib/listings";
import { cn } from "@/lib/utils";

export function ImageUploader({
  userId,
  images,
  onChange,
}: {
  userId: string;
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        uploaded.push(await uploadListingImage(userId, file));
      }
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} photo(s) uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target] as string, next[index] as string];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-8 text-center transition-colors",
          dragging && "border-accent bg-accent/5",
        )}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-accent" />
        ) : (
          <Upload className="size-6 text-accent" />
        )}
        <p className="text-sm font-medium">Drag photos here or tap to choose</p>
        <p className="text-xs text-muted-foreground">
          Exterior, bedroom, washroom, kitchen, mess, common area. Images are compressed
          automatically.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {images.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, i) => (
            <div key={url} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={url} alt={`Photo ${i + 1}`} loading="lazy" className="h-28 w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="size-3" /> Cover
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-foreground/60 p-1">
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="secondary" className="size-6" onClick={() => move(i, -1)}>
                    <ArrowLeft />
                  </Button>
                  <Button type="button" size="icon" variant="secondary" className="size-6" onClick={() => move(i, 1)}>
                    <ArrowRight />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="size-6"
                  onClick={() => onChange(images.filter((u) => u !== url))}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
