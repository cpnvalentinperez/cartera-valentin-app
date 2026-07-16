<template>
  <div style="background:var(--card); border-radius:14px; padding:18px; border:1px solid var(--border);">
    <p style="font-size:13px; color:var(--muted); margin-top:0;">
      Cargá esto una sola vez, antes de tu primer movimiento real, con lo que tenés hoy.
    </p>
    <label class="lbl">Saldo inicial en Pesos</label>
    <input type="number" inputmode="decimal" v-model="pesos" placeholder="0" class="inp">
    <label class="lbl">Saldo inicial en Dólares</label>
    <input type="number" inputmode="decimal" v-model="dolares" placeholder="0" class="inp">
    <label class="lbl">Saldo inicial en Crypto (unidades)</label>
    <input type="number" inputmode="decimal" v-model="crypto" placeholder="0" class="inp">
    <button class="submit" :disabled="guardando" @click="guardar">
      {{ guardando ? 'Guardando...' : 'Guardar saldo inicial' }}
    </button>
    <div v-if="msg" :class="msgTipo" style="margin-top:14px; padding:12px; border-radius:10px; font-size:14px;">{{ msg }}</div>
  </div>
</template>

<script setup>
const pesos = ref('')
const dolares = ref('')
const crypto = ref('')
const guardando = ref(false)
const msg = ref('')
const msgTipo = ref('ok')

async function guardar() {
  guardando.value = true
  msg.value = ''
  try {
    await $fetch('/api/saldo-inicial', { method: 'POST', body: { pesos: pesos.value, dolares: dolares.value, crypto: crypto.value } })
    msg.value = 'Guardado.'
    msgTipo.value = 'ok'
  } catch (err) {
    msg.value = err.data?.statusMessage || 'Error.'
    msgTipo.value = 'error'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.lbl { display:block; font-size:13px; color:var(--muted); margin:14px 0 6px; }
.inp { width:100%; padding:12px; font-size:16px; border-radius:10px; border:1px solid var(--border); background:#12141a; color:var(--text); }
.submit { width:100%; margin-top:22px; padding:16px; border:none; border-radius:12px; background:var(--accent-dark); color:white; font-size:16px; font-weight:600; }
.submit:disabled { opacity:0.5; }
.ok { background:rgba(74,222,128,0.12); color:var(--accent); }
.error { background:rgba(248,113,113,0.12); color:var(--danger); }
</style>
