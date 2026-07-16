import { getResumenExtendido } from '../utils/movimientos'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tcDolar = Number(query.tcDolar) || 0
  return await getResumenExtendido(tcDolar)
})
