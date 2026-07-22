// server/api/inversiones/index.get.ts
import { getCarteraCompleta } from '../../utils/inversiones'

export default defineEventHandler(async () => {
  return await getCarteraCompleta()
})