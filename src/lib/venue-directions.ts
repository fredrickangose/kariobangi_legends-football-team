export const HOME_GROUND = {
  name: "Kariobangi North Ground",
  landmark: "Near Kariobangi Police Station",
  constituency: "Embakasi North Constituency",
  city: "Nairobi",
  country: "Kenya",
  fullAddress:
    "Kariobangi North Ground, near Kariobangi Police Station, Embakasi North Constituency, Nairobi, Kenya",
} as const;

export function isClubHomeVenue(venue: string): boolean {
  const normalized = venue.trim().toLowerCase();
  return (
    normalized.includes("kariobangi north") ||
    normalized.includes("kariobangi north ground")
  );
}

export function getDirectionsDestination(venue?: string | null): string {
  const trimmed = venue?.trim();
  if (trimmed && isClubHomeVenue(trimmed)) {
    return HOME_GROUND.fullAddress;
  }
  if (trimmed) {
    return trimmed;
  }
  return HOME_GROUND.fullAddress;
}

/** Opens Google Maps turn-by-turn directions in a new tab (no API key required). */
export function getGoogleDirectionsUrl(venue?: string | null): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    getDirectionsDestination(venue)
  )}`;
}

/** Opens the venue on Google Maps. */
export function getGoogleMapsViewUrl(venue?: string | null): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getDirectionsDestination(venue)
  )}`;
}
