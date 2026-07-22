<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <div v-if="cargando" class="lbl">Cargando precios...</div>
    <div v-for="c in cartera" :key="c.asset" class="row">
      <div>
        <div style="font-weight:600;">{{ c.asset }}</div>
        <div class="sub">{{ c.cantidad }} u. · PP ${{ c.pp.toFixed(4) }}</div>
      </div>
      <div style="text-align:right;">
        <div v-if="c.variacion !== null" :style="{ color: c.variacion >= 0 ? 'var(--accent)' : 'var(--danger)' }">
          {{ c.variacion >= 0 ? '+' : '' }}{{ c.variacion.toFixed(1) }}%
        </div>
        <div v-else class="sub">sin precio</div>
        <div class="sub">${{ (c.inversionActual ?? c.inversion).toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const cartera = ref([])
const cargando = ref(true)

async function cargar() {
  cargando.value = true
  cartera.value = await $fetch('/api/inversiones')
  cargando.value = false
}
cargar()
</script>

<style scoped>
.row { display:flex; justify-content:space-between; align-items:baseline; padding:12px 0; border-bottom:1px solid var(--border); }
.row:last-child { border-bottom:none; }
.lbl { font-size:13px; color:var(--muted); }
.sub { font-size:12px; color:var(--muted); margin-top:2px; }
</style>