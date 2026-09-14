import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/constants";
import { updateListing, type Listing } from "@/lib/listings";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderation — Jamshoro Hostel Finder" },
      { name: "description", content: "Review, approve or reject submitted listings and handle reports." },
      { property: "og:title", content: "Moderation — Jamshoro Hostel Finder" },
      { property: "og:description", content: "Admin moderation queue for listings and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_contacts(id,label,phone,whatsapp,sort_order)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_reports")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const moderate = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      updateListing(id, patch as never),
    onSuccess: () => {
      toast.success("Listing updated.");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: () => toast.error("Could not update the listing."),
  });

  const resolveReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listing_reports").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  if (!loading && user && !isAdmin) {
    return (
      <div className="p-10 text-center">
        <p className="font-semibold">Admins only</p>
        <p className="text-sm text-muted-foreground">You do not have moderation access.</p>
      </div>
    );
  }

  const rows = listings ?? [];
  const pendingRows = rows.filter((l) => l.status === "pending");
  const approvedRows = rows.filter((l) => l.status === "approved");
  const rejectedRows = rows.filter((l) => l.status === "rejected");

  function ListingRows({ items }: { items: Listing[] }) {
    if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
    if (!items.length) return <p className="p-6 text-center text-sm text-muted-foreground">Nothing here.</p>;
    return (
      <div className="space-y-3 pt-3">
        {items.map((l) => (
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
                  {formatPKR(l.monthly_rent)}/month · {l.area} · {l.gender}
                </p>
                {l.is_featured ? <Badge className="mt-1">Featured</Badge> : null}
              </div>
              <div className="flex gap-2">
                {l.status !== "approved" ? (
                  <Button size="sm" onClick={() => moderate.mutate({ id: l.id, patch: { status: "approved" } })}>
                    <Check /> Approve
                  </Button>
                ) : null}
                {l.status !== "rejected" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderate.mutate({ id: l.id, patch: { status: "rejected" } })}
                  >
                    <X /> Reject
                  </Button>
                ) : null}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Toggle featured"
                  onClick={() => moderate.mutate({ id: l.id, patch: { is_featured: !l.is_featured } })}
                >
                  <Star className={l.is_featured ? "fill-warning text-warning" : ""} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold">Moderation</h1>
      <Tabs defaultValue="pending" className="mt-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRows.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <ListingRows items={pendingRows} />
        </TabsContent>
        <TabsContent value="approved">
          <ListingRows items={approvedRows} />
        </TabsContent>
        <TabsContent value="rejected">
          <ListingRows items={rejectedRows} />
        </TabsContent>
        <TabsContent value="reports">
          <div className="space-y-3 pt-3">
            {reports?.length ? (
              reports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div className="flex-1">
                      <p className="font-medium">{r.reason}</p>
                      {r.note ? <p className="text-sm text-muted-foreground">{r.note}</p> : null}
                      <Link
                        to="/listing/$id"
                        params={{ id: r.listing_id }}
                        className="text-xs text-accent hover:underline"
                      >
                        View listing
                      </Link>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => resolveReport.mutate(r.id)}>
                      <Check /> Mark resolved
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">No open reports.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
