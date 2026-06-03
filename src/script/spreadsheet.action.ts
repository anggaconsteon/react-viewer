"use server"

import { getSession, getGoogleToken } from "@/lib/firebase/session"
import { AppError } from "@/lib/helper.global"
import {
    getSheetsMeta,
    readSheet,
    getColumnValidations,
    getHiddenColumns,
} from "@/lib/google-sheets/sheet"
import { SpreadsheetData } from "@/types/sheet.type"

export async function getSpreadsheetData(
    spreadsheetId: string,
    gid?: string | null,
    rowStartData?: number
): Promise<SpreadsheetData> {
    const session = await getSession()
    if (!session) throw new AppError("Unauthorized")

    const googleToken = await getGoogleToken()
    if (!googleToken) throw new AppError("Google token expired, please re-login")

    const sheets = await getSheetsMeta(spreadsheetId, googleToken)

    let sheetName: string
    if (gid) {
        const found = sheets.find((s) => String(s.sheetId) === gid)
        sheetName = found?.title ?? sheets[0]?.title ?? "Sheet1"
    } else {
        sheetName = sheets[0]?.title ?? "Sheet1"
    }

    const raw = await readSheet(spreadsheetId, sheetName, googleToken)
    const values = (raw ?? []).map((row) =>
        (row as unknown[]).map((cell) => String(cell ?? ""))
    )

    const numCols = values.reduce((max, row) => Math.max(max, row.length), 0)
    const [columnValidations, hiddenCols] = await Promise.all([
        getColumnValidations(spreadsheetId, sheetName, numCols, rowStartData, googleToken),
        getHiddenColumns(spreadsheetId, sheetName, googleToken),
    ])

    return { values, sheetName, sheets, columnValidations, hiddenCols }
}