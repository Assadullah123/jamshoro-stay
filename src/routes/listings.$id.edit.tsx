import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingForm } from "@/components/ListingForm";
import { useAuth } from "@/hooks/useAuth";
import { fetchListing } from "@/lib/listings";

export const Route = createFileRoute("/listings/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit listing — Jamshoro Hostel Finder" },
      { name: "description", content: "Update the details, photos and contacts of your listing." },
      { property: "og:title", content: "Edit listing — Jamshoro Hostel Finder" },
      { property: "og:description", content: "Update your student accommodation listing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
    enabled: Boolean(user),
  });

  if (!user || isLoading) return <Skeleton className="m-4 h-96 rounded-xl" />;
  if (!data) return <div className="p-10 text-center">Listing not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-5 text-xl font-bold">Edit listing</h1>
      <ListingForm userId={user.id} listing={data} />
    </div>
  );
}
