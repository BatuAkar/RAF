"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { searchBooks } from "@/lib/booksService"
import { GoogleBook } from "@/types"
import { BookCard } from "@/components/BookCard"

interface SearchedUser {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<GoogleBook[]>([])
  const [users, setUsers] = useState<SearchedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [searchType, setSearchType] = useState<"book" | "user">("book")
  const [session, setSession] = useState<any>(null)
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set())

  // Kitap ekleme modalı state'leri
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [customLists, setCustomLists] = useState<{ id: string; name: string }[]>([])

  // Özel Tasarım Popup Modal State'i (Alert/Prompt Yerine)
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    type: "alert" | "confirm" | "prompt"
    title: string
    message: string
    placeholder?: string
    inputValue?: string
    onConfirm?: (value?: string) => void
    onCancel?: () => void
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    placeholder: "",
    inputValue: ""
  })

  const showCustomPrompt = (title: string, message: string, placeholder: string, onConfirm: (val: string) => void, onCancel?: () => void) => {
    setDialog({
      isOpen: true,
      type: "prompt",
      title,
      message,
      placeholder,
      inputValue: "",
      onConfirm: (val) => {
        if (val) onConfirm(val)
      },
      onCancel
    })
  }

  // Oturum durumu ve takip listesini çekme
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        loadMyFollowings(session.user.id)
        loadMyCustomLists(session.user.id)
      } else {
        loadCustomListsFromLocalStorage()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadMyFollowings(session.user.id)
        loadMyCustomLists(session.user.id)
      } else {
        setMyFollowingIds(new Set())
        loadCustomListsFromLocalStorage()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadMyCustomLists = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_lists")
        .select("id, name")
        .eq("user_id", userId)
      if (!error && data) {
        setCustomLists(data)
      } else {
        loadCustomListsFromLocalStorage()
      }
    } catch (err) {
      console.error("Custom lists load error:", err)
      loadCustomListsFromLocalStorage()
    }
  }

  const loadCustomListsFromLocalStorage = () => {
    const local = localStorage.getItem("raf_custom_lists")
    if (local) {
      const parsed = JSON.parse(local)
      setCustomLists(parsed.map((l: any) => ({ id: l.id, name: l.name })))
    } else {
      setCustomLists([])
    }
  }

  const loadMyFollowings = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)
      if (data) {
        setMyFollowingIds(new Set(data.map(f => f.following_id)))
      }
    } catch (err) {
      console.error("Takip edilenler listesi alınamadı:", err)
    }
  }

  // YAZARKEN ANLIK ARAMA (Debounce - 400ms)
  useEffect(() => {
    if (query.trim().length < 3) {
      setBooks([])
      setUsers([])
      setHasSearched(false)
      setError(null)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        if (searchType === "book") {
          const results = await searchBooks(query)
          setBooks(results)
          setUsers([])
        } else {
          // Kullanıcı arama
          const { data, error: searchErr } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, bio")
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)

          if (searchErr) throw searchErr
          setUsers((data || []) as SearchedUser[])
          setBooks([])
        }
      } catch (err) {
        console.error("Arama hatası:", err)
        setError("Arama yapılırken bir hata oluştu.")
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query, searchType])

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Form submit olduğunda sayfa yenilenmesini engelliyoruz, arama useEffect ile tetikleniyor
  }

  // Takip etme/bırakma işlemi
  const handleFollowToggle = async (targetId: string, isCurrentlyFollowing: boolean) => {
    if (!session?.user) return

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", session.user.id)
          .eq("following_id", targetId)

        if (!error) {
          setMyFollowingIds(prev => {
            const next = new Set(prev)
            next.delete(targetId)
            return next
          })
        }
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: session.user.id,
            following_id: targetId
          })

        if (!error) {
          setMyFollowingIds(prev => {
            const next = new Set(prev)
            next.add(targetId)
            return next
          })
        }
      }
    } catch (err) {
      console.error("Takip durumu güncellenemedi:", err)
    }
  }

  // Kitabı rafa ekleme tetiği (modalı açar)
  const triggerAddBook = (book: GoogleBook) => {
    if (!session?.user) {
      showTemporaryNotification("error", "kitap eklemek için lütfen önce giriş yapın.")
      return
    }
    setSelectedBook(book)
    setShowAddModal(true)
  }

  // Kitabı seçilen listeye ekleme işlemi
  const handleSaveBookToLibrary = async (status: "to_read" | "reading" | "read", isFavorite: boolean) => {
    if (!selectedBook || !session?.user) return

    const volumeInfo = selectedBook.volumeInfo
    setShowAddModal(false)

    try {
      // 1. Kitap detayını genel kitaplar tablosuna upsert et
      await supabase.from("books").upsert({
        id: selectedBook.id,
        title: volumeInfo.title,
        authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
        cover_url: volumeInfo.imageLinks?.thumbnail || "",
        published_date: volumeInfo.publishedDate || ""
      })

      // 2. Kullanıcı kitap durum tablosuna ekle
      const { error } = await supabase.from("user_books_status").upsert({
        user_id: session.user.id,
        book_id: selectedBook.id,
        status: status,
        is_favorite: isFavorite,
        rating: null
      })

      if (error) throw error

      showTemporaryNotification("success", `"${volumeInfo.title}" başarıyla kitaplığınıza eklendi!`)
    } catch (err) {
      console.error("Kitap kitaplığa eklenirken hata oluştu:", err)
      showTemporaryNotification("error", "kitap eklenirken bir hata oluştu.")
    } finally {
      setSelectedBook(null)
    }
  }

  const handleSaveBookToCustomList = async (listId: string, listName: string) => {
    if (!selectedBook || !session?.user) return
    const volumeInfo = selectedBook.volumeInfo
    setShowAddModal(false)

    try {
      // 1. Kitap detayını genel kitaplar tablosuna upsert et
      await supabase.from("books").upsert({
        id: selectedBook.id,
        title: volumeInfo.title,
        authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
        cover_url: volumeInfo.imageLinks?.thumbnail || "",
        published_date: volumeInfo.publishedDate || ""
      })

      // 2. list_books tablosuna ekle
      const { error } = await supabase.from("list_books").insert({
        list_id: listId,
        book_id: selectedBook.id
      })

      if (error) {
        if (error.code === "23505") { // unique violation
          showTemporaryNotification("error", `bu kitap zaten "${listName}" listesinde mevcut.`)
          return
        }
        throw error
      }

      // LocalStorage'dakini de güncelle
      const local = localStorage.getItem("raf_custom_lists")
      if (local) {
        const parsed = JSON.parse(local)
        const updated = parsed.map((l: any) => {
          if (l.id === listId) {
            if (l.books.some((b: any) => b.id === selectedBook.id)) return l
            const newBook = {
              id: selectedBook.id,
              title: volumeInfo.title,
              authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
              cover_url: volumeInfo.imageLinks?.thumbnail || "",
              status: "read",
              is_favorite: false,
              rating: null
            }
            return { ...l, books: [newBook, ...l.books] }
          }
          return l
        })
        localStorage.setItem("raf_custom_lists", JSON.stringify(updated))
      }

      showTemporaryNotification("success", `"${volumeInfo.title}" başarıyla "${listName}" listesine eklendi!`)
    } catch (err) {
      console.error("Kitap listeye eklenirken hata oluştu:", err)
      showTemporaryNotification("error", "kitap listeye eklenirken bir hata oluştu.")
    } finally {
      setSelectedBook(null)
    }
  }

  const handleCreateListAndAddBook = () => {
    // Arama modalını geçici olarak gizleyip yeni liste dialogunu açalım
    setShowAddModal(false)
    
    showCustomPrompt(
      "yeni liste oluştur",
      "lütfen oluşturmak istediğiniz listenin adını yazın:",
      "liste adı...",
      async (name) => {
        if (!name || !name.trim()) {
          setShowAddModal(true)
          return
        }

        const trimmedName = name.trim()

        // 1. Yeni listeyi oluştur
        const newListId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
        
        // LocalStorage
        const local = localStorage.getItem("raf_custom_lists")
        let parsed = []
        if (local) {
          parsed = JSON.parse(local)
        }
        const newListObj = {
          id: newListId,
          name: trimmedName,
          books: []
        }
        parsed.push(newListObj)
        localStorage.setItem("raf_custom_lists", JSON.stringify(parsed))

        // DB
        if (session?.user) {
          try {
            await supabase.from("user_lists").insert({
              id: newListId,
              user_id: session.user.id,
              name: trimmedName
            })
          } catch (err) {
            console.error("Supabase user list insert error:", err)
          }
        }

        setCustomLists(prev => [...prev, { id: newListId, name: trimmedName }])

        // 2. Kitabı bu listeye ekle
        await handleSaveBookToCustomList(newListId, trimmedName)
      },
      () => {
        // İptal edilirse modalı geri aç
        setShowAddModal(true)
      }
    )
  }

  const showTemporaryNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  // Figma'daki tekrarlayan RAF şerit deseni için yardımcı dizi
  const repeatingRafText = Array(35).fill("RAF").join("  ")

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Bildirim Alanı */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in select-none">
          <div className={`px-5 py-3.5 rounded-2xl shadow-lg border text-sm font-serif ${
            notification.type === "success"
              ? "bg-[#1a2542] text-white border-transparent"
              : "bg-rose-50 text-rose-600 border-rose-200/60"
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Üst ve Orta Bölüm */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-12 flex-grow">
        
        {/* Navigasyon ve Başlık Logosu */}
        <div className="relative flex flex-col items-center">
          
          {/* Sol Üst Köşedeki Figma İkonları */}
          <div className="absolute left-0 top-2 flex items-center gap-3">
            {/* Pembe Profil İkonu (Sadece giriş yapılmışsa görünür) */}
            {session?.user && (
              <Link href="/profile" className="text-accent-pink hover:scale-110 transition-transform duration-200 cursor-pointer flex items-center justify-center" aria-label="Profil">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
            {/* Koyu Mavi Home İkonu */}
            <Link href="/" className="text-accent-blue hover:scale-110 transition-transform duration-200 cursor-pointer flex items-center justify-center" aria-label="Ana Sayfa">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.22-.22v7.75A1.5 1.5 0 0 1 18 22.5h-4a1.5 1.5 0 0 1-1.5-1.5v-6a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v6A1.5 1.5 0 0 1 9 22.5H5A1.5 1.5 0 0 1 3.5 21v-7.75l-.22.22a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
              </svg>
            </Link>
          </div>

          {/* RAF Logo Başlığı */}
          <div className="text-center mt-14 md:mt-2">
            <h1 className="text-7xl font-extrabold tracking-[0.2em] text-[#4a5568] select-none pl-6">
              RAF
            </h1>
            <p className="font-handwritten text-2xl text-accent-pink mt-1 select-none">
              kitap kulübü
            </p>
          </div>
        </div>

        {/* Arama Tipi Seçici */}
        <div className="mt-8 flex justify-center gap-6 select-none font-serif text-sm">
          <button
            onClick={() => {
              setSearchType("book")
              setQuery("")
              setBooks([])
              setUsers([])
              setError(null)
              setHasSearched(false)
            }}
            className={`pb-1.5 px-3 border-b-2 transition-all cursor-pointer ${
              searchType === "book"
                ? "border-accent-pink text-[#1a2542] font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            kitap ara
          </button>
          <button
            onClick={() => {
              setSearchType("user")
              setQuery("")
              setBooks([])
              setUsers([])
              setError(null)
              setHasSearched(false)
            }}
            className={`pb-1.5 px-3 border-b-2 transition-all cursor-pointer ${
              searchType === "user"
                ? "border-accent-pink text-[#1a2542] font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            kullanıcı ara
          </button>
        </div>

        {/* Arama Çubuğu */}
        <div className="mt-6 flex justify-center">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl">
            <div className="relative rounded-xl border border-slate-400/80 bg-white shadow-sm focus-within:border-accent-pink focus-within:ring-1 focus-within:ring-accent-pink/30 transition-all duration-300">
              <input
                type="text"
                name="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === "book" ? "kitap adı..." : "kullanıcı adı veya isim..."}
                className="w-full bg-transparent py-3 px-5 text-base text-foreground placeholder-slate-400 focus:outline-none"
              />
              <button type="submit" className="hidden" />
            </div>
          </form>
        </div>

        {/* Arama Sonuç Kart Alanı */}
        <div className="mt-8 w-full max-w-3xl mx-auto min-h-[320px] rounded-xl bg-white/60 border border-white p-6 shadow-sm backdrop-blur-sm">
          
          {/* Yükleniyor Durumu */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="flex space-x-2">
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-pink [animation-delay:-0.3s]"></div>
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-pink [animation-delay:-0.15s]"></div>
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-pink"></div>
              </div>
              <span className="text-slate-400 font-handwritten text-lg">
                {searchType === "book" ? "Kitaplar taranıyor..." : "Kullanıcılar taranıyor..."}
              </span>
            </div>
          )}

          {/* Hata / Validation Uyarısı */}
          {!loading && error && (
            <div className="flex items-center justify-center py-20 text-center">
              <div className="rounded-xl border border-red-200/60 bg-red-50/40 px-6 py-4 text-sm text-red-500 font-medium">
                {error}
              </div>
            </div>
          )}

          {/* Sonuç Listesi (Arama Yapıldıysa) */}
          {!loading && !error && hasSearched && (
            <div>
              {searchType === "book" ? (
                /* KİTAP ARAMA SONUÇLARI */
                books.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 animate-fade-in">
                    {books.map((book) => (
                      <BookCard key={book.id} book={book} onAddClick={triggerAddBook} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-slate-400 font-handwritten text-3xl select-none">kitap bulunamadı</span>
                    <p className="mt-2 text-xs text-slate-400 max-w-xs">
                      Farklı kelimeler veya tam kitap adını yazarak tekrar aramayı deneyebilirsiniz.
                    </p>
                  </div>
                )
              ) : (
                /* KULLANICI ARAMA SONUÇLARI */
                users.length > 0 ? (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    {users.map((user) => {
                      const isFollowing = myFollowingIds.has(user.id)
                      const isMe = session?.user?.id === user.id
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 hover:bg-white/60 rounded-2xl border border-transparent hover:border-slate-200/40 transition-all">
                          {/* Kullanıcı Detayları (Tıklanabilir) */}
                          <Link href={`/profile?username=${user.username}`} className="flex items-center gap-4 flex-grow cursor-pointer group">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1a2542] flex-shrink-0 border border-slate-100 shadow-sm flex items-center justify-center text-white font-logo text-sm select-none">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{user.username.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-sans font-semibold text-sm text-[#1a2542] group-hover:text-accent-pink transition-colors">
                                {user.full_name || user.username}
                              </span>
                              <span className="font-serif text-xs text-slate-500 lowercase line-clamp-1 mt-0.5">
                                {user.bio || "henüz biyografi eklememiş..."}
                              </span>
                            </div>
                          </Link>

                          {/* Takip Butonu */}
                          {!isMe && session?.user && (
                            <button
                              onClick={() => handleFollowToggle(user.id, isFollowing)}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                                isFollowing
                                  ? "bg-transparent text-slate-500 border-slate-300 hover:bg-slate-50"
                                  : "bg-[#1a2542] text-white border-transparent hover:bg-[#25345b]"
                              }`}
                            >
                              {isFollowing ? "takibi bırak" : "takip et"}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-slate-400 font-handwritten text-3xl select-none">kullanıcı bulunamadı</span>
                    <p className="mt-2 text-xs text-slate-400 max-w-xs">
                      Farklı isimler yazarak tekrar aramayı deneyebilirsiniz.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* İlk Giriş Hali (Boş Durum) */}
          {!loading && !error && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none">
              <span className="text-slate-300 font-handwritten text-3xl">
                {searchType === "book" ? "raf boş duruyor..." : "keşfetmeye başla..."}
              </span>
              <p className="mt-2 text-xs text-slate-400 max-w-sm">
                {searchType === "book" 
                  ? "Buraya kitap adını girerek kendi rafınızı tasarlamaya başlayabilirsiniz."
                  : "Diğer okurları bulup takip etmek için arama yapın."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sayfa Altındaki Tekrarlayan RAF Şeridi (Figma Tasarımı) */}
      <div className="w-full overflow-hidden whitespace-nowrap py-6 select-none border-t border-slate-200/30 bg-[#f7f3f2]/30 mt-12">
        <div className="font-handwritten text-xl text-accent-pink/40 tracking-[0.25em] pl-4">
          {repeatingRafText}
        </div>
      </div>

      {/* KİTAP EKLEME DETAYLI SEÇENEK MODALI (Popup) */}
      {showAddModal && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#fbf8f7] rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-center select-none">
            
            {/* Modal Başlığı */}
            <div>
              <span className="text-xs text-slate-400 lowercase tracking-wider">seçilen kitap:</span>
              <h4 className="font-sans font-bold text-lg text-[#1a2542] mt-1 line-clamp-1">
                {selectedBook.volumeInfo.title}
              </h4>
              <p className="text-xs text-slate-400 font-serif lowercase mt-0.5">
                {selectedBook.volumeInfo.authors?.join(", ") || "bilinmeyen yazar"}
              </p>
            </div>

            {/* Seçenek Listesi (Kategoriler + Özel Listeler) */}
            <div className="flex flex-col gap-3 font-serif max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              
              {/* Standart Kategoriler */}
              <div className="text-left text-[10px] text-slate-400 lowercase tracking-wider mb-1 font-sans">
                kategoriler:
              </div>

              <button
                onClick={() => handleSaveBookToLibrary("read", true)}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-600 hover:text-accent-pink hover:border-accent-pink rounded-2xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                favorilere ekle
              </button>

              <button
                onClick={() => handleSaveBookToLibrary("read", false)}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-600 hover:text-accent-pink hover:border-accent-pink rounded-2xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                kaydedilenlere ekle
              </button>

              {/* Özel Okuma Listeleri */}
              <div className="text-left text-[10px] text-slate-400 lowercase tracking-wider mt-3 mb-1 font-sans border-t border-slate-200/60 pt-3">
                özel listelerim:
              </div>

              {customLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleSaveBookToCustomList(list.id, list.name)}
                  className="w-full py-2.5 px-4 bg-[#1a2542]/5 border border-slate-200 text-[#1a2542] hover:text-white hover:bg-[#1a2542] hover:border-transparent rounded-2xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  &quot;{list.name}&quot; listesine ekle
                </button>
              ))}

              <button
                onClick={handleCreateListAndAddBook}
                className="w-full py-2.5 px-4 bg-white border border-dashed border-accent-pink text-accent-pink hover:bg-accent-pink hover:text-white rounded-2xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                yeni liste oluştur ve ekle...
              </button>

            </div>

            {/* İptal Butonu */}
            <div className="border-t border-slate-200/60 pt-4 flex justify-center">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedBook(null)
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider cursor-pointer"
              >
                vazgeç
              </button>
            </div>

          </div>
        </div>
      )}

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

            {/* Input (Sadece Prompt ise gösterilir) */}
            {dialog.type === "prompt" && (
              <div className="w-full">
                <input
                  type="text"
                  value={dialog.inputValue || ""}
                  onChange={(e) => setDialog(prev => ({ ...prev, inputValue: e.target.value }))}
                  placeholder={dialog.placeholder}
                  className="w-full bg-white border border-slate-300 rounded-full py-2 px-4 text-xs outline-none focus:border-accent-pink font-serif text-[#1a2542] text-center shadow-inner"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      dialog.onConfirm?.(dialog.inputValue)
                      setDialog(prev => ({ ...prev, isOpen: false }))
                    }
                  }}
                />
              </div>
            )}

            {/* Butonlar */}
            <div className="flex items-center justify-center gap-3 mt-1 pt-4 border-t border-slate-200/60 font-serif">
              {dialog.type !== "alert" && (
                <button
                  onClick={() => {
                    dialog.onCancel?.()
                    setDialog(prev => ({ ...prev, isOpen: false }))
                  }}
                  className="px-4 py-2 rounded-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  iptal
                </button>
              )}
              <button
                onClick={() => {
                  dialog.onConfirm?.(dialog.inputValue)
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
