import { getValues, updateValues, batchUpdateValues, appendValues, deleteRow, ensureSheetExists } from './sheetsClient'
import {
  SHEET_MOVIMIENTOS, SHEET_BALANCE, SHEET_SNAPSHOTS, HEADERS,
  MESES, BALANCE_COL_GANANCIA_MES, BALANCE_COL_SALDO, ULTIMO_MES_CERRADO_BALANCE, COTIZACION_CRYPTO_USD,
  calcularDeltas, type PayloadOperacion
} from './logic'

interface HistoricoGanancia { mes: string, ganancia: number, saldo: number | null, origen: string }

/**
 * Lee TODA la hoja Movimientos (A2:L) en una sola llamada. Se usa como base
 * para registrar, resumir y listar, en vez de hacer una llamada separada por dato.
 * Si la hoja no existe todavía, devuelve [] en vez de tirar error.
 */
async function leerMovimientosCompleto(): Promise<any[][]> {
  try {
    return await getValues(`${SHEET_MOVIMIENTOS}!A2:L`)
  } catch {
    return []
  }
}

function esFilaSaldoInicial(filas: any[][]): boolean {
  return filas.length > 0 && filas[0][1] === 'Saldo Inicial'
}

export async function registrarOperacion(payload: PayloadOperacion) {
  const calc = calcularDeltas(payload)
  const fecha = new Date().toISOString()

  const filas = await leerMovimientosCompleto()
  if (filas.length === 0) {
    await ensureSheetExists(SHEET_MOVIMIENTOS, HEADERS)
  }

  const ultima = filas[filas.length - 1]
  const saldoPesosAnterior = ultima ? (Number(ultima[9]) || 0) : 0
  const saldoDolaresAnterior = ultima ? (Number(ultima[10]) || 0) : 0
  const saldoCryptoAnterior = ultima ? (Number(ultima[11]) || 0) : 0

  const saldoPesos = saldoPesosAnterior + calc.deltaPesos
  const saldoDolares = saldoDolaresAnterior + calc.deltaDolares
  const saldoCrypto = saldoCryptoAnterior + calc.deltaCrypto

  await appendValues(SHEET_MOVIMIENTOS, [
    fecha, payload.operacion, payload.detalle || '', calc.cantidad, calc.tc || '', calc.monedaGuardada,
    calc.deltaPesos || '', calc.deltaDolares || '', calc.deltaCrypto || '',
    saldoPesos, saldoDolares, saldoCrypto
  ])

  return { ok: true, mensaje: 'Cargado.', saldoPesos, saldoDolares, saldoCrypto }
}

export async function getResumen() {
  const filas = await leerMovimientosCompleto()
  if (filas.length === 0) {
    return { saldoPesos: 0, saldoDolares: 0, saldoCrypto: 0, tieneSaldoInicial: false }
  }
  const ultima = filas[filas.length - 1]
  return {
    saldoPesos: Number(ultima[9]) || 0,
    saldoDolares: Number(ultima[10]) || 0,
    saldoCrypto: Number(ultima[11]) || 0,
    tieneSaldoInicial: esFilaSaldoInicial(filas)
  }
}

export async function setSaldoInicial(pesos: number, dolares: number, crypto: number) {
  const filas = await leerMovimientosCompleto()
  if (filas.length === 0) {
    await ensureSheetExists(SHEET_MOVIMIENTOS, HEADERS)
  }

  const yaTieneSaldoInicial = esFilaSaldoInicial(filas)
  const yaTieneMovimientos = filas.length > (yaTieneSaldoInicial ? 1 : 0)

  if (yaTieneMovimientos) {
    throw new Error('Ya cargaste movimientos reales, no se puede modificar el saldo inicial desde acá.')
  }

  const fecha = new Date().toISOString()
  const fila = [fecha, 'Saldo Inicial', 'Saldo inicial', '', '', 'Ambos', pesos, dolares, crypto, pesos, dolares, crypto]
  await updateValues(`${SHEET_MOVIMIENTOS}!A2:L2`, [fila])

  return { ok: true, saldoPesos: pesos, saldoDolares: dolares, saldoCrypto: crypto }
}

