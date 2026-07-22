<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <div v-if="cargando" class="lbl">Cargando precios...</div>
    <div v-else-if="error" class="lbl" style="color:var(--danger);">{{ error }}</div>

    <template v-else>
      <input type="text" v-model="busqueda" placeholder="Buscar activo..." class="inp">

      <div style="display:flex; gap:8px; margin-top:10px;">
        <div class="op-btn" style="flex:1;" :class="{ selected: orden === 'nombre' }" @click="ordenarPor('nombre')">
          Nombre {{ orden === 'nombre' ? (dir === 1 ? '↑' : '↓') : '' }}
        </div>
        <div class="op-btn" style="flex:1;" :class="{ selected: orden === 'inversion' }" @click="ordenarPor('inversion')">
          Inversión {{ orden === 'inversion' ? (dir === 1 ? '↑' : '↓') : '' }}
        </div>
      </div>

      <div v-if="!carteraOrdenada.length" class="lbl" style="margin-top:16px;">Sin resultados.</div>

      <div v-for="c in carteraOrdenada" :key="c.asset" class="row">
        <div class="row-top">
          <span class="asset">{{ c.asset }}</span>
          <span class="precio">{{ c.precioActual !== null ? '$' + formatPrecio(c.precioActual) : '—' }}</span>
        </div>
        <div class="row-bottom">
          <span class="sub">Ud {{ formatCantidad(c.cantidad) }} · Total ${{ (c.inversionActual ?? c.inversion).toFixed(2) }}</span>
          <span v-if="c.variacion !== null" :style="{ color: c.variacion >= 0 ? 'var(--accent)' : 'var(--danger)' }">
            {{ c.variacion >= 0 ? '+' : '' }}{{ c.variacion.toFixed(1) }}%
          </span>
          <span v-else class="sub">sin precio</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const cartera = ref([])
const cargando = ref(true)
const error = ref('')
const busqueda = ref('')
const orden = ref('inversion')
const dir = ref(-1)

function ordenarPor(criterio) {
  if (orden.value === criterio) {
    dir.value *= -1
  } else {
    orden.value = criterio
    dir.value = criterio === 'nombre' ? 1 : -1
  }
}

function formatCantidad(n) {
  return parseFloat(n.toFixed(4)).toString()
}

function formatPrecio(n) {
  const decimales = n >= 1 ? 2 : 6
  return parseFloat(n.toFixed(decimales)).toString()
}

const carteraOrdenada = computed(() => {
  const q = busqueda.value.trim().toUpperCase()
  const filtrada = q
    ? cartera.value.filter(c => c.asset.toUpperCase().includes(q) || c.nombre.toUpperCase().includes(q))
    : cartera.value

  return [...filtrada].sort((a, b) => {
    if (orden.value === 'nombre') {
      return dir.value * a.nombre.localeCompare(b.nombre)
    }
    const valorA = a.inversionActual ?? a.inversion
    const valorB = b.inversionActual ?? b.inversion
    return dir.value * (valorA - valorB)
  })
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    cartera.value = await $fetch('/api/inversiones')
  } catch (err) {
    error.value = err.data?.statusMessage || 'No se pudo cargar la cartera.'
  } finally {
    cargando.value = false
  }
}
cargar()
</script>

<style scoped>
.row { padding:12px 0; border-bottom:1px solid var(--border); }
.row:last-child { border-bottom:none; }
.row-top { display:flex; justify-content:space-between; align-items:baseline; }
.row-bottom { display:flex; justify-content:space-between; align-items:baseline; margin-top:4px; }
.asset { font-weight:700; font-size:18px; }
.precio { font-weight:700; font-size:18px; }
.lbl { font-size:13px; color:var(--muted); }
.sub { font-size:13px; color:var(--muted); }
.inp { width:100%; padding:12px; font-size:16px; border-radius:10px; border:1px solid var(--border); background:#12141a; color:var(--text); }
.op-btn { padding:10px 8px; border-radius:10px; border:1px solid var(--border); background:#12141a; color:var(--text); font-size:13px; text-align:center; }
.op-btn.selected { border-color:var(--accent); background:rgba(74,222,128,0.12); color:var(--accent); }
</style>
