import type { UserRole } from '~/shared/constants/roles'

declare module '#app' {
  interface PageMeta {
    roles?: UserRole[]
  }
}

export {}
