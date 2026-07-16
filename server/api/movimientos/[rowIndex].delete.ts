import { eliminarMovimiento } from '../../utils/movimientos'

export default defineEventHandler(async (event) => {
  const rowIndex = Number(getRouterParam(event, 'rowIndex'))
  try {
    return await eliminarMovimiento(rowIndex)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
