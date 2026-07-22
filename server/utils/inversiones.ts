import { getValues, updateValues, appendValues } from './sheetsClient'
import { getPreciosActuales } from './preciosBinance'
import { z } from 'zod'

export const PayloadInversionSchema = z.object({
  asset: z.string().trim().min(1).transform(s => s.toUpperCase()),
  operacion: z.enum(['Compra', 'Venta']),
  cantidad: z.coerce.number().positive(),
  precio: z.coerce.number().positive()
})
export type PayloadInversion = z.infer<typeof PayloadInversionSchema>

const SHEET_INVERSIONES = 'Inversiones a Largo'
// Layout real: A Nombre | B Asset | C Cantidad | D PP | E Inversion
// | F Ultimo Precio | G (auxiliar, queda vacía) | H Inversion Actual | I Variacion
// De J en adelante es manual (Exchange, Estado) — jamás se toca.

interface FilaInversion { fila: number; nombre: string; cantidad: number; pp: number }

async function buscarAsset(asset: string): Promise<FilaInversion | null> {
  const filas = await getValues(`${SHEET_INVERSIONES}!A2:D`)
  const idx = filas.findIndex(f => (f[1] || '').toUpperCase() === asset)
  if (idx === -1) return null
  return {
    fila: idx + 2,
    nombre: filas[idx][0] || asset,
    cantidad: Number(filas[idx][2]) || 0,
    pp: Number(String(filas[idx][3]).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0
  }
}

export async function registrarOperacionInversion(payloadCrudo: unknown) {
  const { asset, operacion, cantidad, precio } = PayloadInversionSchema.parse(payloadCrudo)
  const existente = await buscarAsset(asset)

  let nuevaCantidad: number, nuevoPP: number, nombre: string

  if (!existente) {
    if (operacion === 'Venta') throw new Error(`No tenés posición abierta en ${asset}.`)
    nuevaCantidad = cantidad
    nuevoPP = precio
    nombre = asset
  } else {
    nombre = existente.nombre
    if (operacion === 'Compra') {
      nuevaCantidad = existente.cantidad + cantidad
      nuevoPP = (existente.cantidad * existente.pp + cantidad * precio) / nuevaCantidad
    } else {
      if (cantidad > existente.cantidad + 1e-9) {
        throw new Error(`No tenés ${cantidad} ${asset} para vender (tenés ${existente.cantidad}).`)
      }
      nuevaCantidad = existente.cantidad - cantidad
      nuevoPP = existente.pp
    }
  }

  const inversion = nuevaCantidad * nuevoPP
  const precios = await getPreciosActuales()
  const precioActual = precios.get(asset) ?? null
  const inversionActual = precioActual !== null ? nuevaCantidad * precioActual : null
  const variacion = precioActual !== null && nuevoPP > 0 ? ((precioActual - nuevoPP) / nuevoPP) * 100 : null

  if (!existente) {
    await appendValues(SHEET_INVERSIONES, [nombre, asset, nuevaCantidad, nuevoPP, inversion, precioActual ?? '', '', inversionActual ?? '', variacion ?? ''])
  } else {
    await updateValues(`${SHEET_INVERSIONES}!C${existente.fila}:I${existente.fila}`, [[
      nuevaCantidad, nuevoPP, inversion, precioActual ?? '', '', inversionActual ?? '', variacion ?? ''
    ]])
  }

  return { ok: true, asset, nombre, nuevaCantidad, nuevoPP, precioActual, variacion }
}

export async function getCarteraCompleta() {
  const filas = await getValues(`${SHEET_INVERSIONES}!A2:D`)
  const precios = await getPreciosActuales()

  return filas
    .filter(f => f[1])
    .map(f => {
      const asset = f[1]
      const cantidad = Number(f[2]) || 0
      const pp = Number(String(f[3]).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0
      const precioActual = precios.get(asset.toUpperCase()) ?? null
      const inversion = cantidad * pp
      const inversionActual = precioActual !== null ? cantidad * precioActual : null
      const variacion = precioActual !== null && pp > 0 ? ((precioActual - pp) / pp) * 100 : null
      return { nombre: f[0] || asset, asset, cantidad, pp, inversion, precioActual, inversionActual, variacion }
    })
    .sort((a, b) => (a.variacion ?? -Infinity) - (b.variacion ?? -Infinity))
}