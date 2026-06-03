// dto.ts
import { z } from "zod"

export const UpdateSpreadsheetSchema = z.object({
    spreadsheetId: z.string({ error: "Spreadsheet ID is required!" }),
    data: z.array(z.object({
        cell: z.string({ error: "Cell is required!" }).regex(/^[^!]+![A-Za-z]{1,3}[1-9][0-9]{0,6}$/, "Invalid cell address (expected format: SheetName!A1)"),
        value: z.string(),
    }))
})

export type UpdateSpreadsheetType = z.infer<typeof UpdateSpreadsheetSchema>