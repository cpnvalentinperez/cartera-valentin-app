import { eliminarMovimiento } from '../../utils/movimientos'

export default defineEventHandler(async (event) => {
  const rowIndex = Number(getRouterParam(event, 'rowIndex'))
  const query = getQuery(event)
  try {
    return await eliminarMovimiento(rowIndex, query.fecha as string | undefined)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
