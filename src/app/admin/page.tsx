"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { searchBooks } from "@/lib/booksService"
import { GoogleBook } from "@/types"

interface SeckiItem {
  id: string
  title: string
  author: string
  quote: string
  cover_url: string
  display_date: string
}

interface MemberItem {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
  is_admin: boolean
}

export default function AdminPage() {
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<"secki" | "members" | "instagram">("secki")
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Instagram Kartları State'leri
  const [instCard1, setInstCard1] = useState({ image_url: "", username: "", link: "" })
  const [instCard2, setInstCard2] = useState({ image_url: "", username: "", link: "" })
  const [instCard3, setInstCard3] = useState({ image_url: "", username: "", link: "" })
  
  // Seçki Verileri
  const [seckiList, setSeckiList] = useState<SeckiItem[]>([])
  
  // Üye Verileri
  const [memberList, setMemberList] = useState<MemberItem[]>([])
  
  // Seçki Formu State'leri
  const [editingSecki, setEditingSecki] = useState<SeckiItem | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formAuthor, setFormAuthor] = useState("")
  const [formQuote, setFormQuote] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formCoverUrl, setFormCoverUrl] = useState("")
  
  // Google Books Arama State'leri
  const [bookSearchQuery, setBookSearchQuery] = useState("")
  const [bookSearchResults, setBookSearchResults] = useState<GoogleBook[]>([])
  const [isSearchingBooks, setIsSearchingBooks] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Özel Tasarım Popup Modal State'i (Alert/Confirm/Prompt Yerine)
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    type: "alert" | "confirm"
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: ""
  })

  const showCustomAlert = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      type: "alert",
      title,
      message,
      onConfirm: () => {}
    })
  }

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm
    })
  }

  // Tıklama dışı arama dropdown'ını kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Admin Kontrolü ve Veri Yükleme
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      let profileIsAdmin = false
      let currentUserId = ""

      if (session?.user) {
        currentUserId = session.user.id
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", currentUserId)
            .single() as any
          
          if (profileData?.is_admin) {
            profileIsAdmin = true
          }
        } catch (err) {
          console.error("Profil adminlik kontrolü hatası:", err)
        }
      } else {
        // Offline / LocalStorage Modu
        const localProfile = localStorage.getItem("raf_profile_info")
        if (localProfile) {
          const parsed = JSON.parse(localProfile)
          profileIsAdmin = parsed.is_admin ?? true // Varsayılan true
        } else {
          profileIsAdmin = true // Varsayılan true
        }
      }

      if (!profileIsAdmin) {
        setIsAdmin(false)
        showCustomAlert("yetkisiz erişim", "bu sayfaya erişim yetkiniz bulunmamaktadır. ana sayfaya yönlendiriliyorsunuz.")
        setTimeout(() => {
          router.push("/")
        }, 3000)
        setLoading(false)
        return
      }

      setIsAdmin(true)
      await loadSeckiItems()
      await loadMembers()
      await loadInstagramItems()
      setLoading(false)
    }

    checkAuthAndLoad()
  }, [])

  // Seçkileri Yükle
  const loadSeckiItems = async () => {
    try {
      const { data, error } = await supabase
        .from("secki_items" as any)
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        setSeckiList(data.map((item: any) => ({
          id: item.id,
          title: item.title,
          author: item.author,
          quote: item.quote,
          cover_url: item.cover_url,
          display_date: item.display_date
        })))
      } else {
        const local = localStorage.getItem("raf_secki_items")
        if (local) {
          setSeckiList(JSON.parse(local))
        } else {
          setSeckiList([])
        }
      }
    } catch (err) {
      console.error("Seçkiler yüklenemedi:", err)
      const local = localStorage.getItem("raf_secki_items")
      if (local) {
        setSeckiList(JSON.parse(local))
      }
    }
  }

  // Üyeleri Yükle
  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, is_admin")
        .order("full_name", { ascending: true })

      if (!error && data) {
        setMemberList(data as unknown as MemberItem[])
      } else {
        // Offline Mod Mock Üyeler
        setMemberList([
          {
            id: "m1",
            username: "tugba",
            full_name: "Tuğba Kızılöz",
            avatar_url: "",
            bio: "raf kurucusu ve kitap kütüphanesi yöneticisi.",
            is_admin: true
          },
          {
            id: "m2",
            username: "yeni_okur",
            full_name: "Ali Yılmaz",
            avatar_url: "",
            bio: "klasik edebiyat hayranı.",
            is_admin: false
          }
        ])
      }
    } catch (err) {
      console.error("Üyeler yüklenemedi:", err)
    }
  }

  // Google Books Seçki Kitap Arama
  useEffect(() => {
    if (bookSearchQuery.trim().length < 2) {
      setBookSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingBooks(true)
      try {
        const results = await searchBooks(bookSearchQuery)
        setBookSearchResults(results.slice(0, 5))
        setShowSearchDropdown(true)
      } catch (err) {
        console.error("Kitap arama hatası:", err)
      } finally {
        setIsSearchingBooks(false)
      }
    }, 450)

    return () => clearTimeout(delayDebounce)
  }, [bookSearchQuery])

  // Arama dropdown'ından kitap seçildiğinde formu doldurma
  const handleSelectBookFromSearch = (book: GoogleBook) => {
    const volumeInfo = book.volumeInfo
    setFormTitle(volumeInfo.title)
    setFormAuthor(volumeInfo.authors?.join(", ") || "Bilinmeyen Yazar")
    
    // Google Books kapak görselini al ve ISBN'li public URL'ye ya da thumbnail'e yönlendir
    const isbn = volumeInfo.industryIdentifiers?.find((id: any) => id.type.includes("ISBN"))?.identifier
    if (isbn) {
      setFormCoverUrl(`https://books.google.com/books/content?vid=ISBN:${isbn}&printsec=frontcover&img=1&zoom=1`)
    } else {
      setFormCoverUrl(volumeInfo.imageLinks?.thumbnail || "")
    }
    
    setBookSearchQuery("")
    setBookSearchResults([])
    setShowSearchDropdown(false)
  }

  // Seçki Ekleme / Güncelleme Kaydetme
  const handleSaveSecki = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formAuthor.trim() || !formQuote.trim() || !formDate.trim() || !formCoverUrl.trim()) {
      showCustomAlert("eksik bilgi", "lütfen seçki bilgilerinin tamamını doldurun.")
      return
    }

    const newSeckiObj: SeckiItem = {
      id: editingSecki ? editingSecki.id : (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
      title: formTitle.trim(),
      author: formAuthor.trim(),
      quote: formQuote.trim(),
      display_date: formDate.trim(),
      cover_url: formCoverUrl.trim()
    }

    // 1. LocalStorage güncelleme
    let updatedSeckiList = [...seckiList]
    if (editingSecki) {
      updatedSeckiList = seckiList.map(item => item.id === editingSecki.id ? newSeckiObj : item)
    } else {
      updatedSeckiList = [newSeckiObj, ...seckiList]
    }
    setSeckiList(updatedSeckiList)
    localStorage.setItem("raf_secki_items", JSON.stringify(updatedSeckiList))

    // 2. Supabase güncelleme
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      try {
        if (editingSecki) {
          await supabase
            .from("secki_items" as any)
            .update({
              title: newSeckiObj.title,
              author: newSeckiObj.author,
              quote: newSeckiObj.quote,
              cover_url: newSeckiObj.cover_url,
              display_date: newSeckiObj.display_date
            })
            .eq("id", editingSecki.id)
        } else {
          await supabase
            .from("secki_items" as any)
            .insert({
              id: newSeckiObj.id,
              title: newSeckiObj.title,
              author: newSeckiObj.author,
              quote: newSeckiObj.quote,
              cover_url: newSeckiObj.cover_url,
              display_date: newSeckiObj.display_date
            })
        }
      } catch (err) {
        console.error("Supabase seçki kayıt hatası:", err)
      }
    }

    // Formu temizle
    handleResetForm()
    showCustomAlert("başarılı", editingSecki ? "seçki başarıyla güncellendi!" : "yeni seçki başarıyla eklendi!")
  }

  // Düzenleme modunu açma
  const handleEditSeckiClick = (item: SeckiItem) => {
    setEditingSecki(item)
    setFormTitle(item.title)
    setFormAuthor(item.author)
    setFormQuote(item.quote)
    setFormDate(item.display_date)
    setFormCoverUrl(item.cover_url)
  }

  // Seçki silme
  const handleDeleteSecki = (item: SeckiItem) => {
    showCustomConfirm(
      "seçkiyi sil",
      `"${item.title}" seçkisini silmek istediğinize emin misiniz? bu işlem geri alınamaz.`,
      async () => {
        const updatedList = seckiList.filter(s => s.id !== item.id)
        setSeckiList(updatedList)
        localStorage.setItem("raf_secki_items", JSON.stringify(updatedList))

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          try {
            await supabase.from("secki_items" as any).delete().eq("id", item.id)
          } catch (err) {
            console.error("Supabase seçki silme hatası:", err)
          }
        }
        showCustomAlert("başarılı", "seçki silindi.")
      }
    )
  }

  // Üye Admin Yetkisini Değiştirme (Promote/Demote)
  const handleToggleAdmin = async (member: MemberItem) => {
    const newStatus = !member.is_admin
    
    // UI Güncelle
    setMemberList(prev => prev.map(m => m.id === member.id ? { ...m, is_admin: newStatus } : m))

    // Supabase Güncelle
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      try {
        await supabase
          .from("profiles" as any)
          .update({ is_admin: newStatus } as any)
          .eq("id", member.id)
      } catch (err) {
        console.error("Üye yetki güncelleme hatası:", err)
      }
    }
  }

  const loadInstagramItems = async () => {
    try {
      const { data, error } = await supabase
        .from("instagram_items" as any)
        .select("*")
        .order("id", { ascending: true }) as any

      const DEFAULT_INSTAGRAM = [
        { id: 1, image_url: "/images/reading1.png", username: "instagram:@RAF&CO.", link: "https://instagram.com" },
        { id: 2, image_url: "/images/reading2.png", username: "instagram:@RAF&CO.", link: "https://instagram.com" },
        { id: 3, image_url: "/images/reading3.png", username: "instagram:@RAF&CO.", link: "https://instagram.com" }
      ]

      let items = DEFAULT_INSTAGRAM
      if (!error && data && data.length > 0) {
        items = DEFAULT_INSTAGRAM.map(def => {
          const found = data.find(d => d.id === def.id)
          return found || def
        })
      } else {
        const local = localStorage.getItem("raf_instagram_items")
        if (local) {
          items = JSON.parse(local)
        }
      }

      const c1 = items.find(i => i.id === 1) || DEFAULT_INSTAGRAM[0]
      const c2 = items.find(i => i.id === 2) || DEFAULT_INSTAGRAM[1]
      const c3 = items.find(i => i.id === 3) || DEFAULT_INSTAGRAM[2]

      setInstCard1({ image_url: c1.image_url, username: c1.username, link: c1.link })
      setInstCard2({ image_url: c2.image_url, username: c2.username, link: c2.link })
      setInstCard3({ image_url: c3.image_url, username: c3.username, link: c3.link })
    } catch (err) {
      console.error("Instagram verileri yüklenemedi:", err)
    }
  }

  const handleSaveInstagram = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = [
      { id: 1, image_url: instCard1.image_url.trim(), username: instCard1.username.trim(), link: instCard1.link.trim() },
      { id: 2, image_url: instCard2.image_url.trim(), username: instCard2.username.trim(), link: instCard2.link.trim() },
      { id: 3, image_url: instCard3.image_url.trim(), username: instCard3.username.trim(), link: instCard3.link.trim() }
    ]

    try {
      const { error } = await supabase
        .from("instagram_items" as any)
        .upsert(payload)

      localStorage.setItem("raf_instagram_items", JSON.stringify(payload))

      if (error) throw error

      showCustomAlert("başarılı", "instagram görselleri ve yönlendirmeleri başarıyla güncellendi!")
    } catch (err: any) {
      console.error("Instagram güncelleme hatası:", err)
      showCustomAlert("hata", `güncelleme başarısız: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, cardNumber: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("instagram")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: { publicUrl } } = supabase.storage
        .from("instagram")
        .getPublicUrl(filePath)

      if (cardNumber === 1) {
        setInstCard1(prev => ({ ...prev, image_url: publicUrl }))
      } else if (cardNumber === 2) {
        setInstCard2(prev => ({ ...prev, image_url: publicUrl }))
      } else if (cardNumber === 3) {
        setInstCard3(prev => ({ ...prev, image_url: publicUrl }))
      }

      showCustomAlert("başarılı", `${cardNumber}. görsel başarıyla yüklendi!`)
    } catch (err: any) {
      console.error("Görsel yükleme hatası:", err)
      showCustomAlert("hata", `görsel yüklenirken hata oluştu: ${err.message}. Supabase Storage üzerinde 'instagram' adında public bir bucket oluşturduğunuzdan emin olun.`)
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  const handleResetForm = () => {
    setEditingSecki(null)
    setFormTitle("")
    setFormAuthor("")
    setFormQuote("")
    setFormDate("")
    setFormCoverUrl("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf8f7] flex items-center justify-center font-serif italic text-slate-400 lowercase">
        yönetici doğrulaması yapılıyor...
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fbf8f7] flex items-center justify-center font-serif italic text-slate-500 lowercase p-6 text-center">
        {/* Yetkisiz Erişim Dialog */}
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <h4 className="font-koho font-bold text-lg text-rose-500 lowercase">yetkisiz erişim</h4>
          <p className="text-xs text-slate-400 mt-2">bu sayfaya erişim izniniz yok. ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  const repeatingRafText = Array(25).fill("RAF").join("  ")

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white">
      
      {/* Üst Logo ve Başlık */}
      <div className="max-w-5xl w-full mx-auto px-6 pt-10 select-none z-10 flex flex-col items-center">
        <Link href="/" className="flex items-baseline hover:opacity-85 transition-opacity">
          <span className="font-logo text-6xl lg:text-7xl font-normal tracking-[0.03em] text-[#1a2542] leading-none">RAF</span>
          <span className="font-logo text-xl lg:text-2xl font-light text-[#1a2542] ml-2">&CO.</span>
        </Link>
        <span className="font-handwritten text-lg text-accent-pink mt-1">yönetici paneli</span>
      </div>

      {/* Ana Arayüz */}
      <div className="max-w-5xl w-full mx-auto px-6 flex-grow flex flex-col gap-8 mt-10 relative z-10">
        
        {/* Tuğba Özel Selamlama Metni */}
        <div className="w-full flex justify-center md:justify-start -mb-4 select-none animate-fade-in text-center md:text-left">
          <p className="font-crafty text-lg text-[#1a2542] tracking-wide leading-relaxed">
            hoş geldin, baş küratör <span className="text-accent-pink font-semibold">Tuğba</span>! kulübü yönetmeye hazır mısınss ✨
          </p>
        </div>

        {/* Geri Dön ve Tab Butonları */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 select-none">
          <Link
            href="/settings"
            className="text-xs text-white bg-accent-pink hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 py-1.5 px-4 rounded-full shadow-sm font-sans"
          >
            ← ayarlara geri dön
          </Link>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("secki")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all font-sans ${
                activeTab === "secki" ? "bg-[#1a2542] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:text-[#1a2542]"
              }`}
            >
              seçkileri yönet
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all font-sans ${
                activeTab === "members" ? "bg-[#1a2542] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:text-[#1a2542]"
              }`}
            >
              üyeleri yönet
            </button>
            <button
              onClick={() => setActiveTab("instagram")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all font-sans ${
                activeTab === "instagram" ? "bg-[#1a2542] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:text-[#1a2542]"
              }`}
            >
              instagram'ı yönet
            </button>
          </div>
        </div>

        {/* SEKME 1: SEÇKİLERİ YÖNET */}
        {activeTab === "secki" && (
          <div className="w-full flex flex-col lg:flex-row gap-8 animate-fade-in">
            
            {/* Sol Sütun: Ekleme/Düzenleme Formu */}
            <div className="w-full lg:w-[45%] flex flex-col gap-5">
              <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                
                <div>
                  <h4 className="font-koho font-semibold text-base text-[#1a2542] lowercase">
                    {editingSecki ? "seçkiyi düzenle" : "yeni seçki ekle"}
                  </h4>
                  <span className="font-serif text-[10px] text-slate-400 lowercase mt-0.5 block">
                    {editingSecki ? "aşağıdaki bilgileri güncelleyip kaydedin" : "kitap alıntısını ve detaylarını girin"}
                  </span>
                </div>

                {/* Kitap Arama Motoru (Sadece ekleme modundaysa arama yapmayı kolaylaştırır) */}
                {!editingSecki && (
                  <div ref={dropdownRef} className="relative w-full">
                    <label className="text-[10px] text-slate-400 font-serif lowercase pl-0.5 block mb-1">hızlı kitap arama (google books)</label>
                    <input
                      type="text"
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      placeholder="kitap adı yazarak seçin..."
                      className="w-full bg-[#fbf8f7] border border-slate-200 rounded-xl py-2 px-4 text-xs outline-none focus:border-accent-pink font-serif"
                    />
                    
                    {/* Arama Sonuç Dropdown */}
                    {showSearchDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden text-left max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                        {isSearchingBooks ? (
                          <div className="p-3 text-[10px] font-serif text-slate-400 lowercase">aranıyor...</div>
                        ) : bookSearchResults.length === 0 ? (
                          <div className="p-3 text-[10px] font-serif text-slate-400 lowercase">kitap bulunamadı.</div>
                        ) : (
                          bookSearchResults.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleSelectBookFromSearch(b)}
                              className="w-full p-2 hover:bg-[#fbf8f7] transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0 text-left cursor-pointer"
                            >
                              <img src={b.volumeInfo.imageLinks?.thumbnail || ""} alt="" className="w-6 h-8 object-cover rounded shadow-sm" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[11px] font-semibold text-[#1a2542] line-clamp-1">{b.volumeInfo.title}</span>
                                <span className="text-[9px] font-serif text-slate-400 line-clamp-1">{b.volumeInfo.authors?.join(", ")}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSaveSecki} className="flex flex-col gap-3 font-serif text-xs">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 lowercase pl-0.5">kitap adı</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="NUTUK vb."
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 outline-none focus:border-accent-pink font-sans font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 lowercase pl-0.5">yazar ve detay adı</label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      placeholder="NUTUK - MUSTAFA KEMAL ATATÜRK"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 outline-none focus:border-accent-pink"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 lowercase pl-0.5">seçilen alıntı</label>
                    <textarea
                      value={formQuote}
                      onChange={(e) => setFormQuote(e.target.value)}
                      placeholder="“Muhtaç olduğun kudret...”"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 outline-none focus:border-accent-pink min-h-[80px] resize-y"
                    />
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="flex-grow flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 lowercase pl-0.5">kapak resmi adresi (cover url)</label>
                      <input
                        type="text"
                        value={formCoverUrl}
                        onChange={(e) => setFormCoverUrl(e.target.value)}
                        placeholder="resim linkini yapıştırın..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 outline-none focus:border-accent-pink font-sans text-[10px]"
                      />
                    </div>
                    {formCoverUrl && (
                      <div className="w-12 h-18 rounded shadow border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0 mt-4 select-none">
                        <img 
                          src={formCoverUrl} 
                          alt="Kapak Önizleme" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/santiye-bg.png"
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 lowercase pl-0.5">görüntülenme tarihi</label>
                    <input
                      type="text"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder="30.08.2026 vb."
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 outline-none focus:border-accent-pink"
                    />
                  </div>

                  {/* Butonlar */}
                  <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
                    {editingSecki && (
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-4 py-2 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors font-sans text-xs"
                      >
                        iptal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#1a2542] hover:bg-accent-pink text-white rounded-full cursor-pointer transition-colors font-semibold font-sans text-xs"
                    >
                      {editingSecki ? "değişiklikleri kaydet" : "seçkiyi yayınla"}
                    </button>
                  </div>

                </form>

              </div>
            </div>

            {/* Sağ Sütun: Mevcut Seçkilerin Listesi */}
            <div className="w-full lg:w-[55%] flex flex-col gap-4">
              <h4 className="font-koho font-semibold text-base text-[#1a2542] lowercase select-none pl-1">
                mevcut seçkiler ({seckiList.length})
              </h4>
              
              {seckiList.length === 0 ? (
                <div className="bg-white border border-slate-200/80 p-12 text-center rounded-3xl font-serif italic text-slate-400 lowercase">
                  henüz hiç seçki bulunmuyor. sol taraftaki formu kullanarak ekleyebilirsiniz!
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                  {seckiList.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img 
                          src={item.cover_url} 
                          alt="" 
                          className="w-12 h-18 object-cover rounded shadow flex-shrink-0 bg-slate-50" 
                        />
                        <div className="flex flex-col overflow-hidden select-none">
                          <span className="font-sans font-bold text-xs text-[#1a2542] line-clamp-1">{item.title}</span>
                          <span className="font-serif text-[10px] text-slate-400 lowercase line-clamp-1">{item.author}</span>
                          <span className="font-serif italic text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium">
                            {item.quote}
                          </span>
                        </div>
                      </div>

                      {/* Eylemler */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleEditSeckiClick(item)}
                          className="p-1.5 bg-slate-100 hover:bg-[#eccdde]/30 hover:text-accent-pink rounded-full cursor-pointer text-slate-500 transition-colors"
                          title="Seçkiyi Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 18.75a4.49 4.49 0 0 1-1.497.98l-2.09.702a.45.45 0 0 1-.58-.585l.702-2.09a4.49 4.49 0 0 1 .98-1.497L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSecki(item)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full cursor-pointer text-slate-500 transition-colors"
                          title="Seçkiyi Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SEKME 2: ÜYELERİ YÖNET */}
        {activeTab === "members" && (
          <div className="w-full flex flex-col gap-4 animate-fade-in">
            <h4 className="font-koho font-semibold text-base text-[#1a2542] lowercase select-none pl-1">
              kulüp üyeleri ({memberList.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
              {memberList.map((member) => (
                <div 
                  key={member.id}
                  className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-12 h-12 bg-[#1a2542] rounded-full overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-logo text-white text-xs select-none uppercase">{member.username?.substring(0, 2)}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col overflow-hidden select-none">
                      <span className="font-sans font-bold text-sm text-[#1a2542] line-clamp-1">{member.full_name || "Yeni Küratör"}</span>
                      <span className="font-serif text-[10px] text-slate-400 lowercase line-clamp-1">@{member.username}</span>
                      <span className="font-serif text-[10px] text-slate-500 line-clamp-1 mt-1 italic">
                        {member.bio || "biyografi yok..."}
                      </span>
                    </div>
                  </div>

                  {/* Adminlik Yetki Toggle */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 select-none">
                    <span className="text-[8px] font-sans font-semibold tracking-wider text-slate-400 uppercase">rol</span>
                    <button
                      onClick={() => handleToggleAdmin(member)}
                      className={`px-3 py-1 rounded-full text-[9px] font-semibold cursor-pointer uppercase tracking-wider transition-colors font-sans ${
                        member.is_admin ? "bg-accent-pink text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {member.is_admin ? "yönetici" : "üye yap"}
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* SEKME 3: INSTAGRAM'I YÖNET */}
        {activeTab === "instagram" && (
          <form onSubmit={handleSaveInstagram} className="w-full flex flex-col gap-6 animate-fade-in pb-10">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* KART 1 */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                <h4 className="font-koho font-semibold text-base text-[#1a2542] lowercase">
                  1. görsel kartı
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">görsel url:</label>
                  <input
                    type="text"
                    value={instCard1.image_url}
                    onChange={(e) => setInstCard1({ ...instCard1, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="/images/reading1.png veya http://..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">veya bilgisayardan yükle:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, 1)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">instagram kullanıcı adı:</label>
                  <input
                    type="text"
                    value={instCard1.username}
                    onChange={(e) => setInstCard1({ ...instCard1, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="instagram:@RAF&CO."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">yönlendirme linki:</label>
                  <input
                    type="text"
                    value={instCard1.link}
                    onChange={(e) => setInstCard1({ ...instCard1, link: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="https://instagram.com/..."
                    required
                  />
                </div>

                {instCard1.image_url && (
                  <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 p-1 bg-slate-50 mt-2">
                    <img src={instCard1.image_url} alt="Önizleme 1" className="w-full h-full object-cover rounded-xl" />
                  </div>
                )}
              </div>

              {/* KART 2 */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                <h4 className="font-koho font-semibold text-base text-[#1a2542] lowercase">
                  2. görsel kartı
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">görsel url:</label>
                  <input
                    type="text"
                    value={instCard2.image_url}
                    onChange={(e) => setInstCard2({ ...instCard2, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="/images/reading2.png veya http://..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">veya bilgisayardan yükle:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, 2)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">instagram kullanıcı adı:</label>
                  <input
                    type="text"
                    value={instCard2.username}
                    onChange={(e) => setInstCard2({ ...instCard2, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="instagram:@RAF&CO."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">yönlendirme linki:</label>
                  <input
                    type="text"
                    value={instCard2.link}
                    onChange={(e) => setInstCard2({ ...instCard2, link: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="https://instagram.com/..."
                    required
                  />
                </div>

                {instCard2.image_url && (
                  <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 p-1 bg-slate-50 mt-2">
                    <img src={instCard2.image_url} alt="Önizleme 2" className="w-full h-full object-cover rounded-xl" />
                  </div>
                )}
              </div>

              {/* KART 3 */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                <h4 className="font-koho font-semibold text-base text-[#1a2542] lowercase">
                  3. görsel kartı
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">görsel url:</label>
                  <input
                    type="text"
                    value={instCard3.image_url}
                    onChange={(e) => setInstCard3({ ...instCard3, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="/images/reading3.png veya http://..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">veya bilgisayardan yükle:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, 3)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">instagram kullanıcı adı:</label>
                  <input
                    type="text"
                    value={instCard3.username}
                    onChange={(e) => setInstCard3({ ...instCard3, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="instagram:@RAF&CO."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-xs text-slate-400 lowercase pl-1">yönlendirme linki:</label>
                  <input
                    type="text"
                    value={instCard3.link}
                    onChange={(e) => setInstCard3({ ...instCard3, link: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-2xl outline-none focus:border-accent-pink font-sans text-xs text-slate-600 bg-slate-50/30"
                    placeholder="https://instagram.com/..."
                    required
                  />
                </div>

                {instCard3.image_url && (
                  <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 p-1 bg-slate-50 mt-2">
                    <img src={instCard3.image_url} alt="Önizleme 3" className="w-full h-full object-cover rounded-xl" />
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#1a2542] hover:bg-accent-pink text-white rounded-full text-xs font-semibold cursor-pointer transition-colors uppercase tracking-wider font-sans disabled:opacity-50"
              >
                görselleri kaydet
              </button>
            </div>
            
          </form>
        )}

      </div>

      {/* Alt Şerit (Figma Tasarımı) */}
      <div className="w-full overflow-hidden whitespace-nowrap py-3 border-t border-slate-200/50 select-none flex flex-col gap-1 mt-10">
        <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
          {repeatingRafText}
        </div>
        <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
          {repeatingRafText}
        </div>
      </div>

      {/* KULLANICI TALEBİYLE EKLENEN ÖZEL PREMIUM DIALOG POPUP MODALI */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm bg-[#fbf8f7] rounded-3xl border border-[#e2d5cd] shadow-2xl p-6 sm:p-7 flex flex-col gap-5 text-center">
            
            {/* Başlık ve Mesaj */}
            <div>
              <h4 className="font-koho font-bold text-lg text-[#1a2542] lowercase">
                {dialog.title}
              </h4>
              <p className="text-xs text-slate-500 font-serif lowercase mt-2 leading-relaxed">
                {dialog.message}
              </p>
            </div>

            {/* Butonlar */}
            <div className="flex items-center justify-center gap-3 mt-1 pt-4 border-t border-slate-200/60 font-serif">
              {dialog.type !== "alert" && (
                <button
                  onClick={() => {
                    setDialog(prev => ({ ...prev, isOpen: false }))
                  }}
                  className="px-4 py-2 rounded-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  iptal
                </button>
              )}
              <button
                onClick={() => {
                  dialog.onConfirm?.()
                  setDialog(prev => ({ ...prev, isOpen: false }))
                }}
                className="px-5 py-2 bg-[#1a2542] hover:bg-accent-pink text-white rounded-full text-[10px] font-semibold transition-colors duration-200 cursor-pointer uppercase tracking-wider"
              >
                {dialog.type === "confirm" ? "evet, onayla" : "tamam"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
