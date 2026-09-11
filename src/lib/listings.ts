import { supabase } from "@/integrations/supabase/client";

export type ListingStatus = "pending" | "approved" | "rejected";

export type ListingContact = {
  id?: string;
  label: string;
  phone: string;
  whatsapp: boolean;
  sort_order?: number;
};

export type Listing = {
  id: string;
  user_id: string;
  listing_type: "hostel" | "private_room" | "shared_room" | "roommate_wanted";
  title: string;
  description: string;
  gender: "boys" | "girls";
  monthly_rent: number;
  security_deposit: number | null;
  room_type: string;
  available_beds: number;
  available_now: boolean;
  available_from: string | null;
  is_available: boolean;
  area: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  nearby_campus: string | null;
  amenities: string[];
  images: string[];
  status: ListingStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  listing_contacts?: ListingContact[];
};

const SELECT = "*, listing_contacts(id,label,phone,whatsapp,sort_order)";

export type SearchFilters = {
  gender?: "boys" | "girls" | null;
  q?: string;
  campus?: string | null;
  area?: string | null;
  minRent?: number | null;
  maxRent?: number | null;
  roomType?: string | null;
  amenities?: string[];
  availableOnly?: boolean;
  sort?: "newest" | "rent_asc" | "rent_desc" | "distance";
};

export async function fetchPublicListings(filters: SearchFilters = {}): Promise<Listing[]> {
  let query = supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "approved");

  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.area) query = query.eq("area", filters.area);
  if (filters.campus) query = query.eq("nearby_campus", filters.campus);
  if (filters.roomType) query = query.eq("room_type", filters.roomType);
  if (filters.minRent != null) query = query.gte("monthly_rent", filters.minRent);
  if (filters.maxRent != null) query = query.lte("monthly_rent", filters.maxRent);
  if (filters.availableOnly) query = query.eq("is_available", true);
  if (filters.amenities?.length) query = query.contains("amenities", filters.amenities);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, " ").trim();
    if (q) query = query.or(`title.ilike.%${q}%,area.ilike.%${q}%,address.ilike.%${q}%`);
  }

  if (filters.sort === "rent_asc") query = query.order("monthly_rent", { ascending: true });
  else if (filters.sort === "rent_desc") query = query.order("monthly_rent", { ascending: false });
  else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from("listings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Listing) ?? null;
}

export async function fetchMyListings(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export type ListingInput = Omit<
  Listing,
  "id" | "user_id" | "created_at" | "updated_at" | "status" | "is_featured" | "listing_contacts"
>;

export async function createListing(
  userId: string,
  input: ListingInput,
  contacts: ListingContact[],
) {
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...input, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  await saveContacts(data.id, contacts);
  return data.id as string;
}

export async function updateListing(
  id: string,
  input: Partial<ListingInput>,
  contacts?: ListingContact[],
) {
  const { error } = await supabase.from("listings").update(input).eq("id", id);
  if (error) throw error;
  if (contacts) {
    await supabase.from("listing_contacts").delete().eq("listing_id", id);
    await saveContacts(id, contacts);
  }
}

async function saveContacts(listingId: string, contacts: ListingContact[]) {
  const rows = contacts
    .filter((c) => c.phone.trim().length > 0)
    .map((c, i) => ({
      listing_id: listingId,
      label: c.label.trim() || "Contact",
      phone: c.phone.trim(),
      whatsapp: c.whatsapp,
      sort_order: i,
    }));
  if (!rows.length) return;
  const { error } = await supabase.from("listing_contacts").insert(rows);
  if (error) throw error;
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

export async function reportListing(listingId: string, reason: string, note: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("listing_reports").insert({
    listing_id: listingId,
    reporter_id: userData.user?.id ?? null,
    reason,
    note: note || null,
  });
  if (error) throw error;
}

/** Compress an image in the browser before upload. */
export async function compressImage(file: File, maxSize = 1400, quality = 0.78): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  return blob ?? file;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadListingImage(userId: string, file: File): Promise<string> {
  const blob = await compressImage(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("listing-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signError) throw signError;
  return data.signedUrl;
}
