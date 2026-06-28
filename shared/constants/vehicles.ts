export const VEHICLE_CLASSES = ['coach', 'midibus', 'minibus'] as const
export type VehicleClass = (typeof VEHICLE_CLASSES)[number]

export const VEHICLE_STATUSES = ['available', 'maintenance', 'out_of_service'] as const
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export const TACHO_TYPES = ['none', 'digital', 'smart_v2'] as const
export type TachoType = (typeof TACHO_TYPES)[number]

export const VEHICLE_FEATURES = ['toilet', 'wifi', 'wheelchair', 'usb'] as const
export type VehicleFeature = (typeof VEHICLE_FEATURES)[number]

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  coach: 'Reisebus',
  midibus: 'Midibus',
  minibus: 'Kleinbus',
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: 'Verfügbar',
  maintenance: 'Werkstatt',
  out_of_service: 'Außer Betrieb',
}

export const TACHO_TYPE_LABELS: Record<TachoType, string> = {
  none: 'Keiner',
  digital: 'Digital',
  smart_v2: 'Smart v2',
}

export const VEHICLE_FEATURE_LABELS: Record<VehicleFeature, string> = {
  toilet: 'WC',
  wifi: 'WLAN',
  wheelchair: 'Rollstuhl',
  usb: 'USB',
}

export const PASSENGER_TACHO_THRESHOLD = 9
