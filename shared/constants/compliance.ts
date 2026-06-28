export const LINE_LENGTH_FPERSV_MAX_KM = 50

export const COMPLIANCE_PROFILES = ['STANDARD_561_2006', 'LINE_50KM_FPERSV'] as const
export type ComplianceProfile = (typeof COMPLIANCE_PROFILES)[number]

export const COMPLIANCE_PROFILE_LABELS: Record<ComplianceProfile, string> = {
  STANDARD_561_2006: 'VO 561/2006',
  LINE_50KM_FPERSV: 'Linien ≤50 km (FPersV)',
}

export function resolveComplianceProfile(
  tourType: 'line' | 'excursion',
  lineLengthKm: number | null,
): ComplianceProfile {
  if (tourType === 'line' && lineLengthKm !== null && lineLengthKm <= LINE_LENGTH_FPERSV_MAX_KM) {
    return 'LINE_50KM_FPERSV'
  }
  return 'STANDARD_561_2006'
}
