import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { CAMPUSES, JAMSHORO_CENTER, formatPKR, roomTypeLabel } from "@/lib/constants";
import type { Listing } from "@/lib/listings";

/**
 * Tile provider is isolated here so it can be swapped without touching callers.
 * OpenStreetMap standard tiles — attribution is required by their usage policy.
 */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function pin(color: string, label?: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);color:white;font-size:10px;font-weight:700">${label ?? ""}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  });
}

const LISTING_PIN = pin("oklch(0.33 0.093 259)");
const ACTIVE_PIN = pin("oklch(0.62 0.105 195)");
const CAMPUS_PIN = pin("oklch(0.66 0.16 148)", "U");

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [position, map]);
  return null;
}

export function ListingsMapImpl({
  listings,
  activeId,
  onSelect,
}: {
  listings: Listing[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const active = listings.find((l) => l.id === activeId && l.latitude && l.longitude);
  const position: [number, number] | null = active
    ? [active.latitude as number, active.longitude as number]
    : null;

  return (
    <MapContainer
      center={JAMSHORO_CENTER}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FlyTo position={position} />
      {CAMPUSES.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={CAMPUS_PIN}>
          <Popup>
            <strong>{c.name}</strong>
          </Popup>
        </Marker>
      ))}
      {listings
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => (
          <Marker
            key={l.id}
            position={[l.latitude as number, l.longitude as number]}
            icon={l.id === activeId ? ACTIVE_PIN : LISTING_PIN}
            eventHandlers={{ click: () => onSelect?.(l.id) }}
          >
            <Popup>
              <div className="w-44 space-y-1">
                {l.images[0] ? (
                  <img
                    src={l.images[0]}
                    alt={l.title}
                    loading="lazy"
                    className="h-20 w-full rounded object-cover"
                  />
                ) : null}
                <p className="font-semibold">{l.title}</p>
                <p className="text-xs">
                  {formatPKR(l.monthly_rent)}/mo • {roomTypeLabel(l.room_type)}
                </p>
                <a href={`/listing/${l.id}`} className="text-xs font-semibold underline">
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPickerImpl({
  value,
  onPick,
}: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : JAMSHORO_CENTER}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ClickCatcher onPick={onPick} />
      {CAMPUSES.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={CAMPUS_PIN}>
          <Popup>{c.name}</Popup>
        </Marker>
      ))}
      {value ? <Marker position={[value.lat, value.lng]} icon={ACTIVE_PIN} /> : null}
    </MapContainer>
  );
}

export function SingleMapImpl({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {CAMPUSES.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={CAMPUS_PIN}>
          <Popup>{c.name}</Popup>
        </Marker>
      ))}
      <Marker position={[lat, lng]} icon={ACTIVE_PIN}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}
