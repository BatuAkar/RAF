"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Giriş sayfasında 2 satır alt alta şeritler için metin tanımları
  const repeatingRafText = Array(25).fill("RAF").join("  ")

  // E-posta ve Şifre ile Giriş Yapma
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setMessage({ type: "error", text: "Lütfen e-posta ve şifrenizi girin." })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage({ type: "error", text: `Giriş hatası: ${error.message}` })
      } else {
        setMessage({ type: "success", text: "Giriş başarılı! Yönlendiriliyorsunuz..." })
        setTimeout(() => {
          router.push("/")
        }, 1000)
      }
    } catch (err: any) {
      console.error("Giriş hatası:", err)
      setMessage({ 
        type: "error", 
        text: "bağlantı hatası: supabase veritabanınıza erişilemiyor. projenizin aktif (dondurulmamış) olduğundan emin olun." 
      })
    } finally {
      setLoading(false)
    }
  }

  // Google ile Giriş Yapma (OAuth)
  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setLoading(false)
        setMessage({ type: "error", text: `Google ile giriş başarısız: ${error.message}` })
      }
    } catch (err: any) {
      console.error("Google giriş hatası:", err)
      setLoading(false)
      setMessage({ 
        type: "error", 
        text: "google bağlantı hatası: supabase auth servislerine erişilemiyor." 
      })
    }
  }

  // E-posta ile Tek Kullanımlık Kod Gönderme (OTP / Kod ile Giriş Yap)
  const handleSendOTP = async () => {
    if (!email) {
      setMessage({ type: "error", text: "Kod alabilmek için önce e-posta adresinizi yazmalısınız." })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage({ type: "error", text: `Kod gönderme hatası: ${error.message}` })
      } else {
        setMessage({ type: "success", text: "Giriş bağlantısı e-posta adresinize gönderildi!" })
      }
    } catch (err: any) {
      console.error("OTP gönderme hatası:", err)
      setMessage({ 
        type: "error", 
        text: "bağlantı hatası: giriş kodu gönderilemedi. veritabanını kontrol edin." 
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

      {/* Giriş Kartı */}
      <div className="flex-grow flex items-center justify-center p-4 z-10 my-8">
        <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 relative">
          
          {/* Kart İçi Sağ Üst Home İkonu (Mavi renkte) */}
          <Link 
            href="/" 
            className="absolute right-6 top-6 text-[#1a2542] hover:text-accent-pink transition-colors"
            title="Ana Sayfaya Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>

          {/* Form Alanı */}
          <form onSubmit={handleEmailLogin} className="mt-4 flex flex-col gap-6">
            
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

            {/* Şifre Girişi */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-serif text-[15px] text-[#1a2542] lowercase pl-1 select-none">
                şifre:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 outline-none focus:border-accent-pink transition-colors font-sans text-sm text-[#1a2542] bg-[#fbf8f7]/50"
                disabled={loading}
              />
            </div>

            {/* Durum Bildirimleri */}
            {message && (
              <div className={`text-xs pl-1 font-serif select-none ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {message.text}
              </div>
            )}

            {/* Giriş Yap Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[#1a2542] text-white hover:bg-accent-pink font-serif text-base lowercase tracking-wide transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "giriş yapılıyor..." : "giriş yap"}
            </button>

          </form>

          {/* Destekleyici Linkler (Kod ile giriş, Şifremi unuttum) */}
          <div className="mt-6 flex flex-col items-center gap-3 select-none">
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="font-serif text-[15px] text-[#1a2542] hover:text-[#1a2542]/85 hover:underline cursor-pointer lowercase"
            >
              kod ile giriş yap
            </button>
            <Link
              href="/forgot-password"
              className="font-serif text-sm text-slate-400 hover:text-slate-500 hover:underline lowercase"
            >
              şifremi unuttum
            </Link>
          </div>

          {/* VEYA Google ile Giriş Butonu */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 font-serif text-sm lowercase text-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              {/* Google Logosu */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-3.01 4.93v4.09h4.85c2.83-2.6 4.45-6.44 4.45-10.87z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.85-4.09c-1.35.9-3.07 1.44-5.11 1.44-3.93 0-7.27-2.65-8.46-6.22H1.56v4.21C3.54 20.43 7.52 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.54 12.22A8.02 8.02 0 0 1 3.54 9.6V5.39H1.56a12 12 0 0 0 0 11.04l1.98-4.21z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.52 0 3.54 3.57 1.56 7.79l1.98 4.21c1.19-3.57 4.53-6.25 8.46-6.25z"
                />
              </svg>
              <span>google ile giriş yap</span>
            </button>
          </div>

        </div>
      </div>

      {/* Kart Altındaki Kaydol Yönlendirmesi */}
      <div className="pb-8 text-center select-none z-10 flex flex-col items-center gap-1.5">
        <span className="font-serif text-sm text-slate-400 lowercase">hesabınız yok mu?</span>
        <Link 
          href="/register" 
          className="font-serif text-base font-bold text-[#1a2542] hover:text-accent-pink tracking-wider transition-colors uppercase"
        >
          KAYDOL
        </Link>
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
