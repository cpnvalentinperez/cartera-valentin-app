import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID as string

function getAuth() {
  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY as string
  if (!credsJson) throw new Error('Falta GOOGLE_SERVICE_ACCOUNT_KEY en las variables de entorno.')
  const credentials = JSON.parse(credsJson)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
}

async function sheetsApi() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

/**
 * Lee un rango (ej. 'Movimientos!A1:L10') y devuelve las filas como array de arrays.
 */
export async function getValues(range: string): Promise<any[][]> {
  const sheets = await sheetsApi()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range })
  return res.data.values || []
}

/**
 * Sobrescribe un rango puntual (ej. para editar una fila existente o actualizar saldos).
 */
export async function updateValues(range: string, values: any[][]): Promise<void> {
  const sheets = await sheetsApi()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  })
}

/**
 * Agrega una fila al final de la hoja indicada (equivalente a appendRow de Apps Script).
 */
export async function appendValues(sheetName: string, values: any[]): Promise<void> {
  const sheets = await sheetsApi()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] }
  })
}

/**
 * Devuelve el número de la última fila con datos en la hoja (mirando la columna A),
 * equivalente a sheet.getLastRow() de Apps Script.
 */
export async function getLastRow(sheetName: string): Promise<number> {
  const values = await getValues(`${sheetName}!A:A`)
  return values.length
}

/**
 * Devuelve el sheetId numérico interno (necesario para borrar filas via batchUpdate).
 */
async function getSheetIdByName(sheetName: string): Promise<number | null> {
  const sheets = await sheetsApi()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName)
  return sheet?.properties?.sheetId ?? null
}

/**
 * Borra una fila por número (1-indexado, igual que Apps Script deleteRow).
 */
export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheetId = await getSheetIdByName(sheetName)
  if (sheetId === null) throw new Error(`No se encontró la hoja ${sheetName}`)
  const sheets = await sheetsApi()
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex
          }
        }
      }]
    }
  })
}

/**
 * Crea una hoja nueva con headers si todavía no existe. Devuelve true si la creó.
 */
export async function ensureSheetExists(sheetName: string, headers: string[]): Promise<boolean> {
  const sheetId = await getSheetIdByName(sheetName)
  if (sheetId !== null) return false

  const sheets = await sheetsApi()
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
  })
  await updateValues(`${sheetName}!A1`, [headers])
  return true
}
