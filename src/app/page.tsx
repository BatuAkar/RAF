"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function LandingPage() {
  const [session, setSession] = useState<any>(null)
  const [instagramItems, setInstagramItems] = useState<any[]>([])

  const DEFAULT_INSTAGRAM = [
    { id: 1, image_url: "/images/reading1.png", username: "instagram:@RAF&CO.", link: "https://instagram.com" },
    { id: 2, image_url: "/images/reading2.png", username: "instagram:@RAF&CO.", link: "https://instagram.com" },
    { id: 3, image_url: "/images/reading3.png", username: "instagram:@RAF&CO.", link: "https://instagram.com" }
  ]

  // Şeritler için tekrarlayan metinler
  const repeatingRafTextLeft = Array(20).fill("RAF").join("  ")
  const repeatingRafTextRight = Array(15).fill("RAF").join("  ")

  // Oturum durumu ve Instagram görsel verilerinin kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    const fetchInstagramItems = async () => {
      try {
        const { data, error } = await supabase
          .from("instagram_items")
          .select("*")
          .order("id", { ascending: true })

        if (!error && data && data.length > 0) {
          const items = DEFAULT_INSTAGRAM.map(def => {
            const found = data.find(d => d.id === def.id)
            return found || def
          })
          setInstagramItems(items)
        } else {
          const local = localStorage.getItem("raf_instagram_items")
          if (local) {
            setInstagramItems(JSON.parse(local))
          } else {
            setInstagramItems(DEFAULT_INSTAGRAM)
          }
        }
      } catch (err) {
        console.error("Instagram verileri çekilemedi:", err)
        setInstagramItems(DEFAULT_INSTAGRAM)
      }
    }

    fetchInstagramItems()
    return () => subscription.unsubscribe()
  }, [])

  return (
    // Dış kutu masaüstünde ekran yüksekliğini aşamaz ve taşmaları gizler (lg:h-screen lg:overflow-hidden)
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row lg:overflow-hidden selection:bg-accent-pink selection:text-white">
      
      {/* 1. SOL BÖLÜM: Logo, Açıklama ve Instagram Kartları (Masaüstünde bağımsız kaydırılabilir: lg:overflow-y-auto) */}
      <div className="w-full lg:w-[60%] bg-[#fbf8f7] min-h-screen lg:h-screen lg:overflow-y-auto scrollbar-thin p-0">
        
        {/* İç İçerik Taşıyıcı */}
        <div className="min-h-full p-8 sm:p-12 pb-0 lg:pb-0 flex flex-col justify-between gap-12">
          
          {/* Sol Üst: Logo, Slogan ve Orijinal El Yazısı Açıklama Metinleri */}
          <div className="select-none">
            <div className="flex items-baseline pl-6 lg:pl-10">
              <span className="font-logo text-8xl lg:text-[9.5rem] font-normal tracking-[0.03em] text-[#1a2542] leading-none">RAF</span>
              <span className="font-logo text-3xl lg:text-4xl font-light text-[#1a2542] ml-4">&CO.</span>
            </div>
            <p className="font-handwritten text-xl lg:text-2xl text-[#1a2542]/85 mt-2 pl-2">
              kitap kulübü
            </p>
            
            <div className="mt-10 w-full pr-4 sm:pr-12 lg:pr-16 font-caveat text-2xl lg:text-3xl text-[#151a2d]/75 leading-relaxed pl-2 space-y-5">
              <p>
                Hoş geldin. Burası sadece piksellerden oluşan bir alan değil; senin gözünle, senin estetik anlayışınla ve senin seçimlerinle şekillenecek olan kişisel bir müze. İnternetin uçsuz bucaksız gürültüsünde, hızla kaybolan anların arasında durup nefes alabileceğin, sadece sana hitap eden parçaları bir araya getirebileceğin o sessiz limana ulaştın.
              </p>
              <p>
                Dijital dünya uzun zamandır bir tüketim çılgınlığına dönüştü. Her gün binlerce görüntü, yüzeyse fikir ve sayısız içerik akıp gidiyor önümüzden. Peki, bunlardan kaçı gerçekten sende bir iz bırakıyor? Kaçı senin ruhuna dokunuyor veya senin dünyanı yansıtıyor? İşte bu platform, tam olarak bu sorulara bir yanıt vermek için tasarlandı. Pinterest’in o sonsuz ilham veren akışıyla Letterboxd’ın o tutkulu arşivleme kültürünü bir araya getirdik çünkü biliyoruz ki; her insanın içinde bir küratör yatar.
              </p>
              <p className="font-bold">
                Kitap kulübüne hoş geldin..
              </p>
            </div>
          </div>
 
          {/* Sol Alt: Instagram Kartları */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {instagramItems.map((item) => (
                <div key={item.id} className="flex flex-col items-center">
                  <div className="w-full aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white p-2 hover:-translate-y-1 transition-all duration-300">
                    <img
                      src={item.image_url}
                      alt={`Instagram Post ${item.id}`}
                      className="w-full h-full object-cover rounded-xl"
                      loading="lazy"
                    />
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-accent-pink font-handwritten text-xl hover:underline cursor-pointer select-none"
                  >
                    <span className="text-base">📸</span>
                    <span>{item.username}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Sol Alt Sınır: Pembe Şerit */}
          <div className="w-full overflow-hidden whitespace-nowrap pt-6 pb-2 border-t border-slate-200/50 select-none flex flex-col gap-1 mt-6 relative z-30">
            <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
              {repeatingRafTextLeft}
            </div>
            <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
              {repeatingRafTextLeft}
            </div>
            <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
              {repeatingRafTextLeft}
            </div>
          </div>

        </div>

      </div>

      {/* 2. SAĞ BÖLÜM: Sabit Manzara ve Dikey Navigasyon Menüsü (Masaüstünde kaydırma kapalı: lg:h-screen lg:overflow-hidden) */}
      <div className="w-full lg:w-[40%] relative min-h-[50vh] lg:h-screen lg:overflow-hidden flex flex-col justify-between">
        
        {/* Arka Plan Balkon Görseli */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/balcony.jpg"
            alt="Balcony View"
            className="w-full h-full object-cover brightness-[0.9] saturate-[0.95]"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Slogan */}
        <div className="pt-16 pb-4 text-center z-10 select-none">
          <h2 className="font-handwritten text-5xl sm:text-6xl text-accent-pink italic drop-shadow-lg inline-block">
            #ne okuyorsun?
          </h2>
        </div>

        {/* Orta: Dikey Navigasyon Menüsü */}
        <div className="flex-grow flex items-center justify-center z-10 pb-16">
          <nav className="flex flex-col gap-12 items-center justify-center w-full">
            
            {/* Dinamik Giriş Yap / Profilim Seçeneği */}
            {session?.user ? (
              <Link 
                href="/profile" 
                className="group flex flex-col items-center gap-2.5 text-white hover:text-accent-pink transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-9 h-9 drop-shadow-md transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="font-serif text-xl lowercase tracking-wide drop-shadow-sm group-hover:underline">profilim</span>
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="group flex flex-col items-center gap-2.5 text-white hover:text-accent-pink transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-9 h-9 drop-shadow-md transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="font-serif text-xl lowercase tracking-wide drop-shadow-sm group-hover:underline">giriş yap</span>
              </Link>
            )}

            {/* Ara */}
            <Link 
              href="/search" 
              className="group flex flex-col items-center gap-2.5 text-white hover:text-accent-pink transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 drop-shadow-md transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
              <span className="font-serif text-xl lowercase tracking-wide drop-shadow-sm group-hover:underline">ara</span>
            </Link>

            {/* Seçki */}
            <Link 
              href="/secki" 
              className="group flex flex-col items-center gap-2.5 text-white hover:text-accent-pink transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 drop-shadow-md transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
              <span className="font-serif text-xl lowercase tracking-wide drop-shadow-sm group-hover:underline">seçki</span>
            </Link>

            {/* Bilgi */}
            <Link 
              href="/bilgi" 
              className="group flex flex-col items-center gap-2.5 text-white hover:text-accent-pink transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 drop-shadow-md transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.054.954l-.569 1.424a1.75 1.75 0 1 1-3.196-1.458l.54-1.352a.75.75 0 0 1 1.054-.42l.07.036ZM12 7.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="font-serif text-xl lowercase tracking-wide drop-shadow-sm group-hover:underline">bilgi</span>
            </Link>

          </nav>
        </div>

        {/* Sağ Alt Sınır: Koyu Arka Plan Üzeri BEYAZ Şerit */}
        <div className="w-full overflow-hidden whitespace-nowrap py-3 border-t border-white/10 select-none z-10 flex flex-col gap-1">
          <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none text-right">
            {repeatingRafTextRight}
          </div>
          <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none text-right">
            {repeatingRafTextRight}
          </div>
          <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none text-right">
            {repeatingRafTextRight}
          </div>
        </div>

      </div>

    </div>
  )
}
