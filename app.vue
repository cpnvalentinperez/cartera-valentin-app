<template>
  <div style="padding:16px; padding-bottom:90px; max-width:480px; margin:0 auto;">
    <h1 style="font-size:20px; text-align:center; margin:4px 0 20px;">Cartera Valentin</h1>

    <CargarView v-if="vista === 'cargar'" :editando="editando" @cargado="onCargado" @cancelar-edicion="editando = null" />
    <ResumenView v-if="vista === 'resumen'" />
    <HistorialView v-if="vista === 'historial'" @editar="irAEditar" />
    <SaldoInicialView v-if="vista === 'saldoInicial'" />

    <div style="position:fixed; bottom:0; left:0; right:0; display:flex; background:var(--card); border-top:1px solid var(--border);">
      <button v-for="tab in tabs" :key="tab.id"
        @click="irA(tab.id)"
        :style="tabStyle(tab.id)">
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
useHead({
  link: [{ rel: 'stylesheet', href: '/theme.css' }]
})

const vista = ref('cargar')
const editando = ref(null)

const tabs = [
  { id: 'cargar', label: 'Cargar' },
  { id: 'resumen', label: 'Resumen' },
  { id: 'historial', label: 'Historial' },
  { id: 'saldoInicial', label: 'Saldo inicial' }
]

function irA(id) {
  if (id === 'cargar') editando.value = null
  vista.value = id
}

function irAEditar(movimiento) {
  editando.value = movimiento
  vista.value = 'cargar'
}

function onCargado() {
  editando.value = null
}

function tabStyle(id) {
  return {
    flex: 1,
    padding: '16px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    color: vista.value === id ? 'var(--accent)' : 'var(--muted)'
  }
}
</script>