export async function getMovimientosRecientes(limite = 20) {
  const filas = await leerMovimientosCompleto()
  if (filas.length === 0) return []

  const saltarPrimera = esFilaSaldoInicial(filas)
  const datos = saltarPrimera ? filas.slice(1) : filas
  const offsetFila = saltarPrimera ? 3 : 2 // fila real (1-indexada) de datos[0]

  const resultado: any[] = []
  for (let i = datos.length - 1; i >= 0; i--) {
    const fila = datos[i]
    resultado.push({
      rowIndex: offsetFila + i,
      fecha: fila[0],
      operacion: fila[1],
      detalle: fila[2],
      cantidad: fila[3],
      tc: fila[4],
      moneda: fila[5],
      deltaPesos: fila[6],
      deltaDolares: fila[7],
      deltaCrypto: fila[8]
    })
    if (resultado.length >= limite) break
  }
  return resultado
}

export async function eliminarMovimiento(rowIndex: number) {
  const filas = await leerMovimientosCompleto()
  if (esFilaSaldoInicial(filas) && rowIndex === 2) {
    throw new Error('El saldo inicial no se borra desde acá.')
  }
  await deleteRow(SHEET_MOVIMIENTOS, rowIndex)
  await recalcularSaldos()
  return { ok: true }
}

/**
 * Sobrescribe directamente los deltas (Pesos/Dolares/Crypto) de una fila, sin pasar
 * por calcularDeltas. Se usa para correcciones puntuales que no encajan en el flujo
 * normal de operación. No toca Fecha/Tipo/Detalle/Cantidad/TC/Moneda.
 *
 * Escribe los deltas nuevos y los saldos recalculados en UNA sola llamada batch:
 * si se hiciera en dos pasos (escribir deltas, después leer todo de nuevo y
 * recalcular saldos por separado) una falla a mitad de camino deja los deltas
 * actualizados pero los saldos desincronizados con ellos.
 */
export async function ajustarDeltas(rowIndex: number, deltaPesos: number, deltaDolares: number, deltaCrypto: number) {
  const filas = await leerMovimientosCompleto()
  if (esFilaSaldoInicial(filas) && rowIndex === 2) {
    throw new Error('El saldo inicial se edita desde la pestaña Saldo inicial.')
  }

  const idx = rowIndex - 2
  if (idx < 0 || idx >= filas.length) {
    throw new Error('Movimiento no encontrado.')
  }
  filas[idx] = [...filas[idx]]
  filas[idx][6] = deltaPesos
  filas[idx][7] = deltaDolares
  filas[idx][8] = deltaCrypto

  const saldos: number[][] = []
  let acumPesos = 0, acumDolares = 0, acumCrypto = 0
  for (const fila of filas) {
    acumPesos += Number(fila[6]) || 0
    acumDolares += Number(fila[7]) || 0
    acumCrypto += Number(fila[8]) || 0
    saldos.push([acumPesos, acumDolares, acumCrypto])
  }

  await batchUpdateValues([
    { range: `${SHEET_MOVIMIENTOS}!G${rowIndex}:I${rowIndex}`, values: [[deltaPesos || '', deltaDolares || '', deltaCrypto || '']] },
    { range: `${SHEET_MOVIMIENTOS}!J2:L${1 + saldos.length}`, values: saldos }
  ])

  return await getResumen()
}

