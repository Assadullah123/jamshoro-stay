import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, List, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { ListingsMap } from "@/components/map";
import {
  AMENITIES,
  AREAS,
  CAMPUSES,
  ROOM_TYPES,
  campusById,
  distanceKm,
} from "@/lib/constants";
import { fetchPublicListings, type Listing } from "@/lib/listings";
import { parseListingSearch, type ListingSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  validateSearch: parseListingSearch,
  head: () => ({
    meta: [
      { title: "Search hostels & rooms — Jamshoro Hostel Finder" },
      {
        name: "description",
        content:
          "Filter student hostels, private and shared rooms by campus, area, rent and amenities in Jamshoro and Kotri.",
      },
      { property: "og:title", content: "Search hostels & rooms in Jamshoro" },
      {
        property: "og:description",
        content: "Filter by campus, area, rent and amenities to find student accommodation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [view, setView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const amenities = search.amenities ? search.amenities.split(",").filter(Boolean) : [];

  function update(patch: Partial<ListingSearchParams>) {
    navigate({
      search: (prev) => {
        const next: ListingSearchParams = { ...prev, ...patch };
        for (const key of Object.keys(next) as (keyof ListingSearchParams)[]) {
          if (!next[key]) delete next[key];
        }
        return next;
      },
    });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["listings", search],
    queryFn: () =>
      fetchPublicListings({
        gender: search.gender === "boys" || search.gender === "girls" ? search.gender : null,
        q: search.q ?? "",
        campus: search.campus ?? null,
        area: search.area ?? null,
        minRent: search.minRent ? Number(search.minRent) : null,
        maxRent: search.maxRent ? Number(search.maxRent) : null,
        roomType: search.roomType ?? null,
        amenities,
        availableOnly: search.available === "1",
        sort:
          search.sort === "rent_asc" || search.sort === "rent_desc" || search.sort === "distance"
            ? search.sort
            : "newest",
      }),
  });

  const listings: Listing[] = useMemo(() => {
    const rows = data ?? [];
    if (search.sort !== "distance") return rows;
    const campus = campusById(search.campus) ?? CAMPUSES[0];
    if (!campus) return rows;
    return [...rows].sort((a, b) => {
      const da =
        a.latitude != null && a.longitude != null
          ? distanceKm(a.latitude, a.longitude, campus.lat, campus.lng)
          : Infinity;
      const db =
        b.latitude != null && b.longitude != null
          ? distanceKm(b.latitude, b.longitude, campus.lat, campus.lng)
          : Infinity;
      return da - db;
    });
  }, [data, search.sort, search.campus]);

  const activeChips = [
    search.gender ? { label: search.gender === "boys" ? "Boys" : "Girls", clear: { gender: "" } } : null,
    search.campus ? { label: campusById(search.campus)?.short ?? search.campus, clear: { campus: "" } } : null,
    search.area ? { label: search.area, clear: { area: "" } } : null,
    search.maxRent ? { label: `Under Rs. ${search.maxRent}`, clear: { maxRent: "" } } : null,
    search.roomType ? { label: search.roomType, clear: { roomType: "" } } : null,
    ...amenities.map((a) => ({
      label: AMENITIES.find((x) => x.key === a)?.label ?? a,
      clear: { amenities: amenities.filter((x) => x !== a).join(",") },
    })),
  ].filter(Boolean) as { label: string; clear: Partial<ListingSearchParams> }[];

  const filters = (
    <div className="space-y-5">
      <div>
        <Label>Gender</Label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {[
            { v: "", l: "All" },
            { v: "boys", l: "Boys" },
            { v: "girls", l: "Girls" },
          ].map((o) => (
            <button
              key={o.l}
              onClick={() => update({ gender: o.v })}
              className={cn(
                "rounded-lg border px-2 py-2 text-sm",
                (search.gender ?? "") === o.v
                  ? "border-accent bg-accent/10 font-semibold text-accent"
                  : "border-border",
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Campus</Label>
        <Select value={search.campus ?? "all"} onValueChange={(v) => update({ campus: v === "all" ? "" : v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any campus</SelectItem>
            {CAMPUSES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Area</Label>
        <Select value={search.area ?? "all"} onValueChange={(v) => update({ area: v === "all" ? "" : v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any area</SelectItem>
            {AREAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="minRent">Min rent</Label>
          <Input
            id="minRent"
            inputMode="numeric"
            value={search.minRent ?? ""}
            onChange={(e) => update({ minRent: e.target.value.replace(/\D/g, "") })}
          />
        </div>
        <div>
          <Label htmlFor="maxRent">Max rent</Label>
          <Input
            id="maxRent"
            inputMode="numeric"
            value={search.maxRent ?? ""}
            onChange={(e) => update({ maxRent: e.target.value.replace(/\D/g, "") })}
          />
        </div>
      </div>

      <div>
        <Label>Room type</Label>
        <Select value={search.roomType ?? "all"} onValueChange={(v) => update({ roomType: v === "all" ? "" : v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any room type</SelectItem>
            {ROOM_TYPES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Amenities</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const on = amenities.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() =>
                  update({
                    amenities: (on ? amenities.filter((x) => x !== a.key) : [...amenities, a.key]).join(","),
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  on ? "border-accent bg-accent/10 text-accent" : "border-border",
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="avail"
          checked={search.available === "1"}
          onCheckedChange={(v) => update({ available: v ? "1" : "" })}
        />
        <Label htmlFor="avail">Available now only</Label>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search.q ?? ""}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search hostels, areas..."
          className="h-10 max-w-xs flex-1"
          aria-label="Search listings"
        />
        <Select value={search.sort ?? "newest"} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-10 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="rent_asc">Rent: low to high</SelectItem>
            <SelectItem value="rent_desc">Rent: high to low</SelectItem>
            <SelectItem value="distance">Distance to campus</SelectItem>
          </SelectContent>
        </Select>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-10 lg:hidden">
              <SlidersHorizontal /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">{filters}</div>
          </SheetContent>
        </Sheet>
        <Button
          variant="outline"
          className="h-10 lg:hidden"
          onClick={() => setView(view === "list" ? "map" : "list")}
        >
          {view === "list" ? <MapIcon /> : <List />}
          {view === "list" ? "Map" : "List"}
        </Button>
      </div>

      {activeChips.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeChips.map((c, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {c.label}
              <button aria-label={`Remove ${c.label}`} onClick={() => update(c.clear)}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-5 lg:grid-cols-[280px_1fr_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div className={cn("space-y-4", view === "map" ? "hidden lg:block" : "")}>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching..." : `${listings.length} listings found`}
          </p>
          {isLoading ? (
            <>
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </>
          ) : listings.length ? (
            listings.map((l) => (
              <div key={l.id} onMouseEnter={() => setActiveId(l.id)}>
                <ListingCard listing={l} campusId={search.campus ?? null} />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">No listings match these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your rent range or removing some amenities.
              </p>
            </div>
          )}
        </div>

        <div className={cn(view === "list" ? "hidden lg:block" : "")}>
          <div className="h-[70vh] overflow-hidden rounded-xl border border-border lg:sticky lg:top-20">
            <ListingsMap listings={listings} activeId={activeId} onSelect={setActiveId} />
          </div>
        </div>
      </div>
    </div>
  );
}
