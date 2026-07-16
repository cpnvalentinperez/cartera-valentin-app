import { registrarOperacion } from '../../utils/movimientos'

export default defineEventHandler(async (event) => {
  const payload = await readBody(event)
  try {
    return await registrarOperacion(payload)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
