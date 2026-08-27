"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

interface UserProfile {
  full_name: string
  bio: string
  username: string
  avatar_url: string
  is_admin?: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    bio: "",
    username: "",
    avatar_url: ""
  })

  // İstatistikler
  const [followerCount, setFollowerCount] = useState(24)
  const [followingCount, setFollowingCount] = useState(5)
  const [listCount, setListCount] = useState(24)

  // Düzenleme modları
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Geçici düzenleme değerleri
  const [tempName, setTempName] = useState("")
  const [tempBio, setTempBio] = useState("")

  const [userSession, setUserSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 1. Veri Yükleme
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      setUserSession(session)

      if (session?.user) {
        // Supabase'den profil verilerini çek
        try {
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles" as any)
            .select("*")
            .eq("id", session.user.id)
            .single() as any

          if (!profileErr && profileData) {
            const loadedProfile = {
              full_name: profileData.full_name || "Yeni Küratör",
              bio: profileData.bio || "biyografinizi buraya ekleyin...",
              username: profileData.username || session.user.email?.split("@")[0] || "user",
              avatar_url: profileData.avatar_url || "",
              is_admin: profileData.is_admin || false
            }
            setProfile(loadedProfile)
            setTempName(loadedProfile.full_name)
            setTempBio(loadedProfile.bio)
          }
        } catch (err) {
          console.warn("Supabase profil yüklenirken hata oluştu:", err)
        }

        // İstatistikleri çek
        try {
          const { count: followers } = await supabase
            .from("follows" as any)
            .select("*", { count: "exact", head: true })
            .eq("following_id", session.user.id)
          setFollowerCount(followers || 0)

          const { count: following } = await supabase
            .from("follows" as any)
            .select("*", { count: "exact", head: true })
            .eq("follower_id", session.user.id)
          setFollowingCount(following || 0)

          const { count: listSize } = await supabase
            .from("user_books_status" as any)
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)
          setListCount(listSize || 0)
        } catch (err) {
          console.error("İstatistikler yüklenemedi:", err)
        }
      } else {
        // Oturum yoksa LocalStorage veya Varsayılanları kullan
        const localProfile = localStorage.getItem("raf_profile_info")
        if (localProfile) {
          const parsed = JSON.parse(localProfile)
          setProfile({ ...parsed, is_admin: parsed.is_admin ?? true }) // Offline modda test kolaylığı için varsayılan true
          setTempName(parsed.full_name)
          setTempBio(parsed.bio)
        } else {
          setProfile({
            full_name: "Yeni Küratör",
            bio: "biyografinizi buraya ekleyin...",
            username: "user",
            avatar_url: "",
            is_admin: true // Offline modda test kolaylığı için varsayılan true
          })
          setTempName("Yeni Küratör")
          setTempBio("biyografinizi buraya ekleyin...")
        }

        const localBooks = localStorage.getItem("raf_profile_books")
        if (localBooks) {
          const parsedBooks = JSON.parse(localBooks)
          setListCount(parsedBooks.length)
        }
      }
      setLoading(false)
    }

    loadUserData()
  }, [])

  // 2. Veri Kaydetme Fonksiyonu
  const saveProfileField = async (fieldsToUpdate: Partial<UserProfile>) => {
    const updatedProfile = {
      ...profile,
      ...fieldsToUpdate
    }
    setProfile(updatedProfile)

    if (userSession?.user) {
      try {
        const { error } = await supabase
          .from("profiles" as any)
          .update(fieldsToUpdate as any)
          .eq("id", userSession.user.id)

        if (error) throw error
      } catch (err) {
        console.error("Supabase güncellenirken hata oluştu:", err)
      }
    } else {
      localStorage.setItem("raf_profile_info", JSON.stringify(updatedProfile))
    }
  }

  // Profil resmi güncelleme işleyicisi
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("Lütfen 2MB'tan küçük bir fotoğraf seçiniz.")
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64Url = reader.result as string
      await saveProfileField({ avatar_url: base64Url })
    }
    reader.readAsDataURL(file)
  }

  // İsim kaydetme
  const handleSaveName = () => {
    if (tempName.trim()) {
      saveProfileField({ full_name: tempName.trim() })
    }
    setIsEditingName(false)
  }

  // Biyografi kaydetme
  const handleSaveBio = () => {
    saveProfileField({ bio: tempBio })
    setIsEditingBio(false)
  }

  // Hesaptan çıkış yapma işleyicisi
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem("raf_profile_info")
      localStorage.removeItem("raf_profile_books")
      router.push("/")
    } catch (err) {
      console.error("Çıkış yapılırken hata oluştu:", err)
      router.push("/")
    }
  }

  // Biyografi karakter aşımı kontrolü (120 karakter sınırı uyarısı)
  const isBioLengthWarning = tempBio.length > 120

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white pt-6 pb-2">
      
      {/* Ana Arayüz Alanı */}
      <div className="max-w-5xl w-full mx-auto px-6 flex-grow flex flex-col items-center z-10 relative">
        
        {/* Üst Logo ve İkon Alanı */}
        <div className="flex items-center gap-4 justify-center mb-10 select-none">
          {/* Lacivert Dikdörtgen Logo Kutusu - Profildekiyle Birebir Aynı SVG */}
          <div className="bg-[#070825] shadow-md select-none pointer-events-none">
            <svg width="272" height="167" viewBox="0 0 272 167" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[180px] sm:w-[220px] md:w-[250px] lg:w-[272px] h-auto">
              <rect width="271.34" height="167" fill="#070825"/>
              {/* RAF Başlığı */}
              <path d="M41 112.5V17.125H66.75C72.4167 17.125 77.375 17.9583 81.625 19.625C85.875 21.2083 89.1667 23.7917 91.5 27.375C93.9167 30.9583 95.125 35.7917 95.125 41.875C95.125 48.4583 93.25 53.5417 89.5 57.125C85.75 60.7083 80.8333 63.2083 74.75 64.625C76.9167 65.375 78.9167 66.4167 80.75 67.75C82.6667 69 84.2083 70.5833 85.375 72.5C86.7917 74.75 88 77.5833 89 81C90 84.4167 90.875 88.0417 91.625 91.875C92.375 95.7083 93.0833 99.4583 93.75 103.125C94.4167 106.708 95.0833 109.833 95.75 112.5H83.5C82.8333 108.833 82.2083 105.167 81.625 101.5C81.125 97.8333 80.5417 94.2083 79.875 90.625C79.375 87.4583 78.4583 84.2083 77.125 80.875C75.7917 77.4583 73.9167 74.5833 71.5 72.25C69.1667 69.9167 66.0833 68.75 62.25 68.75H52.125V112.5H41ZM52.125 58.625H62.5C66.3333 58.625 69.8333 58.125 73 57.125C76.25 56.125 78.8333 54.4167 80.75 52C82.75 49.5833 83.75 46.2083 83.75 41.875C83.75 38.0417 82.875 35.0833 81.125 33C79.375 30.8333 77.0833 29.3333 74.25 28.5C71.4167 27.6667 68.3333 27.25 65 27.25H52.125V58.625ZM103.375 112.5L126.375 15.375H137.625L160.625 112.5H149.375L143.375 84.625H120.625L114.625 112.5H103.375ZM122.75 74.75H141.25L132 32.125L122.75 74.75ZM169 112.5V17.125H223.75V27.125H180.125V59.25H217.875V69.25H180.125V112.5H169Z" fill="#FAF8F6"/>
              {/* Crafty Girls Fontlu "kitap kulübü" Alt Yazısı */}
              <text x="136" y="152" textAnchor="middle" className="font-crafty fill-white tracking-widest" style={{ fontSize: "26px" }}>
                kitap kulübü
              </text>
            </svg>
          </div>

          {/* Pembe Profil İkonu Butonu - Profile Geri Döner */}
          <Link 
            href="/profile" 
            className="text-accent-pink hover:scale-110 transition-transform duration-200 cursor-pointer shadow-sm flex items-center justify-center" 
            aria-label="Profile Geri Dön"
            title="Profile Geri Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Profil Detayları Kartı */}
        {loading ? (
          <div className="w-full bg-white border border-slate-200/80 p-8 flex items-center justify-center min-h-[180px]">
            <span className="font-serif italic text-slate-400 lowercase">yükleniyor...</span>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative shadow-sm max-w-4xl">
            
            {/* Sol: Büyük Yuvarlak Profil Fotoğrafı (Tıklanabilir ve Hover Durumu Eklenmiş) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 sm:w-36 sm:h-36 bg-[#1a2542] rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-100 shadow-md relative cursor-pointer group"
              title={profile.avatar_url ? "fotoğraf değiştir" : "fotoğraf ekle"}
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white select-none group-hover:scale-105 transition-transform duration-300">
                  <span className="font-logo text-3xl sm:text-4xl tracking-widest leading-none">RAF</span>
                  <span className="font-handwritten text-[10px] sm:text-xs text-accent-pink mt-1 leading-none">küratör</span>
                </div>
              )}

              {/* Hover Arayüzü: Fotoğraf Ekle / Değiştir */}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-xs font-semibold text-center px-2 lowercase select-none">
                  {profile.avatar_url ? "fotoğraf değiştir" : "fotoğraf ekle"}
                </span>
              </div>
            </div>

            {/* Gizli File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Sağ: İsim, Bio ve İstatistikler */}
            <div className="flex-grow flex flex-col justify-center sm:justify-start text-center sm:text-left pt-2 w-full">
              
              {/* İSİM ALANI (Çift Tıklamalı Düzenleme) */}
              <div className="mb-3 min-h-[44px]">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") setIsEditingName(false)
                    }}
                    autoFocus
                    className="w-full max-w-md px-3 py-1 border border-slate-300 rounded-lg text-2xl font-semibold text-[#1a2542] font-sans focus:outline-none focus:border-accent-pink"
                  />
                ) : (
                  <h2 
                    onDoubleClick={() => {
                      setTempName(profile.full_name)
                      setIsEditingName(true)
                    }}
                    className="text-2xl font-bold text-[#1a2542] font-sans tracking-wide uppercase cursor-pointer hover:text-accent-pink transition-colors select-none"
                    title="Düzenlemek için çift tıklayın"
                  >
                    {profile.full_name}
                  </h2>
                )}
              </div>

              {/* BİYOGRAFİ ALANI (Çift Tıklamalı Düzenleme) */}
              <div className="mb-4 min-h-[50px]">
                {isEditingBio ? (
                  <div className="w-full max-w-xl flex flex-col gap-1">
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      onBlur={handleSaveBio}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleSaveBio()
                        }
                        if (e.key === "Escape") setIsEditingBio(false)
                      }}
                      autoFocus
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans text-slate-600 focus:outline-none focus:border-accent-pink min-h-[60px] resize-y"
                    />
                    <div className="flex justify-between items-center text-[11px] px-1">
                      <span className={`${isBioLengthWarning ? "text-rose-500 font-medium" : "text-slate-400"}`}>
                        {tempBio.length} / 120 karakter
                      </span>
                      {isBioLengthWarning && (
                        <span className="text-rose-500 italic lowercase font-serif">
                          120 karakter sınırını aşıyorsunuz!
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p 
                      onDoubleClick={() => {
                        setTempBio(profile.bio)
                        setIsEditingBio(true)
                      }}
                      className="text-[14px] text-slate-500 italic font-sans leading-relaxed cursor-pointer hover:text-accent-pink transition-colors select-none"
                      title="Düzenlemek için çift tıklayın"
                    >
                      {profile.bio || "biyografinizi buraya ekleyin (çift tıklayın)..."}
                    </p>
                    
                    {/* Kayıtlı bio 120'yi aşıyorsa uyarı göster */}
                    {profile.bio.length > 120 && (
                      <span className="text-[11px] text-amber-500 italic font-serif lowercase pl-0.5 mt-0.5">
                        * mevcut biyografiniz 120 karakter sınırının üzerindedir.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* İSTATİSTİKLER */}
              <div className="flex items-center justify-center sm:justify-start gap-8 mt-2 border-t border-slate-100 pt-3 select-none">
                <span className="font-serif text-sm text-slate-500">
                  <strong className="text-[#1a2542] font-sans font-bold text-base mr-1">{followerCount}</strong> takipçi
                </span>
                <span className="font-serif text-sm text-slate-500">
                  <strong className="text-[#1a2542] font-sans font-bold text-base mr-1">{followingCount}</strong> takip ediliyor
                </span>
                <span className="font-serif text-sm text-slate-500">
                  <strong className="text-[#1a2542] font-sans font-bold text-base mr-1">{listCount}</strong> kitap
                </span>
              </div>

            </div>

          </div>
        )}

        {/* Yönetici Paneli ve Hesaptan Çıkış Yap Butonları */}
        {!loading && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 select-none">
            {profile.is_admin && (
              <Link
                href="/admin"
                className="px-6 py-2 bg-[#1a2542] text-white hover:bg-accent-pink rounded-full text-sm font-sans font-medium transition-all cursor-pointer duration-300 shadow-md"
              >
                yönetici paneli
              </Link>
            )}
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="px-6 py-2 border border-accent-pink text-accent-pink hover:bg-accent-pink hover:text-white bg-transparent rounded-full text-sm font-sans font-medium transition-all cursor-pointer duration-300 shadow-sm"
            >
              hesaptan çıkış yap
            </button>
          </div>
        )}

      </div>

      {/* Şantiye Görseli & Açıklama Metni Alanı (Dengeli Boyutta & Sol Üste Konumlandırılmış Düz Crafty Girls Metni) */}
      <div className="w-full mt-auto select-none z-0 px-6 relative max-w-5xl mx-auto">
        {/* Çift Tıklama Açıklama Metni - Resmin Sol Üstünde (Crafty Girls, Düz, Büyük) */}
        <div className="absolute top-4 left-10 z-10 font-crafty text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed select-none pointer-events-none">
          *düzenlemek için çift tıkla,<br />bitince entera bas
        </div>

        {/* Şantiye Çizimi */}
        <img 
          src="/santiye-bg.jpg" 
          alt="Şantiye Çizimi" 
          className="w-full h-auto block opacity-95 pointer-events-none" 
        />
      </div>

      {/* Çıkış Onay Modalı */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-fade-in relative z-50">
            {/* Tatlı Görsel Simge */}
            <div className="w-16 h-16 rounded-full bg-[#fbf8f7] flex items-center justify-center mb-4 text-accent-pink border border-[#f8dce2]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </div>

            {/* Metin */}
            <h3 className="font-sans font-bold text-[#1a2542] text-lg uppercase tracking-wide">
              okumaya ara mı veriyorsun?
            </h3>
            <p className="font-serif text-sm text-slate-500 italic mt-2 lowercase leading-relaxed">
              raf'tan ayrılmak istediğine emin misin? kitaplarınla beraber seni burada bekliyor olacağız.
            </p>

            {/* Butonlar */}
            <div className="flex items-center gap-3 w-full mt-6 justify-center">
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-accent-pink hover:bg-accent-pink/90 text-white rounded-full text-xs font-sans font-semibold uppercase tracking-wider transition-colors cursor-pointer w-1/2"
              >
                evet, çıkış yap
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full text-xs font-sans font-semibold uppercase tracking-wider transition-colors cursor-pointer w-1/2"
              >
                vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
