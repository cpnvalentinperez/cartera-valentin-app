// server/api/inversiones/index.post.ts
import { registrarOperacionInversion } from '../../utils/inversiones'
import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  const payload = await readBody(event)
  try {
    return await registrarOperacionInversion(payload)
  } catch (err: any) {
    const msg = err instanceof ZodError ? err.errors[0].message : err.message
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})