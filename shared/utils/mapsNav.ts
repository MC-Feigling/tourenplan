export type MapsNavInput = {
  lat: number | string | null | undefined
  lng: number | string | null | undefined
  address?: string | null
}

function hasCoord(value: number | string | null | undefined): value is number | string {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return Number.isFinite(value)
  return value.trim() !== '' && Number.isFinite(Number(value))
}

export function buildMapsNavUrl(input: MapsNavInput): string | null {
  if (hasCoord(input.lat) && hasCoord(input.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${input.lat},${input.lng}`
  }
  const address = input.address?.trim() ?? ''
  if (!address) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}
