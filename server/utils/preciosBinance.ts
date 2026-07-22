export async function getPreciosActuales(): Promise<Map<string, number>> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price')
    if (!res.ok) throw new Error(`Binance respondió ${res.status}`)
    const data: { symbol: string; price: string }[] = await res.json()
    return new Map(data.map(d => [d.symbol, Number(d.price)]))
  } catch (err: any) {
    console.error('No se pudo obtener precios de Binance:', err.message)
    return new Map()
  }
}