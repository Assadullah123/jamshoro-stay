import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";
import { LISTING_COLUMNS, toListingJson, type ListingRow } from "../shape";

export default defineTool({
  name: "search_listings",
  title: "Search listings",
  description:
    "Search approved student accommodation in Jamshoro/Kotri by gender, area, campus, rent range, room type and amenities.",
  inputSchema: {
    gender: z.enum(["boys", "girls"]).nullable().describe("Boys' or girls' accommodation."),
    area: z.string().nullable().describe("Area name, e.g. 'Kotri' or 'Jamshoro Phatak'."),
    nearby_campus: z
      .enum(["uos", "muet", "lumhs"])
      .nullable()
      .describe("Nearest campus: uos, muet or lumhs."),
    max_rent: z.number().int().positive().nullable().describe("Maximum monthly rent in PKR."),
    min_rent: z.number().int().positive().nullable().describe("Minimum monthly rent in PKR."),
    room_type: z
      .enum(["single", "double", "triple", "other"])
      .nullable()
      .describe("Room sharing type."),
    amenities: z
      .array(z.string())
      .nullable()
      .describe("Amenity keys that must all be present, e.g. ['wifi','mess']."),
    available_only: z.boolean().nullable().describe("Only currently available listings."),
    limit: z.number().int().min(1).max(50).nullable().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = supabaseAnon();
    let query = supabase.from("listings").select(LISTING_COLUMNS).eq("status", "approved");

    if (input.gender) query = query.eq("gender", input.gender);
    if (input.area) query = query.ilike("area", `%${input.area}%`);
    if (input.nearby_campus) query = query.eq("nearby_campus", input.nearby_campus);
    if (input.min_rent != null) query = query.gte("monthly_rent", input.min_rent);
    if (input.max_rent != null) query = query.lte("monthly_rent", input.max_rent);
    if (input.room_type) query = query.eq("room_type", input.room_type);
    if (input.amenities?.length) query = query.contains("amenities", input.amenities);
    if (input.available_only) query = query.eq("is_available", true);

    const { data, error } = await query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 20);

    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    const listings = ((data ?? []) as ListingRow[]).map(toListingJson);
    return {
      content: [
        {
          type: "text" as const,
          text: listings.length
            ? `Found ${listings.length} listing(s).\n${listings
                .map((l) => `- ${l.title} — Rs. ${l.monthly_rent_pkr}/month in ${l.area} (${l.id})`)
                .join("\n")}`
            : "No listings matched those filters.",
        },
      ],
      structuredContent: { listings },
    };
  },
});
