import { describe, expect, it } from 'vitest'
import { buildMapsNavUrl } from './mapsNav'

describe('buildMapsNavUrl', () => {
  it('prefers lat/lng over address', () => {
    expect(
      buildMapsNavUrl({ lat: 52.52, lng: 13.405, address: 'Berlin' }),
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=52.52,13.405')
  })

  it('uses address when coords missing', () => {
    expect(
      buildMapsNavUrl({ lat: null, lng: null, address: 'Hauptstr. 1, Berlin' }),
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Hauptstr.%201%2C%20Berlin',
    )
  })

  it('accepts string coords', () => {
    expect(
      buildMapsNavUrl({ lat: '48.1', lng: '11.5', address: '' }),
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=48.1,11.5')
  })

  it('returns null when empty', () => {
    expect(buildMapsNavUrl({ lat: null, lng: null, address: '  ' })).toBeNull()
    expect(buildMapsNavUrl({ lat: 52, lng: null, address: '' })).toBeNull()
  })
})
