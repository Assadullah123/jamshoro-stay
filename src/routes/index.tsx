import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { AREAS, CAMPUSES, QUICK_FILTERS } from "@/lib/constants";
import { fetchPublicListings } from "@/lib/listings";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-jamshoro.jpg";
import uosGate from "@/assets/campus-uos.jpg";
import muetGate from "@/assets/campus-muet.jpg";
import lumhsGate from "@/assets/campus-lumhs.jpg";

const CAMPUS_IMAGES: Record<string, string> = {
  uos: uosGate,
  muet: muetGate,
  lumhs: lumhsGate,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jamshoro Student Housing & Hostel Finder" },
      {
        name: "description",
        content:
          "Find verified boys' and girls' hostels, rooms and roommates near UoS, MUET and LUMHS in Jamshoro and Kotri.",
      },
      { property: "og:title", content: "Jamshoro Student Housing & Hostel Finder" },
      {
        property: "og:description",
        content:
          "Search student hostels, private rooms and shared accommodation near UoS, MUET and LUMHS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["home-listings"],
    queryFn: () => fetchPublicListings({ sort: "newest" }),
  });

  const featured = (data ?? []).slice(0, 6);

  function go(params: Record<string, string>) {
    navigate({ to: "/search", search: params });
  }

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Student housing in Jamshoro & Kotri
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Hostels, rooms and roommates near University of Sindh, MUET and LUMHS — with real
            photos and direct contact numbers.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => go({ gender: "boys" })}
              className="group rounded-2xl border-2 border-primary bg-primary p-6 text-left text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5"
            >
              <Users className="mb-2 size-7" />
              <p className="text-lg font-bold">Find Boys&apos; Accommodation</p>
              <p className="text-xs opacity-80">Hostels & rooms for male students</p>
            </button>
            <button
              onClick={() => go({ gender: "girls" })}
              className="group rounded-2xl border-2 border-accent bg-accent p-6 text-left text-accent-foreground shadow-card transition-transform hover:-translate-y-0.5"
            >
              <Users className="mb-2 size-7" />
              <p className="text-lg font-bold">Find Girls&apos; Accommodation</p>
              <p className="text-xs opacity-90">Hostels & rooms for female students</p>
            </button>
          </div>

          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              go(q.trim() ? { q: q.trim() } : {});
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by campus or nearby area..."
                className="h-12 rounded-xl pl-9"
                aria-label="Search hostels"
              />
            </div>
            <Button type="submit" size="xl">
              Search
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Campuses
            </p>
            <div className="flex flex-wrap gap-2">
              {CAMPUSES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go({ campus: c.id })}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent"
                >
                  <GraduationCap className="size-3.5 text-accent" /> {c.short}
                </button>
              ))}
            </div>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Areas & landmarks
            </p>
            <div className="flex flex-wrap gap-2">
              {AREAS.filter((a) => a !== "Other").map((a) => (
                <button
                  key={a}
                  onClick={() => go({ area: a })}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent"
                >
                  <MapPin className="size-3.5 text-accent" /> {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick filters
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() =>
                go(f.key === "budget" ? { maxRent: "6000" } : { amenities: f.key })
              }
              className={cn(
                "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Latest listings</h2>
          <Button asChild variant="link" size="sm">
            <Link to="/search">See all</Link>
          </Button>
        </div>
        <div className="grid gap-4">
          {isLoading ? (
            <>
              <ListingCardSkeleton />
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </>
          ) : featured.length ? (
            featured.map((l) => <ListingCard key={l.id} listing={l} />)
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">No listings published yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Are you a hostel owner? Be the first to list your property.
              </p>
              <Button asChild className="mt-4">
                <Link to="/listings/new">List a Property</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Reviewed listings", text: "Every listing is checked before it goes live." },
            { icon: MapPin, title: "Campus distances", text: "See how far each hostel is from your campus." },
            { icon: Users, title: "Roommate matching", text: "Post or find a shared room near your campus." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5">
              <item.icon className="mb-2 size-5 text-accent" />
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
