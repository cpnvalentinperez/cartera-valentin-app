import { cerrarMes } from '../utils/movimientos'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    return await cerrarMes(Number(body.tcDolar) || 0)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