export async function editarMovimiento(rowIndex: number, payload: PayloadOperacion) {
  const filas = await leerMovimientosCompleto()
  if (esFilaSaldoInicial(filas) && rowIndex === 2) {
    throw new Error('El saldo inicial se edita desde la pestaña Saldo inicial.')
  }

  const calc = calcularDeltas(payload)
  const fechaOriginal = filas[rowIndex - 2]?.[0]

  await updateValues(`${SHEET_MOVIMIENTOS}!A${rowIndex}:I${rowIndex}`, [[
    fechaOriginal, payload.operacion, payload.detalle || '', calc.cantidad, calc.tc || '',
    calc.monedaGuardada, calc.deltaPesos || '', calc.deltaDolares || '', calc.deltaCrypto || ''
  ]])

  await recalcularSaldos()
  return { ok: true }
}

export async function recalcularSaldos() {
  const filas = await leerMovimientosCompleto()
  if (filas.length === 0) return

  const saldos: number[][] = []
  let acumPesos = 0, acumDolares = 0, acumCrypto = 0

  for (const fila of filas) {
    acumPesos += Number(fila[6]) || 0
    acumDolares += Number(fila[7]) || 0
    acumCrypto += Number(fila[8]) || 0
    saldos.push([acumPesos, acumDolares, acumCrypto])
  }

  await updateValues(`${SHEET_MOVIMIENTOS}!J2:L${1 + saldos.length}`, saldos)
}

/**
 * Histórico de Ganancia/Pérdida mensual leído de la hoja Balance vieja (columna K),
 * en UNA sola llamada (rango K4:K28) en vez de una llamada por mes.
 * Solo lectura, nunca se escribe ahí.
 */
export async function getHistoricoGanancias(): Promise<HistoricoGanancia[]> {
  const colK = String.fromCharCode(64 + BALANCE_COL_GANANCIA_MES) // K
  const colH = String.fromCharCode(64 + BALANCE_COL_SALDO) // H
  const primeraFila = 4
  const ultimaFila = ULTIMO_MES_CERRADO_BALANCE * 4 // Junio = 24, último mes cerrado antes de Movimientos

  let valoresK: any[][] = [], valoresH: any[][] = []
  try {
    valoresK = await getValues(`${SHEET_BALANCE}!${colK}${primeraFila}:${colK}${ultimaFila}`)
    valoresH = await getValues(`${SHEET_BALANCE}!${colH}${primeraFila}:${colH}${ultimaFila}`)
  } catch {
    return []
  }

  const resultado: HistoricoGanancia[] = []
  for (let i = 0; i < ULTIMO_MES_CERRADO_BALANCE; i++) {
    const indiceRelativo = i * 4 // fila (i+1)*4, offset desde primeraFila=4
    const ganancia = valoresK[indiceRelativo]?.[0]
    const saldo = valoresH[indiceRelativo]?.[0]
    if (ganancia !== undefined && ganancia !== '') {
      resultado.push({
        mes: MESES[i],
        ganancia: Number(ganancia),
        saldo: (saldo !== undefined && saldo !== '') ? Number(saldo) : null,
        origen: 'Balance'
      })
    }
  }
  return resultado
}

/**
 * Lee toda la hoja Snapshots de una vez (si existe) y devuelve tanto el último
 * valor guardado como la suma de ganancias del año en curso, para no repetir
 * la misma lectura dos veces.
 */
