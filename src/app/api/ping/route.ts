import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Supabase veritabanını uyanık tutmak için en hafif okuma sorgusunu atıyoruz
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "supabase pinged successfully", data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
