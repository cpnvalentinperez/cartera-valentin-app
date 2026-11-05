import { recalcularSaldos } from '../../utils/movimientos'

/** Reconstruye la caché J:L desde los deltas. Úsalo tras editar el Sheet a mano. */
export default defineEventHandler(async () => {
  try {
    return (await recalcularSaldos()) ?? { ok: true, filas: 0 }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
