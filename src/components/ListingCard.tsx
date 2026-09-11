import { Link } from "@tanstack/react-router";
import { ImageIcon, MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AMENITY_MAP,
  campusById,
  distanceKm,
  formatPKR,
  roomTypeLabel,
  whatsappUrl,
} from "@/lib/constants";
import type { Listing } from "@/lib/listings";
import { cn } from "@/lib/utils";

export function ListingCard({
  listing,
  active,
  campusId,
  onHover,
}: {
  listing: Listing;
  active?: boolean;
  campusId?: string | null;
  onHover?: (id: string) => void;
}) {
  const campus = campusById(campusId ?? listing.nearby_campus);
  const dist =
    campus && listing.latitude != null && listing.longitude != null
      ? distanceKm(listing.latitude, listing.longitude, campus.lat, campus.lng)
      : null;

  const wa = listing.listing_contacts?.find((c) => c.whatsapp);
  const topAmenities = listing.amenities.slice(0, 4);

  return (
    <Card
      onMouseEnter={() => onHover?.(listing.id)}
      className={cn(
        "overflow-hidden border-border shadow-card transition-shadow hover:shadow-lg",
        active && "ring-2 ring-accent",
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          to="/listing/$id"
          params={{ id: listing.id }}
          className="relative block h-44 w-full shrink-0 bg-muted sm:h-auto sm:w-44"
        >
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-36 w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            <Badge variant={listing.gender === "boys" ? "default" : "secondary"}>
              {listing.gender === "boys" ? "Boys" : "Girls"}
            </Badge>
            {listing.listing_type === "roommate_wanted" ? (
              <Badge className="bg-accent text-accent-foreground">Roommate</Badge>
            ) : null}
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <Link to="/listing/$id" params={{ id: listing.id }} className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">{listing.title}</h3>
            </Link>
            <p className="whitespace-nowrap font-bold text-primary">
              {formatPKR(listing.monthly_rent)}
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {roomTypeLabel(listing.room_type)} • {listing.available_beds} bed(s) •{" "}
            {listing.is_available ? (
              <span className="font-medium text-success">Available</span>
            ) : (
              <span className="font-medium text-destructive">Not available</span>
            )}
          </p>

          {listing.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
          ) : null}

          <div className="flex flex-wrap gap-1">
            {topAmenities.map((a) => {
              const meta = AMENITY_MAP[a];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  <Icon className="size-3" /> {meta.label}
                </span>
              );
            })}
          </div>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-accent" />
            {listing.area}
            {dist != null ? ` • ${dist.toFixed(1)} km from ${campus?.short}` : ""}
          </p>

          <div className="mt-auto flex gap-2 pt-1">
            <Button asChild size="sm" className="flex-1">
              <Link to="/listing/$id" params={{ id: listing.id }}>
                View Details
              </Link>
            </Button>
            {wa ? (
              <Button asChild size="sm" variant="whatsapp" className="flex-1">
                <a href={whatsappUrl(wa.phone, listing.title)} target="_blank" rel="noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ListingCardSkeleton() {
  return <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />;
}
