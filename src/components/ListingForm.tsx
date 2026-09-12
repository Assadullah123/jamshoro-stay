import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/ImageUploader";
import { MapPicker } from "@/components/map";
import {
  AMENITIES,
  AREAS,
  CAMPUSES,
  LISTING_TYPES,
  ROOM_TYPES,
  formatPKR,
  listingTypeLabel,
  roomTypeLabel,
} from "@/lib/constants";
import {
  createListing,
  updateListing,
  type Listing,
  type ListingContact,
} from "@/lib/listings";
import { cn } from "@/lib/utils";

type FormState = {
  listing_type: Listing["listing_type"];
  title: string;
  description: string;
  gender: "boys" | "girls";
  monthly_rent: string;
  security_deposit: string;
  room_type: string;
  available_beds: string;
  available_now: boolean;
  available_from: string;
  area: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  nearby_campus: string;
  amenities: string[];
  images: string[];
  contacts: ListingContact[];
};

const STEPS = ["Type", "Basics", "Location", "Amenities", "Contacts", "Photos", "Preview"];

function initialState(listing?: Listing): FormState {
  return {
    listing_type: listing?.listing_type ?? "hostel",
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    gender: listing?.gender ?? "boys",
    monthly_rent: listing ? String(listing.monthly_rent) : "",
    security_deposit: listing?.security_deposit ? String(listing.security_deposit) : "",
    room_type: listing?.room_type ?? "single",
    available_beds: listing ? String(listing.available_beds) : "1",
    available_now: listing?.available_now ?? true,
    available_from: listing?.available_from ?? "",
    area: listing?.area ?? "",
    address: listing?.address ?? "",
    latitude: listing?.latitude ?? null,
    longitude: listing?.longitude ?? null,
    nearby_campus: listing?.nearby_campus ?? "",
    amenities: listing?.amenities ?? [],
    images: listing?.images ?? [],
    contacts:
      listing?.listing_contacts?.length
        ? [...listing.listing_contacts].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        : [{ label: "Owner", phone: "", whatsapp: true }],
  };
}

