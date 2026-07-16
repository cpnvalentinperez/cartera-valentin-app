<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <p v-if="!movimientos.length" style="color:var(--muted); font-size:13px;">Todavía no hay movimientos cargados.</p>
    <div v-for="m in movimientos" :key="m.rowIndex" class="mov-item">
      <div class="mov-top"><span>{{ m.operacion }}</span><span>{{ formatearFecha(m.fecha) }}</span></div>
      <div class="mov-sub">{{ m.detalle }}</div>
      <div class="mov-deltas">{{ deltasTexto(m) }}</div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button class="accion" @click="$emit('editar', m)">Editar</button>
        <button class="accion eliminar" @click="eliminar(m.rowIndex)">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['editar'])
const movimientos = ref([])

function formatear(n) {
  return Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

function formatearFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function deltasTexto(m) {
  const partes = []
  if (m.deltaPesos) partes.push('$' + formatear(m.deltaPesos))
  if (m.deltaDolares) partes.push('US$' + formatear(m.deltaDolares))
  if (m.deltaCrypto) partes.push(formatear(m.deltaCrypto) + ' crypto')
  return partes.join(' · ')
}

async function cargar() {
  movimientos.value = await $fetch('/api/movimientos', { query: { limite: 20 } })
}
cargar()

async function eliminar(rowIndex) {
  if (!confirm('¿Eliminar este movimiento? No se puede deshacer.')) return
  try {
    await $fetch(`/api/movimientos/${rowIndex}`, { method: 'DELETE' })
    await cargar()
  } catch (err) {
    alert(err.data?.statusMessage || 'Error al eliminar.')
  }
}

defineExpose({ cargar })
</script>

<style scoped>
.mov-item { border-bottom:1px solid var(--border); padding:12px 0; }
.mov-item:last-child { border-bottom:none; }
.mov-top { display:flex; justify-content:space-between; font-size:14px; font-weight:600; }
.mov-sub { font-size:12px; color:var(--muted); margin-top:2px; }
.mov-deltas { font-size:12px; margin-top:4px; color:var(--muted); }
.accion { flex:1; padding:8px; font-size:13px; border-radius:8px; border:1px solid var(--border); background:#12141a; color:var(--text); }
.accion.eliminar { color:var(--danger); }
</style>
