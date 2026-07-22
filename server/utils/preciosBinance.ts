export async function getPreciosActuales(): Promise<Map<string, number>> {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price')
  if (!res.ok) throw new Error('No se pudo obtener precios de Binance.')
  const data: { symbol: string; price: string }[] = await res.json()
  return new Map(data.map(d => [d.symbol, Number(d.price)]))
}