import { editarMovimiento } from '../../utils/movimientos'

export default defineEventHandler(async (event) => {
  const rowIndex = Number(getRouterParam(event, 'rowIndex'))
  const payload = await readBody(event)
  try {
    return await editarMovimiento(rowIndex, payload, payload.fechaEsperada)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
