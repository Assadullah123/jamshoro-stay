export type ListingSearchParams = {
  gender?: string;
  q?: string;
  campus?: string;
  area?: string;
  minRent?: string;
  maxRent?: string;
  roomType?: string;
  amenities?: string;
  sort?: string;
  available?: string;
};

const KEYS: (keyof ListingSearchParams)[] = [
  "gender",
  "q",
  "campus",
  "area",
  "minRent",
  "maxRent",
  "roomType",
  "amenities",
  "sort",
  "available",
];

export function parseListingSearch(search: Record<string, unknown>): ListingSearchParams {
  const out: ListingSearchParams = {};
  for (const key of KEYS) {
    const value = search[key];
    if (typeof value === "string" && value.length > 0) out[key] = value.slice(0, 120);
  }
  return out;
}
