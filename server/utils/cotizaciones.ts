interface Cotizacion { compra: number | null; venta: number | null }

async function fetchDolarApi(casa: string): Promise<Cotizacion> {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${casa}`)
    if (!res.ok) throw new Error(`dolarapi ${casa} respondió ${res.status}`)
    const data = await res.json()
    return { compra: Number(data.compra) || null, venta: Number(data.venta) || null }
  } catch (err: any) {
    console.error(`No se pudo obtener cotización ${casa}:`, err.message)
    return { compra: null, venta: null }
  }
}

async function fetchUsdt(): Promise<Cotizacion> {
  try {
    const res = await fetch('https://criptoya.com/api/fiwind/usdt/ars/0.1')
    if (!res.ok) throw new Error(`criptoya respondió ${res.status}`)
    const data = await res.json()
    return { compra: Number(data.bid) || null, venta: Number(data.ask) || null }
  } catch (err: any) {
    console.error('No se pudo obtener cotización USDT:', err.message)
    return { compra: null, venta: null }
  }
}

export async function getCotizaciones() {
  const [usdt, oficial, blue] = await Promise.all([
    fetchUsdt(),
    fetchDolarApi('oficial'),
    fetchDolarApi('blue')
  ])
  return { usdt, oficial, blue }
}
