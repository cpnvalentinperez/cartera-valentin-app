<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <label class="lbl">Operación</label>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px;">
      <div v-for="op in todasLasOperaciones" :key="op"
        class="op-btn" :class="{ selected: operacion === op }"
        @click="seleccionarOperacion(op)">
        {{ op }}
      </div>
    </div>

    <div v-if="esSimple">
      <label class="lbl">Moneda</label>
      <div style="display:flex; gap:8px; margin-top:6px;">
        <div class="op-btn" style="flex:1;" :class="{ selected: moneda === 'Pesos' }" @click="moneda = 'Pesos'">Pesos</div>
        <div class="op-btn" style="flex:1;" :class="{ selected: moneda === 'Dolares' }" @click="moneda = 'Dolares'">Dólares</div>
      </div>
    </div>

    <label class="lbl">{{ labelCantidad }}</label>
    <input type="number" inputmode="decimal" v-model="cantidad" placeholder="0" class="inp">

    <template v-if="mostrarTc">
      <label class="lbl">{{ labelTc }}</label>
      <input type="number" inputmode="decimal" v-model="tc" placeholder="0" class="inp">
    </template>

    <label class="lbl">Detalle</label>
    <input type="text" v-model="detalle" placeholder="Ej: Compra Nico" class="inp">

    <button class="submit" :disabled="!valido || cargando" @click="enviar">
      {{ editando ? 'Guardar cambios' : (cargando ? 'Cargando...' : 'Cargar') }}
    </button>
    <div v-if="msg" :class="msgTipo" style="margin-top:14px; padding:12px; border-radius:10px; font-size:14px;">{{ msg }}</div>
  </div>
</template>

<script setup>
const props = defineProps({ editando: Object })
const emit = defineEmits(['cargado', 'cancelar-edicion'])

const config = ref({ operacionesDobles: [], operacionesSimples: [], operacionesCryptoDirecto: [] })
const operacion = ref(null)
const moneda = ref(null)
const cantidad = ref('')
const tc = ref('')
const detalle = ref('')
const cargando = ref(false)
const msg = ref('')
const msgTipo = ref('ok')

const todasLasOperaciones = computed(() => [
  ...config.value.operacionesDobles, ...config.value.operacionesSimples, ...config.value.operacionesCryptoDirecto
])

const esSimple = computed(() => config.value.operacionesSimples.includes(operacion.value))
const esCrypto = computed(() => operacion.value === 'Compra Crypto' || operacion.value === 'Venta Crypto')
const esDolarDirecto = computed(() => operacion.value === 'Compra Dolar' || operacion.value === 'Venta Dolar')
const esCryptoDirecto = computed(() => config.value.operacionesCryptoDirecto.includes(operacion.value))

const mostrarTc = computed(() => esDolarDirecto.value || (esCrypto.value && moneda.value))

const labelCantidad = computed(() => {
  if (esDolarDirecto.value) return 'Cantidad (USD)'
  if (esCrypto.value && moneda.value === 'Pesos') return 'Cantidad (unidades de crypto)'
  if (esCrypto.value && moneda.value === 'Dolares') return 'Monto (USD)'
  if (esCryptoDirecto.value) return 'Cantidad (unidades de crypto)'
  if (esSimple.value) return 'Cantidad (monto)'
  return 'Cantidad'
})

const labelTc = computed(() => {
  if (esDolarDirecto.value) return 'TC (ARS por USD)'
  if (esCrypto.value && moneda.value === 'Pesos') return 'Precio unitario (ARS)'
  if (esCrypto.value && moneda.value === 'Dolares') return '% comisión/spread'
  return 'Precio / TC'
})

const valido = computed(() => {
  if (!operacion.value || cantidad.value === '' || cantidad.value === null) return false
  if (esSimple.value && !moneda.value) return false
  if (mostrarTc.value && (tc.value === '' || tc.value === null || tc.value === undefined)) return false
  return true
})

function seleccionarOperacion(op) {
  operacion.value = op
  moneda.value = null
  tc.value = ''
}

async function cargarConfig() {
  config.value = await $fetch('/api/config')
}
cargarConfig()

watch(() => props.editando, (m) => {
  if (!m) return
  operacion.value = m.operacion
  moneda.value = (m.moneda === 'Pesos' || m.moneda === 'Dolares') ? m.moneda : null
  cantidad.value = m.cantidad
  tc.value = m.tc || ''
  detalle.value = m.detalle
}, { immediate: true })

async function enviar() {
  cargando.value = true
  msg.value = ''
  const payload = { operacion: operacion.value, detalle: detalle.value, cantidad: cantidad.value, tc: tc.value, moneda: moneda.value }
  try {
    if (props.editando) {
      await $fetch(`/api/movimientos/${props.editando.rowIndex}`, { method: 'PUT', body: payload })
      msg.value = 'Movimiento actualizado.'
      msgTipo.value = 'ok'
      emit('cargado')
    } else {
      const res = await $fetch('/api/movimientos', { method: 'POST', body: payload })
      msg.value = `Cargado. Saldo Pesos: ${res.saldoPesos} | Saldo Dólares: ${res.saldoDolares} | Crypto: ${res.saldoCrypto}`
      msgTipo.value = 'ok'
    }
    resetForm()
  } catch (err) {
    msg.value = err.data?.statusMessage || 'Error al cargar.'
    msgTipo.value = 'error'
  } finally {
    cargando.value = false
  }
}

function resetForm() {
  operacion.value = null
  moneda.value = null
  cantidad.value = ''
  tc.value = ''
  detalle.value = ''
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
