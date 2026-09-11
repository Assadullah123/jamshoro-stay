import { lazy, Suspense } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@/lib/listings";

const ListingsMapImpl = lazy(() =>
  import("./MapImpl").then((m) => ({ default: m.ListingsMapImpl })),
);
const MapPickerImpl = lazy(() => import("./MapImpl").then((m) => ({ default: m.MapPickerImpl })));
const SingleMapImpl = lazy(() => import("./MapImpl").then((m) => ({ default: m.SingleMapImpl })));

const Fallback = () => <Skeleton className="h-full w-full rounded-xl" />;

export function ListingsMap(props: {
  listings: Listing[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <ListingsMapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export function MapPicker(props: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <MapPickerImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export function SingleMap(props: { lat: number; lng: number; title: string }) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <SingleMapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}
