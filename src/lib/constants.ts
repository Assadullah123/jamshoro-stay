import {
  AirVent,
  Wifi,
  UtensilsCrossed,
  Zap,
  BatteryCharging,
  Shirt,
  ShieldCheck,
  Cctv,
  Bath,
  ShowerHead,
  Car,
  Droplets,
  Plug,
  Flame,
  BookOpen,
  CookingPot,
  type LucideIcon,
} from "lucide-react";

export type Campus = {
  id: string;
  name: string;
  short: string;
  lat: number;
  lng: number;
};

/** Approximate campus coordinates in Jamshoro. */
export const CAMPUSES: Campus[] = [
  { id: "uos", name: "University of Sindh (UoS)", short: "UoS", lat: 25.437, lng: 68.267 },
  { id: "muet", name: "MUET Jamshoro", short: "MUET", lat: 25.4082, lng: 68.261 },
  { id: "lumhs", name: "LUMHS Jamshoro", short: "LUMHS", lat: 25.4243, lng: 68.2707 },
];

export const JAMSHORO_CENTER: [number, number] = [25.4245, 68.2665];

export const AREAS = [
  "Jamshoro Phatak",
  "Kotri",
  "Phase 1",
  "Phase 2",
  "Jamshoro Town",
  "Indus Highway",
  "Old Wahdat Colony",
  "Other",
];

export type AmenityKey = string;

export const AMENITIES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "ac", label: "AC", icon: AirVent },
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "mess", label: "Mess / Food", icon: UtensilsCrossed },
  { key: "generator", label: "Generator", icon: Zap },
  { key: "ups", label: "UPS", icon: BatteryCharging },
  { key: "laundry", label: "Laundry", icon: Shirt },
  { key: "security", label: "Security Guard", icon: ShieldCheck },
  { key: "cctv", label: "CCTV", icon: Cctv },
  { key: "attached_washroom", label: "Attached Washroom", icon: Bath },
  { key: "shared_washroom", label: "Shared Washroom", icon: ShowerHead },
  { key: "parking", label: "Parking", icon: Car },
  { key: "water", label: "Water Supply", icon: Droplets },
  { key: "electricity", label: "Electricity Included", icon: Plug },
  { key: "gas", label: "Gas", icon: Flame },
  { key: "study", label: "Study Area", icon: BookOpen },
  { key: "kitchen", label: "Kitchen", icon: CookingPot },
];

export const AMENITY_MAP = Object.fromEntries(AMENITIES.map((a) => [a.key, a]));

export const QUICK_FILTERS = [
  { key: "ac", label: "AC Available" },
  { key: "wifi", label: "Wi-Fi Included" },
  { key: "mess", label: "Mess/Food" },
  { key: "generator", label: "Generator / UPS" },
  { key: "laundry", label: "Laundry" },
  { key: "security", label: "Security" },
  { key: "attached_washroom", label: "Attached Washroom" },
  { key: "budget", label: "Under Rs. 6,000" },
];

export const ROOM_TYPES = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double Sharing" },
  { value: "triple", label: "Triple Sharing" },
  { value: "other", label: "Other" },
];

export const LISTING_TYPES = [
  { value: "hostel", label: "Hostel / Property", hint: "A full hostel or rental property" },
  { value: "private_room", label: "Private Room", hint: "A single room for one student" },
  { value: "shared_room", label: "Shared Room", hint: "A bed in a shared room" },
  { value: "roommate_wanted", label: "Roommate Wanted", hint: "You have a place, need a roommate" },
];

export function roomTypeLabel(value: string) {
  return ROOM_TYPES.find((r) => r.value === value)?.label ?? value;
}

export function listingTypeLabel(value: string) {
  return LISTING_TYPES.find((r) => r.value === value)?.label ?? value;
}

export function formatPKR(amount: number | null | undefined) {
  if (amount == null) return "—";
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

/** Haversine distance in km. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function campusById(id?: string | null) {
  return CAMPUSES.find((c) => c.id === id);
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  if (digits.startsWith("92")) return digits;
  return `92${digits}`;
}

export function whatsappUrl(phone: string, title: string) {
  const message = `Hi, I am interested in your listing ${title} posted on Jamshoro Hostel Finder. Is it still available?`;
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
