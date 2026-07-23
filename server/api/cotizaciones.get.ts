import { getCotizaciones } from '../utils/cotizaciones'

export default defineEventHandler(async () => {
  return await getCotizaciones()
})
