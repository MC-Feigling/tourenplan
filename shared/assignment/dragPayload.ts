export const ASSIGNMENT_DRAG_MIME = 'application/x-tourenplan-assignment'

export type AssignmentDragKind = 'driver' | 'vehicle'

export type AssignmentDragPayload = {
  kind: AssignmentDragKind
  id: string
  label: string
  tourId?: string
}

export function serializeDragPayload(payload: AssignmentDragPayload): string {
  return JSON.stringify(payload)
}

export function parseDragPayload(data: string): AssignmentDragPayload | null {
  try {
    const parsed = JSON.parse(data) as AssignmentDragPayload
    if (parsed.kind !== 'driver' && parsed.kind !== 'vehicle') return null
    if (typeof parsed.id !== 'string' || typeof parsed.label !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function readDragPayload(event: DragEvent): AssignmentDragPayload | null {
  const raw = event.dataTransfer?.getData(ASSIGNMENT_DRAG_MIME)
  if (!raw) return null
  return parseDragPayload(raw)
}

export function setDragPayload(event: DragEvent, payload: AssignmentDragPayload): void {
  event.dataTransfer?.setData(ASSIGNMENT_DRAG_MIME, serializeDragPayload(payload))
  event.dataTransfer!.effectAllowed = 'move'
}
