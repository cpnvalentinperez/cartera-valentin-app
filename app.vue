<template>
  <div style="padding:16px; padding-bottom:90px; max-width:480px; margin:0 auto;">
    <h1 style="font-size:20px; text-align:center; margin:4px 0 20px;">Cartera Valentin</h1>

    <CargarView v-if="vista === 'cargar'" :editando="editando" @cargado="onCargado" @cancelar-edicion="editando = null" />
    <ResumenView v-if="vista === 'resumen'" />
    <HistorialView v-if="vista === 'historial'" @editar="irAEditar" />
    <SaldoInicialView v-if="vista === 'saldoInicial'" />
    <InversionesView v-if="vista === 'inversiones'" />
    <CarteraView v-if="vista === 'cartera'" />

    <div style="position:fixed; bottom:0; left:0; right:0; display:flex; background:var(--card); border-top:1px solid var(--border); overflow-x:auto;">
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
  { id: 'historial', label: 'Historial' },
  { id: 'resumen', label: 'Resumen' },  
  { id: 'inversiones', label: 'Cargar Crypto' },
  { id: 'cartera', label: 'Cartera Crypto' }
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
    flex: '1 1 0',
    minWidth: '0',
    padding: '14px 4px',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: vista.value === id ? 'var(--accent)' : 'var(--muted)'
  }
}
</script>
