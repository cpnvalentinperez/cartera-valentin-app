import { setSaldoInicial } from '../utils/movimientos'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    return await setSaldoInicial(Number(body.pesos) || 0, Number(body.dolares) || 0, Number(body.crypto) || 0)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
