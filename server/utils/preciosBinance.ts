// api.binance.com bloquea por geolocalización (451) las IPs de las regiones donde corre Vercel.
// data-api.binance.vision es el espejo público de solo datos de mercado spot que Binance
// ofrece sin ese bloqueo geográfico.
const ENDPOINTS = [
  'https://data-api.binance.vision/api/v3/ticker/price',
  'https://api.binance.com/api/v3/ticker/price'
]

export async function getPreciosActuales(): Promise<Map<string, number>> {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Binance respondió ${res.status}`)
      const data: { symbol: string; price: string }[] = await res.json()
      return new Map(data.map(d => [d.symbol, Number(d.price)]))
    } catch (err: any) {
      console.error(`No se pudo obtener precios de Binance (${url}):`, err.message)
    }
  }
  return new Map()
}