async function leerSnapshots(): Promise<{ ultimoValor: number | null, sumaAnioActual: number, lista: { mes: string, anio: number, valorTotalUSD: number, ganancia: number | null }[] }> {
  let filas: any[][] = []
  try {
    filas = await getValues(`${SHEET_SNAPSHOTS}!A2:E`)
  } catch {
    filas = []
  }

  if (filas.length === 0) {
    const colH = String.fromCharCode(64 + BALANCE_COL_SALDO) // H
    const filaJunio = ULTIMO_MES_CERRADO_BALANCE * 4
    let valorJulio: any[][] = []
    try {
      valorJulio = await getValues(`${SHEET_BALANCE}!${colH}${filaJunio}:${colH}${filaJunio}`)
    } catch {
      valorJulio = []
    }
    const valor = valorJulio[0]?.[0]
    return { ultimoValor: (valor !== undefined && valor !== '') ? Number(valor) : null, sumaAnioActual: 0, lista: [] }
  }

  const anioActual = new Date().getFullYear()
  let sumaAnioActual = 0
  const lista: { mes: string, anio: number, valorTotalUSD: number, ganancia: number | null }[] = []

  for (const fila of filas) {
    const anio = Number(fila[2])
    const ganancia = fila[4]
    if (anio === anioActual && ganancia !== undefined && ganancia !== '') {
      sumaAnioActual += Number(ganancia) || 0
    }
    lista.push({
      mes: fila[1],
      anio,
      valorTotalUSD: Number(fila[3]) || 0,
      ganancia: (ganancia !== undefined && ganancia !== '') ? Number(ganancia) : null
    })
  }

  const ultimaFila = filas[filas.length - 1]
  const ultimoValor = Number(ultimaFila[3]) || 0

  return { ultimoValor, sumaAnioActual, lista }
}


export async function getResumenExtendido(tcDolar: number) {
  const base = await getResumen()
  const tc = Number(tcDolar) || 0

  const valorPesosUSD = tc > 0 ? base.saldoPesos / tc : 0
  const valorDolaresUSD = base.saldoDolares
  const valorCryptoUSD = base.saldoCrypto * COTIZACION_CRYPTO_USD
  const totalUSD = valorPesosUSD + valorDolaresUSD + valorCryptoUSD

  const porcentajes = totalUSD > 0 ? {
    pesos: (valorPesosUSD / totalUSD) * 100,
    dolares: (valorDolaresUSD / totalUSD) * 100,
    crypto: (valorCryptoUSD / totalUSD) * 100
  } : { pesos: 0, dolares: 0, crypto: 0 }

  const historicoGanancias = await getHistoricoGanancias()
  const { ultimoValor, sumaAnioActual, lista: snapshots } = await leerSnapshots()
  const totalHistorico = historicoGanancias.reduce((acc, h) => acc + (Number(h.ganancia) || 0), 0)

  const ahora = new Date()
  const mesActualNombre = MESES[ahora.getMonth()]
  const anioActual = ahora.getFullYear()
  const mesYaCerrado = snapshots.some(s => s.mes === mesActualNombre && s.anio === anioActual)

  const mesEnCurso = (!mesYaCerrado && ultimoValor !== null) ? {
    mes: mesActualNombre,
    ganancia: totalUSD - ultimoValor,
    saldo: totalUSD
  } : null

  return {
    saldoPesos: base.saldoPesos,
    saldoDolares: base.saldoDolares,
    saldoCrypto: base.saldoCrypto,
    tieneSaldoInicial: base.tieneSaldoInicial,
    valorTotalUSD: totalUSD,
    porcentajes,
    historicoGanancias,
    mesEnCurso,
    snapshots,
    gananciaAnualTotal: totalHistorico + sumaAnioActual + (mesEnCurso ? mesEnCurso.ganancia : 0)
  }
}

export async function cerrarMes(tcDolar: number) {
  const resumen = await getResumenExtendido(tcDolar)
  const { ultimoValor } = await leerSnapshots()
  await ensureSheetExists(SHEET_SNAPSHOTS, ['Fecha', 'Mes', 'Año', 'Valor Total USD', 'Ganancia vs mes anterior'])

  const ganancia = ultimoValor !== null ? resumen.valorTotalUSD - ultimoValor : null

  const ahora = new Date()
  const mesNombre = MESES[ahora.getMonth()]
  await appendValues(SHEET_SNAPSHOTS, [ahora.toISOString(), mesNombre, ahora.getFullYear(), resumen.valorTotalUSD, ganancia])

  return { ok: true, valorTotalUSD: resumen.valorTotalUSD, ganancia, mes: mesNombre }
}
