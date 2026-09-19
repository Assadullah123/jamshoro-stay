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
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Aerial view of Jamshoro at sunset with the Indus river and Kotri bridge"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        <div className="mx-auto max-w-5xl px-4 py-14 text-primary-foreground sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <MapPin className="size-3.5" /> Jamshoro · Kotri · UoS · MUET · LUMHS
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Student housing in Jamshoro, made simple
          </h1>
          <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">
            Hostels, private rooms and roommates near your campus — with real photos, honest rent
            and direct contact numbers.
          </p>

          <form
            className="mt-7 flex flex-col gap-2 rounded-2xl border border-primary-foreground/15 bg-background/95 p-2 shadow-card backdrop-blur sm:flex-row"
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
                placeholder="Search by campus, area or hostel name..."
                className="h-12 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                aria-label="Search hostels"
              />
            </div>
            <Button type="submit" size="xl" className="rounded-xl">
              Search
            </Button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => go({ gender: "boys" })}
              className="flex items-center justify-between rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 text-left backdrop-blur transition-colors hover:bg-primary-foreground/20"
            >
              <span>
                <span className="block text-base font-bold">Boys&apos; accommodation</span>
                <span className="text-xs opacity-80">Hostels & rooms for male students</span>
              </span>
              <ArrowRight className="size-5" />
            </button>
            <button
              onClick={() => go({ gender: "girls" })}
              className="flex items-center justify-between rounded-2xl border border-accent/40 bg-accent/90 p-4 text-left text-accent-foreground transition-colors hover:bg-accent"
            >
              <span>
                <span className="block text-base font-bold">Girls&apos; accommodation</span>
                <span className="text-xs opacity-90">Hostels & rooms for female students</span>
              </span>
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-lg font-bold">Browse by campus</h2>
        <p className="text-sm text-muted-foreground">
          Pick your university to see the closest hostels first.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CAMPUSES.map((c) => (
            <button
              key={c.id}
              onClick={() => go({ campus: c.id })}
              className="group relative overflow-hidden rounded-2xl border border-border text-left shadow-card transition-transform hover:-translate-y-1"
            >
              <img
                src={CAMPUS_IMAGES[c.id] ?? uosGate}
                alt={`Main gate of ${c.name}`}
                loading="lazy"
                width={1200}
                height={800}
                className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
                <p className="flex items-center gap-1.5 text-base font-bold">
                  <GraduationCap className="size-4" /> {c.short}
                </p>
                <p className="text-xs opacity-85">{c.name}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Popular areas
        </h2>
        <div className="flex flex-wrap gap-2">
          {AREAS.filter((a) => a !== "Other").map((a) => (
            <button
              key={a}
              onClick={() => go({ area: a })}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
            >
              <MapPin className="size-3.5 text-accent" /> {a}
            </button>
          ))}
        </div>
        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick filters
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => go(f.key === "budget" ? { maxRent: "6000" } : { amenities: f.key })}
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
