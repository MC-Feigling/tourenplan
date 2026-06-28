import { describe, expect, it } from 'vitest'
import { canDriverTransitionStatus } from './driver'

describe('canDriverTransitionStatus', () => {
  it('allows assigned to active', () => {
    expect(canDriverTransitionStatus('assigned', 'active')).toBe(true)
  })

  it('allows active to completed', () => {
    expect(canDriverTransitionStatus('active', 'completed')).toBe(true)
  })

  it('blocks completed to active', () => {
    expect(canDriverTransitionStatus('completed', 'active')).toBe(false)
  })

  it('blocks draft transitions', () => {
    expect(canDriverTransitionStatus('draft', 'active')).toBe(false)
  })
})
