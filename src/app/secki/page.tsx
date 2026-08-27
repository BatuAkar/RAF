"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface SeckiItem {
  id: string | number
  title: string
  author: string
  quote: string
  date: string
  coverUrl: string
}

export default function SeckiPage() {
  const [seckiItems, setSeckiItems] = useState<SeckiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const fetchSeckiItems = async () => {
      try {
        const { data, error } = await supabase
          .from("secki_items")
          .select("*")
          .order("created_at", { ascending: true })

        if (!error && data && data.length > 0) {
          setSeckiItems(data.map((item: any, idx: number) => ({
            id: item.id || idx,
            title: item.title,
            author: item.author,
            quote: item.quote,
            coverUrl: item.cover_url,
            date: item.display_date
          })))
        } else {
          loadFallbackSeckiItems()
        }
      } catch (err) {
        console.error("Seçkiler yüklenirken hata:", err)
        loadFallbackSeckiItems()
      } finally {
        setLoading(false)
      }
    }

    const loadFallbackSeckiItems = () => {
      const local = localStorage.getItem("raf_secki_items")
      if (local) {
        setSeckiItems(JSON.parse(local))
      } else {
        const defaults = [
          {
            id: 1,
            title: "NUTUK",
            author: "NUTUK-MUSTAFA KEMAL ATATÜRK",
            quote: "“Muhtaç olduğun kudret, damarlarındaki asil kanda mevcuttur!”",
            date: "30.08.2026",
            coverUrl: "https://books.google.com/books/content?vid=ISBN:9789750820038&printsec=frontcover&img=1&zoom=1"
          },
          {
            id: 2,
            title: "KÜÇÜK PRENS",
            author: "KÜÇÜK PRENS-ANTOINE DE SAINT-EXUPÉRY",
            quote: "“İnsan ancak yüreğiyle baktığı zaman doğruyu görebilir. Gerçeğin mayası gözle görülmez.”",
            date: "12.10.2026",
            coverUrl: "https://books.google.com/books/content?vid=ISBN:9789750724435&printsec=frontcover&img=1&zoom=1"
          },
          {
            id: 3,
            title: "ŞEKER PORTAKALI",
            author: "ŞEKER PORTAKALI-JOSÉ MAURO DE VASCONCELOS",
            quote: "“Daha çok anlat,” dedim. “Hoşuna gidiyor mu?” “Çok. Elimden gelse bütün gün seninle konuşurdum.”",
            date: "05.11.2026",
            coverUrl: "https://books.google.com/books/content?vid=ISBN:9789750738609&printsec=frontcover&img=1&zoom=1"
          }
        ]
        setSeckiItems(defaults)
        localStorage.setItem("raf_secki_items", JSON.stringify(defaults))
      }
    }

    fetchSeckiItems()
  }, [])

  const currentItem = seckiItems[activeIndex]

  const repeatingRafText = Array(25).fill("RAF").join("  ")

  const handleNext = () => {
    if (seckiItems.length === 0) return
    setActiveIndex((prev) => (prev + 1) % seckiItems.length)
  }

  const handlePrev = () => {
    if (seckiItems.length === 0) return
    setActiveIndex((prev) => (prev - 1 + seckiItems.length) % seckiItems.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#201814] flex items-center justify-center">
        <span className="font-serif italic text-white/50 text-sm lowercase tracking-wider">yükleniyor...</span>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-[#201814] flex items-center justify-center">
        <span className="font-serif italic text-white/50 text-sm lowercase tracking-wider">seçki bulunamadı.</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white">
      
      {/* Üst Logo ve Slogan (Figma Tasarımı) */}
      <div className="pt-10 flex flex-col items-center select-none z-10 pb-6">
        <Link href="/" className="flex items-baseline hover:opacity-85 transition-opacity">
          <span className="font-logo text-7xl lg:text-8xl font-normal tracking-[0.03em] text-[#1a2542] leading-none">RAF</span>
          <span className="font-logo text-2xl lg:text-3xl font-light text-[#1a2542] ml-3">&CO.</span>
        </Link>
        <p className="font-handwritten text-xl lg:text-2xl text-[#1a2542]/80 mt-1">
          kitap kulübü
        </p>
      </div>

      {/* Orta ve Alt Alan: Koyu Seçki Slayt ve Alt Kısım (Birleşik bg-[#201814]) */}
      <div className="flex-grow bg-[#201814] flex flex-col justify-between relative shadow-lg pt-12 select-none">
        
        {/* Sol Ok Butonu */}
        <button 
          onClick={handlePrev}
          className="absolute left-4 md:left-10 text-white/60 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer z-20 top-[40%]"
          aria-label="Önceki Alıntı"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 md:w-16 md:h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Slayt Kartı Sağ Üst Home Butonu (Search sayfasındaki dolu ev ikonu) */}
        <Link 
          href="/" 
          className="absolute right-6 top-6 text-white/60 hover:text-white transition-colors z-20"
          title="Ana Sayfaya Dön"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.22-.22v7.75A1.5 1.5 0 0 1 18 22.5h-4a1.5 1.5 0 0 1-1.5-1.5v-6a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v6A1.5 1.5 0 0 1 9 22.5H5A1.5 1.5 0 0 1 3.5 21v-7.75l-.22.22a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
          </svg>
        </Link>

        {/* Ok Butonları */}
        <button 
          onClick={handleNext}
          className="absolute right-4 md:right-10 text-white/60 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer z-20 top-[40%]"
          aria-label="Sonraki Alıntı"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 md:w-16 md:h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Slayt İçerik Alanı (Animasyonlu Fade için key=activeIndex) */}
        <div 
          key={activeIndex} 
          className="w-full max-w-[900px] flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 px-12 mx-auto animate-fade-in flex-grow"
        >
          
          {/* Sol Kısım: Kitap Kapağı ve Tarih */}
          <div className="flex flex-col items-center flex-shrink-0 w-[150px]">
            <div className="w-[140px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-black/20 hover:scale-105 transition-transform duration-300">
              <img 
                src={currentItem.coverUrl} 
                alt={`${currentItem.title} Kapak`} 
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            {/* El yazısı fontuyla tarih */}
            <span className="font-handwritten text-lg text-white/80 mt-4 tracking-wide">
              {currentItem.date}
            </span>
          </div>

          {/* Sağ Kısım: Alıntı ve Eser Sahibi */}
          <div className="flex-grow text-center md:text-left flex flex-col justify-center">
            {/* Alıntı Metni */}
            <h3 className="text-white text-lg md:text-2xl font-normal leading-relaxed tracking-wide select-text">
              {currentItem.quote}
            </h3>
            {/* Yazar ve Kitap Adı */}
            <span className="text-white/50 text-xs md:text-sm tracking-widest uppercase mt-4 select-text block">
              {currentItem.author}
            </span>
          </div>

        </div>

        {/* Sağ Alt Köşe: raf seçki yazısı */}
        <div className="absolute right-8 bottom-28 select-none z-10">
          <span className="font-handwritten text-3xl text-white/40 italic">
            raf seçki:
          </span>
        </div>

        {/* En Alt Sınır: BEYAZ Şerit (3 Satırlı, Crafty Girls fontuyla ve TAM BEYAZ) */}
        <div className="w-full overflow-hidden whitespace-nowrap py-3 border-t border-white/10 select-none flex flex-col gap-1 mt-8">
          <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none">
            {repeatingRafText}
          </div>
          <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none">
            {repeatingRafText}
          </div>
          <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none">
            {repeatingRafText}
          </div>
        </div>

      </div>

    </div>
  )
}
