/** JSON-shaped mappers for MCP structured content. */

export type ListingRow = {
  id: string;
  title: string;
  description: string;
  listing_type: string;
  gender: string;
  monthly_rent: number;
  security_deposit: number | null;
  room_type: string;
  available_beds: number;
  is_available: boolean;
  available_now: boolean;
  area: string;
  address: string;
  nearby_campus: string | null;
  amenities: string[];
  status: string;
  created_at: string;
};

export const toListingJson = (l: ListingRow) => ({
  id: l.id,
  title: l.title,
  description: l.description,
  listing_type: l.listing_type,
  gender: l.gender,
  monthly_rent_pkr: l.monthly_rent,
  security_deposit_pkr: l.security_deposit,
  room_type: l.room_type,
  available_beds: l.available_beds,
  is_available: l.is_available,
  available_now: l.available_now,
  area: l.area,
  address: l.address,
  nearby_campus: l.nearby_campus,
  amenities: l.amenities.map((a) => a),
  status: l.status,
  created_at: l.created_at,
});

export const LISTING_COLUMNS =
  "id,title,description,listing_type,gender,monthly_rent,security_deposit,room_type,available_beds,is_available,available_now,area,address,nearby_campus,amenities,status,created_at";
