import { TIPOS_DOBLES, TIPOS_SIMPLES, TIPOS_CRYPTO_DIRECTO } from '../utils/logic'

export default defineEventHandler(() => {
  return {
    operacionesDobles: TIPOS_DOBLES,
    operacionesSimples: TIPOS_SIMPLES,
    operacionesCryptoDirecto: TIPOS_CRYPTO_DIRECTO
  }
})
