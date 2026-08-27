"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Supabase URL hash'indeki auth verilerini yakalayıp oturumu kurar
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/")
      } else {
        // Oturum açılmadıysa login sayfasına yönlendirir
        router.push("/login")
      }
    })

    // 5 saniye içinde onAuthStateChange tetiklenmezse güvenlik amaçlı ana sayfaya zorla yönlendir
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
