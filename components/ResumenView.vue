<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <div class="row">
      <div class="lbl">Saldo Pesos</div>
      <div style="text-align:right;">
        <div class="val">${{ formatear(resumen.saldoPesos) }}</div>
        <div class="sub">{{ resumen.porcentajes ? formatear(resumen.porcentajes.pesos) + '%' : '-' }}</div>
      </div>
    </div>
    <div class="row">
      <div class="lbl">Saldo Dólares</div>
      <div style="text-align:right;">
        <div class="val">US${{ formatear(resumen.saldoDolares) }}</div>
        <div class="sub">{{ resumen.porcentajes ? formatear(resumen.porcentajes.dolares) + '%' : '-' }}</div>
      </div>
    </div>
    <div class="row">
      <div class="lbl">Saldo Crypto (unidades)</div>
      <div style="text-align:right;">
        <div class="val">{{ formatear(resumen.saldoCrypto) }}</div>
        <div class="sub">{{ resumen.porcentajes ? formatear(resumen.porcentajes.crypto) + '%' : '-' }}</div>
      </div>
    </div>

    <label class="lbl">TC Dólar (ARS por USD)</label>
    <input type="number" inputmode="decimal" v-model="tcDolar" placeholder="Ej: 1510" class="inp">
    <button class="submit" style="margin-top:14px;" @click="calcular">Calcular</button>

    <div class="row" style="margin-top:8px;">
      <div class="lbl">Valor total (USD)</div>
      <div class="val">{{ resumen.valorTotalUSD !== undefined ? 'US$' + formatear(resumen.valorTotalUSD) : '-' }}</div>
    </div>

    <label class="lbl" style="margin-top:20px;">Ganancia/Pérdida mensual</label>
    <div v-for="h in resumen.historicoGanancias || []" :key="h.mes" class="row">
      <div class="lbl">{{ h.mes }}</div>
      <div>{{ h.ganancia >= 0 ? '+' : '' }}{{ formatear(h.ganancia) }}</div>
    </div>
    <div class="row">
      <div class="lbl">Total del año</div>
      <div class="val">{{ resumen.gananciaAnualTotal !== undefined ? (resumen.gananciaAnualTotal >= 0 ? '+' : '') + formatear(resumen.gananciaAnualTotal) : '-' }}</div>
    </div>

    <button class="submit" style="background:var(--accent-dark);" @click="cerrarMes">Cerrar mes</button>
    <div v-if="msg" :class="msgTipo" style="margin-top:14px; padding:12px; border-radius:10px; font-size:14px;">{{ msg }}</div>
  </div>
</template>

<script setup>
const resumen = ref({})
const tcDolar = ref('')
const msg = ref('')
const msgTipo = ref('ok')

function formatear(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

async function calcular() {
  resumen.value = await $fetch('/api/resumen', { query: { tcDolar: tcDolar.value || 0 } })
}
calcular()

async function cerrarMes() {
  if (!tcDolar.value) {
    msg.value = 'Cargá el TC Dólar antes de cerrar el mes.'
    msgTipo.value = 'error'
    return
  }
  if (!confirm('¿Cerrar el mes con estos valores? Queda guardado como referencia para el próximo cierre.')) return

  try {
    const res = await $fetch('/api/cerrar-mes', { method: 'POST', body: { tcDolar: tcDolar.value } })
    msg.value = `Mes cerrado: ${res.mes}. Valor total US$${formatear(res.valorTotalUSD)}` +
      (res.ganancia !== null ? ` | G/P: ${res.ganancia >= 0 ? '+' : ''}${formatear(res.ganancia)}` : '')
    msgTipo.value = 'ok'
    await calcular()
  } catch (err) {
    msg.value = err.data?.statusMessage || 'Error al cerrar el mes.'
    msgTipo.value = 'error'
  }
}
</script>

<style scoped>
.row { display:flex; justify-content:space-between; align-items:baseline; padding:14px 0; border-bottom:1px solid var(--border); }
.row:last-child { border-bottom:none; }
.lbl { font-size:13px; color:var(--muted); }
.val { font-size:20px; font-weight:600; }
.sub { font-size:12px; color:var(--muted); margin-top:2px; }
.inp { width:100%; padding:12px; font-size:16px; border-radius:10px; border:1px solid var(--border); background:#12141a; color:var(--text); }
.submit { width:100%; margin-top:22px; padding:16px; border:none; border-radius:12px; background:var(--accent-dark); color:white; font-size:16px; font-weight:600; }
.ok { background:rgba(74,222,128,0.12); color:var(--accent); }
.error { background:rgba(248,113,113,0.12); color:var(--danger); }
</style>
