import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { formatPKR } from "@/lib/constants";
import { deleteListing, fetchMyListings, updateListing } from "@/lib/listings";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My listings — Jamshoro Hostel Finder" },
      { name: "description", content: "Manage the hostels and rooms you have listed in Jamshoro." },
      { property: "og:title", content: "My listings — Jamshoro Hostel Finder" },
      { property: "og:description", content: "Manage your student accommodation listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "border-warning text-warning",
  approved: "border-success text-success",
  rejected: "border-destructive text-destructive",
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: () => fetchMyListings(user!.id),
    enabled: Boolean(user?.id),
  });

  const toggle = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      updateListing(id, { is_available: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-listings"] }),
    onError: () => toast.error("Could not update availability."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      toast.success("Listing deleted.");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: () => toast.error("Could not delete listing."),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">My listings</h1>
        <Button asChild variant="accent">
          <Link to="/listings/new">
            <Plus /> New listing
          </Link>
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        ) : data?.length ? (
          data.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                {l.images[0] ? (
                  <img src={l.images[0]} alt="" loading="lazy" className="h-16 w-20 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-20 rounded-lg bg-muted" />
                )}
                <div className="min-w-40 flex-1">
                  <Link to="/listing/$id" params={{ id: l.id }} className="font-semibold hover:underline">
                    {l.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatPKR(l.monthly_rent)}/month · {l.area}
                  </p>
                  <Badge variant="outline" className={`mt-1 ${STATUS_STYLES[l.status] ?? ""}`}>
                    {l.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={l.is_available}
                      onCheckedChange={(v) => toggle.mutate({ id: l.id, value: v })}
                      aria-label="Toggle availability"
                    />
                    {l.is_available ? "Available" : "Taken"}
                  </div>
                  <Button asChild variant="outline" size="icon" aria-label="Edit listing">
                    <Link to="/listings/$id/edit" params={{ id: l.id }}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete listing"
                    onClick={() => {
                      if (confirm("Delete this listing permanently?")) remove.mutate(l.id);
                    }}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-medium">You have no listings yet</p>
            <Button asChild className="mt-4">
              <Link to="/listings/new">Create your first listing</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
