// route.ts
import { getSession } from "@/lib/firebase/session"
import { updateSheet } from "@/lib/google-sheets/sheet"
import { UpdateSpreadsheetSchema } from "@/dto/spreadsheet.dto"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized!" }, { status: 401 })
    }

    const body = await req.json()

    const parsed = UpdateSpreadsheetSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { spreadsheetId, data } = parsed.data

    // Verify the caller owns the submitted spreadsheetId (IDOR guard) (IMPORTANT: Firestore data currently incomplete, may not be a good fix)
    // const userSnap = await adminDb
    //   .collection("users")
    //   .where("u", "==", session.uid)
    //   .get()
    // const authorizedId = userSnap.docs[0]?.data()?.px as string | undefined
    // if (!authorizedId || authorizedId !== spreadsheetId) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // }

    try {
        const results = await Promise.all(
            data.map(({ cell, value }) =>
                updateSheet(spreadsheetId, cell, [[value]])
            )
        )
        return NextResponse.json({ success: true, results }, { status: 200 })
    } catch (err) {
        console.error("updateSheet error:", err)
        return NextResponse.json({ error: "Failed to update spreadsheet" }, { status: 500 })
    }
}