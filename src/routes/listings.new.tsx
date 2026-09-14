import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListingForm } from "@/components/ListingForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/listings/new")({
  head: () => ({
    meta: [
      { title: "List your property — Jamshoro Hostel Finder" },
      {
        name: "description",
        content: "Post your hostel, private room, shared room or roommate request for Jamshoro students.",
      },
      { property: "og:title", content: "List your property — Jamshoro Hostel Finder" },
      { property: "og:description", content: "Post a hostel, room or roommate listing in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewListing,
});

function NewListing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  if (!user) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl font-bold">List your property</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Listings are reviewed before they appear publicly.
      </p>
      <ListingForm userId={user.id} />
    </div>
  );
}
