import { createClient } from "@supabase/supabase-js"
import { Database } from "../types/database.types"

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// URL'in geçerli bir HTTP/HTTPS adresi olup olmadığını denetleyen yardımcı fonksiyon
const isValidHttpUrl = (stringUrl: string | undefined): boolean => {
  if (!stringUrl) return false
  try {
    const newUrl = new URL(stringUrl)
    return newUrl.protocol === "http:" || newUrl.protocol === "https:"
  } catch (err) {
    return false
  }
}

// Eğer girilen URL geçersiz veya varsayılan taslak metinse, sayfanın çökmesini engellemek için dummy bir URL kullan
const safeUrl = isValidHttpUrl(rawUrl) && rawUrl !== "your-supabase-project-url"
  ? (rawUrl as string)
  : "https://placeholder-project.supabase.co"

const safeKey = rawKey && rawKey !== "your-supabase-anon-key"
  ? rawKey
  : "placeholder-anon-key"

if (safeUrl.includes("placeholder-project")) {
  console.warn(
    "Supabase credentials are not configured yet. Please configure them in your .env.local file to enable database and authentication features."
  )
}

/**
 * Type-safe Supabase Client instance.
 * Safe initialized to prevent next.js dev overlay crash on invalid env variables.
 */
export const supabase = createClient<Database>(safeUrl, safeKey)
