"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const repeatingRafText = Array(25).fill("RAF").join("  ")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      setMessage({ type: "error", text: "Lütfen tüm alanları doldurun." })
      return
    }

    // Kullanıcı adı biçim kontrolü
    if (username.length < 3) {
      setMessage({ type: "error", text: "Kullanıcı adı en az 3 karakter olmalıdır." })
      return
    }

    setLoading(true)
    setMessage(null)

    // Supabase Auth Kaydı
    // Otomatik profiles tetikleyicisi username parametresini raw_user_meta_data'dan alacak
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          full_name: username,
        },
      },
    })

    setLoading(false)

    if (error) {
      setMessage({ type: "error", text: `Kayıt hatası: ${error.message}` })
    } else {
      setMessage({
        type: "success",
        text: "Kayıt başarılı! Lütfen varsa e-posta onay kutunuzu kontrol edin veya giriş yapın.",
      })
      setTimeout(() => {
        router.push("/login")
      }, 2500)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white">
      
      {/* Üst Logo ve Slogan */}
      <div className="pt-10 flex flex-col items-center select-none z-10">
        <Link href="/" className="flex items-baseline hover:opacity-85 transition-opacity">
          <span className="font-logo text-7xl lg:text-8xl font-normal tracking-[0.03em] text-[#1a2542] leading-none">RAF</span>
          <span className="font-logo text-2xl lg:text-3xl font-light text-[#1a2542] ml-3">&CO.</span>
        </Link>
        <p className="font-handwritten text-xl lg:text-2xl text-[#1a2542]/80 mt-1">
          kitap kulübü
        </p>
      </div>

      {/* Kayıt Kartı */}
      <div className="flex-grow flex items-center justify-center p-4 z-10 my-8">
        <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 relative">
          
          {/* Kart İçi Sağ Üst Home İkonu */}
          <Link 
            href="/" 
            className="absolute right-6 top-6 text-[#1a2542] hover:text-accent-pink transition-colors"
            title="Ana Sayfaya Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>

          {/* Form Başlığı */}
          <h2 className="font-serif text-2xl text-[#1a2542] lowercase tracking-wide border-b border-slate-100 pb-3 mb-5 select-none">
            yeni üyelik
          </h2>

          {/* Form Alanı */}
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            
            {/* Kullanıcı Adı */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="font-serif text-[15px] text-[#1a2542] lowercase pl-1 select-none">
                kullanıcı adı:
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="raf_kullanicisi"
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 outline-none focus:border-accent-pink transition-colors font-sans text-sm text-[#1a2542] bg-[#fbf8f7]/50"
                disabled={loading}
              />
            </div>

            {/* E-posta */}
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

            {/* Şifre */}
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

            {/* Kaydol Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[#1a2542] text-white hover:bg-accent-pink font-serif text-base lowercase tracking-wide transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? "hesap oluşturuluyor..." : "hesap oluştur"}
            </button>

          </form>

        </div>
      </div>

      {/* Kart Altındaki Giriş Yönlendirmesi */}
      <div className="pb-8 text-center select-none z-10 flex flex-col items-center gap-1.5">
        <span className="font-serif text-sm text-slate-400 lowercase">zaten hesabınız var mı?</span>
        <Link 
          href="/login" 
          className="font-serif text-base font-bold text-[#1a2542] hover:text-accent-pink tracking-wider transition-colors uppercase"
        >
          GİRİŞ YAP
        </Link>
      </div>

      {/* Alt Sınır: Pembe Şerit */}
      <div className="w-full overflow-hidden whitespace-nowrap py-2 border-t border-slate-200/50 select-none">
        <div className="font-handwritten text-lg text-accent-pink/40 tracking-[0.25em]">
          {repeatingRafText}
        </div>
      </div>

    </div>
  )
}
