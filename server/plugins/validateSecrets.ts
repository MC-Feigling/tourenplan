import {
  assertJwtSecret,
  assertProductionBootstrapConfig,
} from '../../shared/auth/secrets'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const isProduction = process.env.NODE_ENV === 'production'
  assertJwtSecret(config.jwtSecret, isProduction)
  assertProductionBootstrapConfig(config.bootstrapAdminPassword, isProduction)
})
