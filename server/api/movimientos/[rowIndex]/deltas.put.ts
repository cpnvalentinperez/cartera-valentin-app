import { ajustarDeltas } from '../../../utils/movimientos'

export default defineEventHandler(async (event) => {
  const rowIndex = Number(getRouterParam(event, 'rowIndex'))
  const { deltaPesos, deltaDolares, deltaCrypto, fechaEsperada } = await readBody(event)
  try {
    return await ajustarDeltas(rowIndex, Number(deltaPesos) || 0, Number(deltaDolares) || 0, Number(deltaCrypto) || 0, fechaEsperada)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }
})
