"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // 1. PKCE akışı için code parametresi varsa session'a dönüştür
    const handleAuth = async () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error && data.session) {
              router.push("/")
              return
            }
          } catch (e) {
            console.error("Code exchange error:", e)
          }
        }
      }
    }

    handleAuth()

    // 2. Supabase URL hash'indeki auth verilerini yakalayıp oturumu kurar
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/")
      }
    })

    // 5 saniye içinde oturum kurulamazsa ana sayfaya yönlendir
    const timeout = setTimeout(() => {
      router.push("/")
    }, 5000)

    return () => {
      authListener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col items-center justify-center gap-3 select-none">
      <div className="w-8 h-8 rounded-full border-2 border-[#1a2542] border-t-transparent animate-spin" />
      <span className="font-serif text-lg text-[#1a2542] lowercase tracking-wider">
        yönlendiriliyorsunuz...
      </span>
    </div>
  )
}