export function ListingForm({ userId, listing }: { userId: string; listing?: Listing }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialState(listing));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validateStep(): string | null {
    if (step === 1) {
      if (form.title.trim().length < 5) return "Title must be at least 5 characters.";
      const rent = Number(form.monthly_rent);
      if (!Number.isFinite(rent) || rent <= 0) return "Enter a valid monthly rent.";
      if (form.description.trim().length < 15) return "Add a short description (15+ characters).";
    }
    if (step === 2 && !form.area) return "Choose an area.";
    if (step === 4 && !form.contacts.some((c) => c.phone.trim().length >= 10))
      return "Add at least one valid phone number.";
    return null;
  }

  function next() {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        listing_type: form.listing_type,
        title: form.title.trim(),
        description: form.description.trim(),
        gender: form.gender,
        monthly_rent: Number(form.monthly_rent),
        security_deposit: form.security_deposit ? Number(form.security_deposit) : null,
        room_type: form.room_type,
        available_beds: Number(form.available_beds) || 1,
        available_now: form.available_now,
        available_from: form.available_now ? null : form.available_from || null,
        is_available: true,
        area: form.area,
        address: form.address.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        nearby_campus: form.nearby_campus || null,
        amenities: form.amenities,
        images: form.images,
      };
      if (listing) {
        await updateListing(listing.id, { ...payload }, form.contacts);
        toast.success("Listing updated — it will be reviewed again if needed.");
      } else {
        await createListing(userId, payload, form.contacts);
        toast.success("Listing submitted! It is pending review.");
      }
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1",
              i === step
                ? "border-accent bg-accent text-accent-foreground"
                : i < step
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-border text-muted-foreground",
            )}
          >
            {i < step ? <Check className="size-3" /> : null} {label}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="space-y-5 p-5">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("listing_type", t.value as Listing["listing_type"])}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    form.listing_type === t.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.hint}</p>
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Listing title</Label>
                <Input
                  id="title"
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Al-Noor Boys Hostel"
                />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  maxLength={2000}
                  rows={5}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Clean rooms, walking distance from MUET gate, mess included..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rent">Monthly rent (PKR)</Label>
                  <Input
                    id="rent"
                    inputMode="numeric"
                    value={form.monthly_rent}
                    onChange={(e) => set("monthly_rent", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Security deposit (optional)</Label>
                  <Input
                    id="deposit"
                    inputMode="numeric"
                    value={form.security_deposit}
                    onChange={(e) => set("security_deposit", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Target gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => set("gender", v as "boys" | "girls")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boys">Boys</SelectItem>
                      <SelectItem value="girls">Girls</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Room configuration</Label>
                  <Select value={form.room_type} onValueChange={(v) => set("room_type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="beds">Available beds / rooms</Label>
                  <Input
                    id="beds"
                    inputMode="numeric"
                    value={form.available_beds}
                    onChange={(e) => set("available_beds", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="now"
                    checked={form.available_now}
                    onCheckedChange={(v) => set("available_now", v)}
                  />
                  <Label htmlFor="now">Available now</Label>
                </div>
                {!form.available_now ? (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="from">Available from</Label>
                    <Input
                      id="from"
                      type="date"
                      className="w-auto"
                      value={form.available_from}
                      onChange={(e) => set("available_from", e.target.value)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Area</Label>
                  <Select value={form.area} onValueChange={(v) => set("area", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nearby campus</Label>
                  <Select value={form.nearby_campus} onValueChange={(v) => set("nearby_campus", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUSES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Full address / directions</Label>
                <Textarea
                  id="address"
                  rows={3}
                  maxLength={500}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Near Jamshoro Phatak, behind Allied Bank..."
                />
              </div>
              <div>
                <Label>Pin the location on the map (optional)</Label>
                <div className="mt-2 h-72 overflow-hidden rounded-xl border border-border">
                  <MapPicker
                    value={
                      form.latitude != null && form.longitude != null
                        ? { lat: form.latitude, lng: form.longitude }
                        : null
                    }
                    onPick={(lat, lng) => {
                      set("latitude", lat);
                      set("longitude", lng);
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.latitude != null
                    ? `Pinned at ${form.latitude.toFixed(4)}, ${form.longitude?.toFixed(4)}`
                    : "Tap the map to drop a pin."}
                </p>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITIES.map((a) => {
                const Icon = a.icon;
                const checked = form.amenities.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() =>
                      set(
                        "amenities",
                        checked
                          ? form.amenities.filter((k) => k !== a.key)
                          : [...form.amenities, a.key],
                      )
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                      checked ? "border-accent bg-accent/5" : "border-border hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 text-accent" />
                    <span className="truncate">{a.label}</span>
                    {checked ? <Check className="ml-auto size-4 text-accent" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              {form.contacts.map((c, i) => (
                <div key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={c.label}
                      maxLength={40}
                      placeholder="Owner / Manager / Warden"
                      onChange={(e) =>
                        set(
                          "contacts",
                          form.contacts.map((x, j) =>
                            j === i ? { ...x, label: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Phone number</Label>
                    <Input
                      value={c.phone}
                      maxLength={20}
                      inputMode="tel"
                      placeholder="0300-1234567"
                      onChange={(e) =>
                        set(
                          "contacts",
                          form.contacts.map((x, j) =>
                            j === i ? { ...x, phone: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2 pb-2">
                      <Checkbox
                        id={`wa-${i}`}
                        checked={c.whatsapp}
                        onCheckedChange={(v) =>
                          set(
                            "contacts",
                            form.contacts.map((x, j) =>
                              j === i ? { ...x, whatsapp: Boolean(v) } : x,
                            ),
                          )
                        }
                      />
                      <Label htmlFor={`wa-${i}`} className="font-normal">
                        WhatsApp
                      </Label>
                    </div>
                    {form.contacts.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-1"
                        onClick={() =>
                          set(
                            "contacts",
                            form.contacts.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  set("contacts", [...form.contacts, { label: "", phone: "", whatsapp: true }])
                }
              >
                <Plus /> Add Another Number
              </Button>
            </div>
          ) : null}

          {step === 5 ? (
            <ImageUploader
              userId={userId}
              images={form.images}
              onChange={(next) => set("images", next)}
            />
          ) : null}

          {step === 6 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{form.gender === "boys" ? "Boys" : "Girls"}</Badge>
                <Badge variant="secondary">{listingTypeLabel(form.listing_type)}</Badge>
                <Badge variant="outline">{roomTypeLabel(form.room_type)}</Badge>
              </div>
              <h3 className="text-xl font-bold">{form.title || "Untitled listing"}</h3>
              <p className="text-lg font-semibold text-primary">
                {formatPKR(Number(form.monthly_rent))}/month
              </p>
              <p className="text-sm text-muted-foreground">{form.description}</p>
              <p className="text-sm">
                <strong>Location:</strong> {form.area} {form.address ? `— ${form.address}` : ""}
              </p>
              <p className="text-sm">
                <strong>Amenities:</strong>{" "}
                {form.amenities.length
                  ? form.amenities
                      .map((k) => AMENITIES.find((a) => a.key === k)?.label ?? k)
                      .join(", ")
                  : "None selected"}
              </p>
              <div className="text-sm">
                <strong>Contacts:</strong>
                <ul className="mt-1 space-y-1">
                  {form.contacts
                    .filter((c) => c.phone)
                    .map((c, i) => (
                      <li key={i} className="text-muted-foreground">
                        {c.label || "Contact"} — {c.phone} {c.whatsapp ? "(WhatsApp)" : ""}
                      </li>
                    ))}
                </ul>
              </div>
              {form.images.length ? (
                <div className="flex gap-2 overflow-x-auto">
                  {form.images.map((u) => (
                    <img key={u} src={u} alt="" loading="lazy" className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No photos added.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue <ChevronRight />
          </Button>
        ) : (
          <Button type="button" variant="accent" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            {listing ? "Save changes" : "Submit Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}
