import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";
import { LISTING_COLUMNS, toListingJson, type ListingRow } from "../shape";

export default defineTool({
  name: "get_listing",
  title: "Get listing details",
  description: "Fetch the full details of one approved listing by its id.",
  inputSchema: { id: z.string().uuid().describe("Listing id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("listings")
      .select(LISTING_COLUMNS)
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();

    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text" as const, text: "No approved listing found with that id." }],
        isError: true,
      };

    const listing = toListingJson(data as ListingRow);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(listing, null, 2) }],
      structuredContent: { listing },
    };
  },
});
