import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  CalendarClock,
  Check,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDialog } from "@/components/ReportDialog";
import { SingleMap } from "@/components/map";
import {
  AMENITIES,
  CAMPUSES,
  distanceKm,
  formatPKR,
  listingTypeLabel,
  roomTypeLabel,
  whatsappUrl,
} from "@/lib/constants";
import { fetchListing } from "@/lib/listings";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Listing details — Jamshoro Hostel Finder" },
      {
        name: "description",
        content: "Photos, rent, amenities, location and contact details for this student accommodation in Jamshoro.",
      },
      { property: "og:title", content: "Listing details — Jamshoro Hostel Finder" },
      {
        property: "og:description",
        content: "See rent, amenities, campus distance and contact numbers for this listing.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingDetails,
  errorComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">This listing could not be loaded.</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Listing not found.</div>,
});

function ListingDetails() {
  const { id } = Route.useParams();
  const [active, setActive] = useState(0);
  const { user } = useAuth();
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <Skeleton className="h-60 w-full rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="font-semibold">Listing not found</p>
        <Button asChild className="mt-4">
          <Link to="/search">Back to search</Link>
        </Button>
      </div>
    );
  }

  const contacts = [...(listing.listing_contacts ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const images = listing.images.length ? listing.images : [];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-4">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/search">
          <ArrowLeft /> Back to search
        </Link>
      </Button>

      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {images.length ? (
          <>
            <img
              src={images[active]}
              alt={listing.title}
              className="h-64 w-full object-cover sm:h-80"
            />
            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto p-2">
                {images.map((src, i) => (
                  <button key={src} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}>
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className={`h-16 w-20 rounded-lg object-cover ${i === active ? "ring-2 ring-accent" : ""}`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No photos provided
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge>{listing.gender === "boys" ? "Boys" : "Girls"}</Badge>
        <Badge variant="secondary">{listingTypeLabel(listing.listing_type)}</Badge>
        <Badge variant="outline">{roomTypeLabel(listing.room_type)}</Badge>
        {listing.available_now ? (
          <Badge variant="outline" className="border-success text-success">
            Available now
          </Badge>
        ) : null}
      </div>

      <h1 className="mt-2 text-2xl font-bold text-primary">{listing.title}</h1>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="size-4" /> {listing.area}
        {listing.address ? ` — ${listing.address}` : ""}
      </p>
      <p className="mt-3 text-2xl font-bold">
        {formatPKR(listing.monthly_rent)}
        <span className="text-sm font-normal text-muted-foreground">/month</span>
      </p>
      {listing.security_deposit ? (
        <p className="text-sm text-muted-foreground">
          Security deposit: {formatPKR(listing.security_deposit)}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <BedDouble className="size-4 text-accent" /> {listing.available_beds} available
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <CalendarClock className="size-4 text-accent" />
            {listing.available_now ? "Move in now" : listing.available_from ?? "Date on request"}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <MapPin className="size-4 text-accent" /> {listing.area}
          </CardContent>
        </Card>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">About this place</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{listing.description}</p>
      </section>

      {listing.amenities.length ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Amenities</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {listing.amenities.map((key) => {
              const a = AMENITIES.find((x) => x.key === key);
              const Icon = a?.icon ?? Check;
              return (
                <div key={key} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  <Icon className="size-4 text-accent" /> {a?.label ?? key}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {listing.latitude != null && listing.longitude != null ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Location & campus distance</h2>
          <div className="mt-2 h-64 overflow-hidden rounded-xl border border-border">
            <SingleMap lat={listing.latitude} lng={listing.longitude} title={listing.title} />
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {CAMPUSES.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-2 text-sm">
                <span className="font-medium">{c.short}</span>{" "}
                <span className="text-muted-foreground">
                  {distanceKm(listing.latitude!, listing.longitude!, c.lat, c.lng).toFixed(1)} km
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Contact</h2>
        <div className="mt-2 space-y-2">
          {!user ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Sign in to see the owner's phone and WhatsApp number.
              </p>
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          ) : contacts.length ? (
            contacts.map((c, i) => (
              <div
                key={c.id ?? i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${c.phone}`}>
                      <Phone /> Call
                    </a>
                  </Button>
                  {c.whatsapp ? (
                    <Button asChild variant="whatsapp" size="sm">
                      <a href={whatsappUrl(c.phone, listing.title)} target="_blank" rel="noreferrer">
                        <MessageCircle /> WhatsApp
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No contact numbers provided.</p>
          )}
        </div>
      </section>

      <div className="mt-6">
        <ReportDialog listingId={listing.id} />
      </div>

      {contacts[0] ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <a href={`tel:${contacts[0].phone}`}>
                <Phone /> Call
              </a>
            </Button>
            <Button asChild variant="whatsapp" className="flex-1">
              <a href={whatsappUrl(contacts[0].phone, listing.title)} target="_blank" rel="noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
