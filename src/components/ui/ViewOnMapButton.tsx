import { ExternalLink } from "lucide-react";

interface ViewOnMapButtonProps {
  address: string;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  label: string;
  /** iframe 임베드 지도 포함 여부 (기본값: false) */
  showEmbed?: boolean;
}

export function ViewOnMapButton({
  address,
  googleMapsUrl,
  latitude,
  longitude,
  label,
  showEmbed = false,
}: ViewOnMapButtonProps) {
  const hasCoords = latitude != null && longitude != null;

  const mapsUrl =
    googleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);

  const embedUrl = showEmbed && hasCoords
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&output=embed&hl=ko`
    : null;

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
      {embedUrl && (
        <iframe
          src={embedUrl}
          width="100%"
          height="200"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="salon location map"
        />
      )}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary-600 hover:bg-gray-50"
        style={embedUrl ? { borderTop: "1px solid #f3f4f6" } : undefined}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {label}
      </a>
    </div>
  );
}
