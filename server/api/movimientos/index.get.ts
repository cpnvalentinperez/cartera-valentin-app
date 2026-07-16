import { getMovimientosRecientes } from '../../utils/movimientos'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limite = Number(query.limite) || 20
  return await getMovimientosRecientes(limite)
})
