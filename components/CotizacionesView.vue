<template>
  <div class="cotiz-box">
    <div class="cotiz-head">
      <span class="cotiz-title">Cotizaciones</span>
      <button class="cotiz-refresh" @click="cargar" :disabled="cargando">{{ cargando ? '...' : '↻' }}</button>
    </div>

    <div v-if="error" class="cotiz-error">{{ error }}</div>
    <template v-else>
      <div class="cotiz-row" v-for="c in items" :key="c.label">
        <span class="cotiz-lbl">{{ c.label }}</span>
        <span class="cotiz-vals">
          <span class="cotiz-val" @click="$emit('usar', c.compra)">C ${{ formatear(c.compra) }}</span>
          <span class="cotiz-val" @click="$emit('usar', c.venta)">V ${{ formatear(c.venta) }}</span>
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
defineEmits(['usar'])

const cargando = ref(false)
const error = ref('')
const cotizaciones = ref({ usdt: {}, oficial: {}, blue: {} })

const items = computed(() => [
  { label: 'USDT', compra: cotizaciones.value.usdt?.compra, venta: cotizaciones.value.usdt?.venta },
  { label: 'Dólar Oficial', compra: cotizaciones.value.oficial?.compra, venta: cotizaciones.value.oficial?.venta },
  { label: 'Dólar Blue', compra: cotizaciones.value.blue?.compra, venta: cotizaciones.value.blue?.venta }
])

function formatear(n) {
  return n !== null && n !== undefined ? Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 }) : '—'
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    cotizaciones.value = await $fetch('/api/cotizaciones')
  } catch (err) {
    error.value = 'No se pudieron cargar las cotizaciones.'
  } finally {
    cargando.value = false
  }
}
cargar()
</script>

<style scoped>
.cotiz-box { background:var(--card); border-radius:14px; padding:14px 18px; border:1px solid var(--border); margin-bottom:14px; }
.cotiz-head { display:flex; justify-content:space-between; align-items:center; }
.cotiz-title { font-size:13px; color:var(--muted); font-weight:600; }
.cotiz-refresh { background:none; border:none; color:var(--muted); font-size:15px; padding:2px 6px; }
.cotiz-row { display:flex; justify-content:space-between; align-items:baseline; padding:6px 0; border-top:1px solid var(--border); }
.cotiz-row:first-of-type { border-top:none; margin-top:6px; }
.cotiz-lbl { font-size:13px; }
.cotiz-vals { display:flex; gap:10px; }
.cotiz-val { font-size:13px; font-weight:600; color:var(--accent); cursor:pointer; }
.cotiz-error { font-size:12px; color:var(--danger); padding:6px 0; }
</style>
