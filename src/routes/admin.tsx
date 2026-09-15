import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Search, ShieldCheck, Star, Trash2, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/constants";
import { deleteListing, updateListing, type Listing } from "@/lib/listings";
import { listUsers, setUserBanned, setUserRole, type AdminUser } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Jamshoro Hostel Finder" },
      {
        name: "description",
        content: "Approve listings, review reports and manage users of Jamshoro Hostel Finder.",
      },
      { property: "og:title", content: "Admin dashboard — Jamshoro Hostel Finder" },
      { property: "og:description", content: "Moderate listings, reports and user accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${tone ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const fetchUsers = useServerFn(listUsers);
  const changeRole = useServerFn(setUserRole);
  const changeBan = useServerFn(setUserBanned);

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

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: () => fetchUsers() as Promise<AdminUser[]>,
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

  const removeListing = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      toast.success("Listing deleted.");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: () => toast.error("Could not delete the listing."),
  });

  const resolveReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listing_reports").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "operator" | "student" }) =>
      changeRole({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the role."),
  });

  const banMutation = useMutation({
    mutationFn: (vars: { userId: string; banned: boolean }) => changeBan({ data: vars }),
    onSuccess: () => {
      toast.success("Account updated.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the account."),
  });

  const rows = useMemo(() => {
    const all = listings ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((l) =>
      [l.title, l.area, l.address].join(" ").toLowerCase().includes(q),
    );
  }, [listings, query]);

  const pendingRows = rows.filter((l) => l.status === "pending");
  const approvedRows = rows.filter((l) => l.status === "approved");
  const rejectedRows = rows.filter((l) => l.status === "rejected");

  const filteredUsers = useMemo(() => {
    const all = users ?? [];
    const q = userQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((u) => `${u.email} ${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q));
  }, [users, userQuery]);

  if (!loading && user && !isAdmin) {
    return (
      <div className="p-10 text-center">
        <p className="font-semibold">Admins only</p>
        <p className="text-sm text-muted-foreground">You do not have moderation access.</p>
      </div>
    );
  }

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
              <div className="flex flex-wrap gap-2">
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
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete listing"
                  onClick={() => {
                    if (confirm("Delete this listing permanently?")) removeListing.mutate(l.id);
                  }}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const all = listings ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-bold">Admin dashboard</h1>
      <p className="text-sm text-muted-foreground">Approve listings, review reports and manage users.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Pending" value={all.filter((l) => l.status === "pending").length} tone="text-warning" />
        <Stat label="Approved" value={all.filter((l) => l.status === "approved").length} tone="text-success" />
        <Stat label="Rejected" value={all.filter((l) => l.status === "rejected").length} />
        <Stat label="Open reports" value={reports?.length ?? 0} tone="text-destructive" />
        <Stat label="Users" value={users?.length ?? 0} />
      </div>

      <Tabs defaultValue="pending" className="mt-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending">Pending ({pendingRows.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="relative pt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search listings by title, area or address"
                className="pl-9"
              />
            </div>
            <ListingRows
              items={tab === "pending" ? pendingRows : tab === "approved" ? approvedRows : rejectedRows}
            />
          </TabsContent>
        ))}

        <TabsContent value="reports">
          <div className="space-y-3 pt-3">
            {reports?.length ? (
              reports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div className="flex-1">
                      <p className="font-medium">{r.reason}</p>
                      {r.note ? <p className="text-sm text-muted-foreground">{r.note}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                      <Link
                        to="/listing/$id"
                        params={{ id: r.listing_id }}
                        className="text-xs text-accent hover:underline"
                      >
                        View listing
                      </Link>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moderate.mutate({ id: r.listing_id, patch: { status: "rejected" } })}
                    >
                      <X /> Reject listing
                    </Button>
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

        <TabsContent value="users">
          <div className="relative pt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search by email, name or phone"
              className="pl-9"
            />
          </div>
          <div className="space-y-3 pt-3">
            {usersLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : filteredUsers.length ? (
              filteredUsers.map((u) => (
                <Card key={u.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold">
                        {u.full_name || u.email}
                        {u.roles.includes("admin") ? (
                          <ShieldCheck className="ml-1 inline h-4 w-4 text-accent" />
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.listing_count} listings · joined {new Date(u.created_at).toLocaleDateString()}
                        {u.banned ? " · suspended" : ""}
                      </p>
                    </div>
                    <Select
                      value={u.roles[0] ?? "student"}
                      onValueChange={(role) =>
                        roleMutation.mutate({
                          userId: u.id,
                          role: role as "admin" | "operator" | "student",
                        })
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant={u.banned ? "outline" : "ghost"}
                      onClick={() => banMutation.mutate({ userId: u.id, banned: !u.banned })}
                    >
                      <UserX /> {u.banned ? "Restore" : "Suspend"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
