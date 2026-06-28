import type { PublicTour } from './tours'

export type DriverTourVehicle = {
  id: string
  plateNumber: string
  name: string
  seats: number
} | null

export type DriverTour = PublicTour & {
  vehicle: DriverTourVehicle
}
