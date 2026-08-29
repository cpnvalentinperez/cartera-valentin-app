export const SHEET_MOVIMIENTOS = 'Movimientos'
export const SHEET_BALANCE = 'Balance' // hoja vieja, SOLO LECTURA — histórico Enero-Junio
export const SHEET_SNAPSHOTS = 'Snapshots'

export const HEADERS = [
  'Fecha', 'Tipo', 'Detalle', 'Cantidad', 'Precio/TC', 'Moneda',
  'Delta Pesos', 'Delta Dolares', 'Delta Crypto',
  'Saldo Pesos', 'Saldo Dolares', 'Saldo Crypto'
]

export const TIPOS_DOBLES = ['Compra Dolar', 'Venta Dolar']
export const TIPOS_CRYPTO = ['Compra Crypto', 'Venta Crypto']
export const TIPOS_SIMPLES = ['Compra Crypto', 'Venta Crypto', 'Ingresos', 'Retiros']
export const TIPOS_CRYPTO_DIRECTO = ['Ingreso Crypto', 'Retiro Crypto']

export const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
export const BALANCE_COL_GANANCIA_MES = 11 // columna K
export const BALANCE_COL_SALDO = 8 // columna H
export const COTIZACION_CRYPTO_USD = 1 // USDT, stablecoin 1:1 con USD

export interface PayloadOperacion {
  operacion: string
  detalle?: string
  cantidad: number | string
  tc?: number | string
  moneda?: 'Pesos' | 'Dolares'
  montoTotal?: number | string
}

export interface Deltas {
  cantidad: number
  tc: number
  monedaGuardada: string
  deltaPesos: number
  deltaDolares: number
  deltaCrypto: number
}

/**
 * Valida el payload de una operación y calcula los deltas (Pesos/Dolares/Crypto).
 * Misma lógica exacta que calcularDeltas_ en Apps Script.
 */
export function calcularDeltas(payload: PayloadOperacion): Deltas {
  const cantidad = Number(payload.cantidad)
  if (!payload.operacion) throw new Error('Falta seleccionar la operación.')
  if (isNaN(cantidad) || cantidad <= 0) throw new Error('Cantidad inválida.')

  let deltaPesos = 0, deltaDolares = 0, deltaCrypto = 0, monedaGuardada = 'Ambos', tc = 0

  if (payload.operacion === 'Compra Dolar' || payload.operacion === 'Venta Dolar') {
    tc = Number(payload.tc)
    if (isNaN(tc) || tc <= 0) throw new Error('TC inválido.')
    const esCompra = payload.operacion === 'Compra Dolar'
    deltaDolares = esCompra ? cantidad : -cantidad
    deltaPesos = esCompra ? -(cantidad * tc) : (cantidad * tc)

  } else if (TIPOS_SIMPLES.indexOf(payload.operacion) !== -1) {
    if (payload.moneda !== 'Pesos' && payload.moneda !== 'Dolares') {
      throw new Error('Falta indicar en qué moneda fue la operación.')
    }
    monedaGuardada = payload.moneda

    if (TIPOS_CRYPTO.indexOf(payload.operacion) !== -1) {
      const esCompra = payload.operacion === 'Compra Crypto'

      if (payload.moneda === 'Pesos') {
        tc = Number(payload.tc)
        if (isNaN(tc) || tc <= 0) throw new Error('Precio unitario inválido.')
        let monto = cantidad * tc
        if (payload.montoTotal !== undefined && payload.montoTotal !== null && payload.montoTotal !== '') {
          const montoManual = Number(payload.montoTotal)
          if (isNaN(montoManual) || montoManual <= 0) throw new Error('Importe total inválido.')
          monto = montoManual
        }
        deltaCrypto = esCompra ? cantidad : -cantidad
        deltaPesos = esCompra ? -monto : monto
      } else {
        tc = Number(payload.tc)
        if (isNaN(tc) || tc < 0 || tc >= 100) throw new Error('% inválido.')
        const cryptoCalculado = cantidad * (1 - tc / 100)
        deltaDolares = esCompra ? -cantidad : cantidad
        deltaCrypto = esCompra ? cryptoCalculado : -cryptoCalculado
      }
    } else {
      const esRetiro = payload.operacion === 'Retiros'
      if (payload.moneda === 'Pesos') {
        deltaPesos = esRetiro ? -cantidad : cantidad
      } else {
        deltaDolares = esRetiro ? -cantidad : cantidad
      }
    }
  } else if (TIPOS_CRYPTO_DIRECTO.indexOf(payload.operacion) !== -1) {
    monedaGuardada = 'Crypto'
    const esIngreso = payload.operacion === 'Ingreso Crypto'
    deltaCrypto = esIngreso ? cantidad : -cantidad

  } else {
    throw new Error('Operación no reconocida: ' + payload.operacion)
  }

  return { cantidad, tc, monedaGuardada, deltaPesos, deltaDolares, deltaCrypto }
}
