<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <label class="lbl">Operación</label>
    <div style="display:flex; gap:8px; margin-top:6px;">
      <div class="op-btn" style="flex:1;" :class="{ selected: operacion === 'Compra' }" @click="operacion = 'Compra'">Compra</div>
      <div class="op-btn" style="flex:1;" :class="{ selected: operacion === 'Venta' }" @click="operacion = 'Venta'">Venta</div>
    </div>

    <label class="lbl">Activo</label>
    <input type="text" v-model="asset" list="assets-list" placeholder="Ej: ETHUSDT" class="inp" @input="asset = asset.toUpperCase()">
    <datalist id="assets-list">
      <option v-for="a in assets" :key="a" :value="a" />
    </datalist>

    <label class="lbl">Cantidad</label>
    <input type="number" inputmode="decimal" v-model="cantidad" placeholder="0" class="inp">

    <label class="lbl">Precio unitario (USD)</label>
    <input type="number" inputmode="decimal" v-model="precio" placeholder="0" class="inp">

    <button class="submit" :disabled="!valido || cargando" @click="enviar">
      {{ cargando ? 'Cargando...' : 'Cargar' }}
    </button>
    <div v-if="msg" :class="msgTipo" style="margin-top:14px; padding:12px; border-radius:10px; font-size:14px;">{{ msg }}</div>
  </div>
</template>

<script setup>
const operacion = ref('Compra')
const asset = ref('')
const cantidad = ref('')
const precio = ref('')
const cargando = ref(false)
const msg = ref('')
const msgTipo = ref('ok')
const assets = ref([])

const valido = computed(() => operacion.value && asset.value && cantidad.value !== '' && precio.value !== '')

async function cargarAssets() {
  const cartera = await $fetch('/api/inversiones')
  assets.value = cartera.map(c => c.asset)
}
cargarAssets()

async function enviar() {
  cargando.value = true
  msg.value = ''
  try {
    const res = await $fetch('/api/inversiones', {
      method: 'POST',
      body: { asset: asset.value, operacion: operacion.value, cantidad: cantidad.value, precio: precio.value }
    })
    msg.value = `${operacion.value} cargada. Cantidad: ${res.nuevaCantidad} | PP: $${res.nuevoPP.toFixed(4)}` +
      (res.variacion !== null ? ` | Variación: ${res.variacion >= 0 ? '+' : ''}${res.variacion.toFixed(1)}%` : '')
    msgTipo.value = 'ok'
    cantidad.value = ''
    precio.value = ''
    await cargarAssets()
  } catch (err) {
    msg.value = err.data?.statusMessage || 'Error al cargar.'
    msgTipo.value = 'error'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.lbl { display:block; font-size:13px; color:var(--muted); margin:14px 0 6px; }
.inp { width:100%; padding:12px; font-size:16px; border-radius:10px; border:1px solid var(--border); background:#12141a; color:var(--text); }
.op-btn { padding:14px 8px; border-radius:10px; border:1px solid var(--border); background:#12141a; color:var(--text); font-size:14px; text-align:center; }
.op-btn.selected { border-color:var(--accent); background:rgba(74,222,128,0.12); color:var(--accent); }
.submit { width:100%; margin-top:22px; padding:16px; border:none; border-radius:12px; background:var(--accent-dark); color:white; font-size:16px; font-weight:600; }
.submit:disabled { opacity:0.5; }
.ok { background:rgba(74,222,128,0.12); color:var(--accent); }
.error { background:rgba(248,113,113,0.12); color:var(--danger); }
</style>