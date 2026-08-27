"use client"

import React, { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const repeatingRafText = Array(25).fill("RAF").join("  ")

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setMessage({ type: "error", text: "Lütfen e-posta adresinizi girin." })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings?reset=true`,
      })

      if (error) {
        setMessage({ type: "error", text: `İstek gönderilemedi: ${error.message}` })
      } else {
        setMessage({
          type: "success",
          text: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi! Lütfen gelen kutunuzu kontrol edin.",
        })
      }
    } catch (err: any) {
      console.error("Şifre sıfırlama hatası:", err)
      setMessage({
        type: "error",
        text: "Bağlantı hatası: Sunucuya erişilemiyor.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white">
      
      {/* Üst Logo ve Slogan (Figma Tasarımı) */}
      <div className="pt-10 flex flex-col items-center select-none z-10">
        <Link href="/" className="flex items-baseline hover:opacity-85 transition-opacity">
          <span className="font-logo text-7xl lg:text-8xl font-normal tracking-[0.03em] text-[#1a2542] leading-none">RAF</span>
          <span className="font-logo text-2xl lg:text-3xl font-light text-[#1a2542] ml-3">&CO.</span>
        </Link>
        <p className="font-handwritten text-xl lg:text-2xl text-[#1a2542]/80 mt-1">
          kitap kulübü
        </p>
      </div>

      {/* Şifremi Unuttum Kartı */}
      <div className="flex-grow flex items-center justify-center p-4 z-10 my-8">
        <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 relative">
          
          {/* Giriş Sayfasına Dön İkonu */}
          <Link 
            href="/login" 
            className="absolute right-6 top-6 text-[#1a2542] hover:text-accent-pink transition-colors"
            title="Giriş Ekranına Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </Link>

          <div className="mt-4 flex flex-col gap-2">
            <h2 className="font-sans font-bold text-[#1a2542] text-xl uppercase tracking-wide text-center">
              şifremi unuttum
            </h2>
            <p className="font-serif text-xs text-slate-400 text-center lowercase leading-relaxed">
              hesabınızın e-posta adresini girin, size şifrenizi sıfırlayabilmeniz için bir güvenli bağlantı gönderelim.
            </p>
          </div>

          {/* Form Alanı */}
          <form onSubmit={handleResetRequest} className="mt-6 flex flex-col gap-6">
            
            {/* Email Girişi */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-serif text-[15px] text-[#1a2542] lowercase pl-1 select-none">
                email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 outline-none focus:border-accent-pink transition-colors font-sans text-sm text-[#1a2542] bg-[#fbf8f7]/50"
                disabled={loading}
              />
            </div>

            {/* Durum Bildirimleri */}
            {message && (
              <div className={`text-xs pl-1 font-serif select-none leading-relaxed ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {message.text}
              </div>
            )}

            {/* Link Gönder Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[#1a2542] text-white hover:bg-accent-pink font-serif text-base lowercase tracking-wide transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "gönderiliyor..." : "sıfırlama linki gönder"}
            </button>

          </form>

        </div>
      </div>

      {/* Alt Sınır: Pembe Beden Bitişik Çift Şerit (Crafty Girls) */}
      <div className="w-full overflow-hidden whitespace-nowrap py-3 border-t border-slate-200/50 select-none flex flex-col gap-1">
        <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-none">
          {repeatingRafText}
        </div>
        <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-none">
          {repeatingRafText}
        </div>
      </div>

    </div>
  )
}
