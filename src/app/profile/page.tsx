"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { searchBooks } from "@/lib/booksService"
import { supabase } from "@/lib/supabaseClient"
import { GoogleBook } from "@/types"

interface ProfileBook {
  id: string
  title: string
  authors: string[]
  cover_url: string
  status: "to_read" | "reading" | "read"
  is_favorite: boolean
  rating: number | null
}

interface UserProfile {
  full_name: string
  bio: string
  username: string
  avatar_url: string
}

const DEFAULT_FAVORITES: ProfileBook[] = [
  {
    id: "12836269",
    title: "Nutuk",
    authors: ["Mustafa Kemal Atatürk"],
    cover_url: "https://covers.openlibrary.org/b/id/12836269-L.jpg",
    status: "read",
    is_favorite: true,
    rating: 10
  },
  {
    id: "10534217",
    title: "Küçük Prens",
    authors: ["Antoine de Saint-Exupéry"],
    cover_url: "https://covers.openlibrary.org/b/id/10534217-L.jpg",
    status: "read",
    is_favorite: true,
    rating: 9
  },
  {
    id: "11181651",
    title: "Şeker Portakalı",
    authors: ["José Mauro de Vasconcelos"],
    cover_url: "https://covers.openlibrary.org/b/id/11181651-L.jpg",
    status: "read",
    is_favorite: true,
    rating: 8
  },
  {
    id: "saatleri-ayarlama",
    title: "Saatleri Ayarlama Enstitüsü",
    authors: ["Ahmet Hamdi Tanpınar"],
    cover_url: "https://covers.openlibrary.org/b/id/12853243-L.jpg",
    status: "reading",
    is_favorite: true,
    rating: 9
  }
]

const DEFAULT_TO_READ: ProfileBook[] = [
  {
    id: "1984-orwell",
    title: "1984",
    authors: ["George Orwell"],
    cover_url: "https://covers.openlibrary.org/b/id/12691684-L.jpg",
    status: "to_read",
    is_favorite: false,
    rating: null
  },
  {
    id: "cesur-yeni-dunya",
    title: "Cesur Yeni Dünya",
    authors: ["Aldous Huxley"],
    cover_url: "https://covers.openlibrary.org/b/id/12831872-L.jpg",
    status: "to_read",
    is_favorite: false,
    rating: null
  }
]

const DEFAULT_READING: ProfileBook[] = [
  {
    id: "tutunamayanlar",
    title: "Tutunamayanlar",
    authors: ["Oğuz Atay"],
    cover_url: "https://covers.openlibrary.org/b/id/11382414-L.jpg",
    status: "reading",
    is_favorite: false,
    rating: null
  },
  {
    id: "simyaci",
    title: "Simyacı",
    authors: ["Paulo Coelho"],
    cover_url: "https://covers.openlibrary.org/b/id/12821213-L.jpg",
    status: "reading",
    is_favorite: false,
    rating: null
  }
]

interface CustomList {
  id: string
  name: string
  books: ProfileBook[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"favorites" | "to_read" | "read">("favorites")
  const [books, setBooks] = useState<ProfileBook[]>([])
  
  // Profil bilgileri ve takipçi istatistikleri state'leri
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    bio: "",
    username: "",
    avatar_url: ""
  })
  const [followerCount, setFollowerCount] = useState(24)
  const [followingCount, setFollowingCount] = useState(5)
  const [listCount, setListCount] = useState(24)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [userSession, setUserSession] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Özel Okuma Listeleri State'leri
  const [customLists, setCustomLists] = useState<CustomList[]>([])
  const [newListName, setNewListName] = useState("")
  const [activeListDetail, setActiveListDetail] = useState<CustomList | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  // Özel Tasarım Popup Modal State'i (Alert/Confirm/Prompt Yerine)
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
      onConfirm: () => onConfirm()
    })
  }

  const showCustomPrompt = (title: string, message: string, placeholder: string, onConfirm: (val: string) => void) => {
    setDialog({
      isOpen: true,
      type: "prompt",
      title,
      message,
      placeholder,
      inputValue: "",
      onConfirm: (val) => {
        if (val) onConfirm(val)
      }
    })
  }

  const repeatingRafText = Array(25).fill("RAF").join("  ")

  const loadCustomListsFromLocalStorage = () => {
    const localLists = localStorage.getItem("raf_custom_lists")
    if (localLists) {
      setCustomLists(JSON.parse(localLists))
    } else {
      const defaultLists: CustomList[] = []
      setCustomLists(defaultLists)
      localStorage.setItem("raf_custom_lists", JSON.stringify(defaultLists))
    }
  }

  const loadUserCustomLists = async (userId: string) => {
    try {
      const { data: listsData, error: listsErr } = await supabase
        .from("user_lists")
        .select("id, name")
        .eq("user_id", userId)

      if (!listsErr && listsData) {
        const tempLists: CustomList[] = []
        for (const list of listsData) {
          const { data: listBooksData } = await supabase
            .from("list_books")
            .select(`
              book_id,
              books (id, title, authors, cover_url)
            `)
            .eq("list_id", list.id)

          const listBooks: ProfileBook[] = (listBooksData || []).map((item: any) => ({
            id: item.book_id,
            title: item.books?.title || "Bilinmeyen Kitap",
            authors: item.books?.authors || ["Bilinmeyen Yazar"],
            cover_url: item.books?.cover_url || "",
            status: "read",
            is_favorite: false,
            rating: null
          }))

          tempLists.push({
            id: list.id,
            name: list.name,
            books: listBooks
          })
        }
        setCustomLists(tempLists)
      } else {
        loadCustomListsFromLocalStorage()
      }
    } catch (err) {
      console.warn("Özel listeler yüklenirken hata oluştu:", err)
      loadCustomListsFromLocalStorage()
    }
  }

  const loadStatsAndBooks = async (userId: string) => {
    try {
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId)
      setFollowerCount(followers || 0)

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId)
      setFollowingCount(following || 0)
    } catch (err) {
      console.error("Takipçi sayıları çekilemedi:", err)
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && session.user.id !== userId) {
        const { data: followCheck } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", session.user.id)
          .eq("following_id", userId)
          .maybeSingle()

        setIsFollowing(!!followCheck)
      } else {
        setIsFollowing(false)
      }
    } catch (err) {
      console.error("Takip durumu kontrolü başarısız:", err)
    }

    try {
      const { data: statusData, error } = await supabase
        .from("user_books_status")
        .select(`
          book_id,
          status,
          is_favorite,
          rating,
          books (id, title, authors, cover_url)
        `)
        .eq("user_id", userId)

      if (!error && statusData) {
        const formattedBooks: ProfileBook[] = statusData.map((item: any) => ({
          id: item.book_id,
          title: item.books?.title || "Bilinmeyen Kitap",
          authors: item.books?.authors || ["Bilinmeyen Yazar"],
          cover_url: item.books?.cover_url || "",
          status: item.status || "to_read",
          is_favorite: item.is_favorite || false,
          rating: item.rating || null
        }))
        setBooks(formattedBooks)
        setListCount(formattedBooks.length)
      } else {
        loadBooksFromLocalStorage()
      }
    } catch (err) {
      console.warn("Supabase verileri çekilirken hata oluştu:", err)
      loadBooksFromLocalStorage()
    }
  }

  const handleFollowClick = () => {
    if (!userSession?.user) {
      showCustomConfirm(
        "henüz giriş yapmadın",
        "takip etmek için giriş yapmalısınız. şimdi giriş yap veya kaydol ekranına gitmek ister misiniz?",
        () => {
          router.push("/login")
        }
      )
      return
    }
    toggleFollow()
  }

  const toggleFollow = async () => {
    if (!userSession?.user || isOwnProfile) return

    // Get target user profile ID
    const params = new URLSearchParams(window.location.search)
    const targetUsername = params.get("username")
    if (!targetUsername) return

    try {
      const { data: targetUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", targetUsername)
        .single()

      if (!targetUser) return

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userSession.user.id)
          .eq("following_id", targetUser.id)

        if (!error) {
          setIsFollowing(false)
          setFollowerCount(prev => Math.max(0, prev - 1))
        }
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: userSession.user.id,
            following_id: targetUser.id
          })

        if (!error) {
          setIsFollowing(true)
          setFollowerCount(prev => prev + 1)
        }
      }
    } catch (err) {
      console.error("Takip işlemi gerçekleştirilemedi:", err)
    }
  }

  const loadBooksFromLocalStorage = () => {
    const localBooks = localStorage.getItem("raf_profile_books")
    if (localBooks) {
      const parsedBooks = JSON.parse(localBooks)
      setBooks(parsedBooks)
      setListCount(parsedBooks.length)
    } else {
      const initialBooks = [...DEFAULT_FAVORITES, ...DEFAULT_TO_READ, ...DEFAULT_READING]
      setBooks(initialBooks)
      setListCount(initialBooks.length)
      localStorage.setItem("raf_profile_books", JSON.stringify(initialBooks))
    }
  }

  // 1. Kullanıcı oturumunu, profili, takipçi sayılarını ve kitap verilerini yükleme
  useEffect(() => {
    const loadSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserSession(session)

      const params = new URLSearchParams(window.location.search)
      const targetUsername = params.get("username")

      if (targetUsername) {
        try {
          const { data: targetProfile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", targetUsername)
            .single()

          if (!error && targetProfile) {
            setProfile({
              full_name: targetProfile.full_name || "Küratör",
              bio: targetProfile.bio || "biyografisini henüz yazmamış...",
              username: targetProfile.username,
              avatar_url: targetProfile.avatar_url || ""
            })
            setEditName(targetProfile.full_name || "Küratör")
            setEditBio(targetProfile.bio || "biyografisini henüz yazmamış...")
            
            if (session?.user?.id === targetProfile.id) {
              setIsOwnProfile(true)
            } else {
              setIsOwnProfile(false)
            }

            loadStatsAndBooks(targetProfile.id)
            loadUserCustomLists(targetProfile.id)
          } else {
            console.error("Hedef profil yüklenemedi:", error)
          }
        } catch (err) {
          console.error("Profil arama hatası:", err)
        }
      } else {
        setIsOwnProfile(true)
        if (session?.user) {
          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (profileData) {
              setProfile({
                full_name: profileData.full_name || "Yeni Küratör",
                bio: profileData.bio || "biyografinizi buraya ekleyin...",
                username: profileData.username || session.user.email?.split("@")[0] || "user",
                avatar_url: profileData.avatar_url || ""
              })
              setEditName(profileData.full_name || "Yeni Küratör")
              setEditBio(profileData.bio || "biyografinizi buraya ekleyin...")
            }
          } catch (err) {
            console.warn("Profil yüklenemedi:", err)
          }
          loadStatsAndBooks(session.user.id)
          loadUserCustomLists(session.user.id)
        } else {
          const localProfile = localStorage.getItem("raf_profile_info")
          if (localProfile) {
            const parsed = JSON.parse(localProfile)
            setProfile(parsed)
            setEditName(parsed.full_name)
            setEditBio(parsed.bio)
          }
          loadBooksFromLocalStorage()
          loadCustomListsFromLocalStorage()
        }
      }
    }

    loadSessionAndData()
  }, [])

  // Dışarı tıklanınca arama menüsünü kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 2. Arama Sorgusu Değişimi & API Çağrısı (Instant Search)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true)
        setShowDropdown(true)
        const fontLoading = document.fonts ? document.fonts.ready : Promise.resolve()
        fontLoading.then(async () => {
          const results = await searchBooks(searchQuery)
          setSearchResults(results)
          setIsSearching(false)
        })
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // 3. Profil Düzenleme Kaydetme
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    const updatedProfile = {
      ...profile,
      full_name: editName,
      bio: editBio
    }
    setProfile(updatedProfile)
    setIsEditing(false)

    if (userSession?.user) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: editName,
            bio: editBio
          })
          .eq("id", userSession.user.id)

        if (error) throw error
      } catch (err) {
        console.error("Supabase profile save error:", err)
      }
    } else {
      localStorage.setItem("raf_profile_info", JSON.stringify(updatedProfile))
    }
  }

  // 4. Kitap Ekleme (Tab türüne göre)
  const handleAddBook = async (googleBook: GoogleBook) => {
    const volumeInfo = googleBook.volumeInfo
    const newBook: ProfileBook = {
      id: googleBook.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
      cover_url: volumeInfo.imageLinks?.thumbnail || "",
      status: activeTab === "favorites" ? "read" : activeTab,
      is_favorite: activeTab === "favorites",
      rating: null
    }

    if (books.some((b) => b.id === newBook.id)) {
      if (activeTab === "favorites") {
        updateBookState(newBook.id, { is_favorite: true })
      }
      setSearchQuery("")
      setShowDropdown(false)
      return
    }

    const updatedBooks = [newBook, ...books]
    setBooks(updatedBooks)
    setListCount(updatedBooks.length)
    setSearchQuery("")
    setShowDropdown(false)

    if (userSession?.user) {
      try {
        await supabase.from("books").upsert({
          id: googleBook.id,
          title: volumeInfo.title,
          authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
          cover_url: volumeInfo.imageLinks?.thumbnail || "",
          published_date: volumeInfo.publishedDate || ""
        })

        await supabase.from("user_books_status").upsert({
          user_id: userSession.user.id,
          book_id: googleBook.id,
          status: newBook.status,
          is_favorite: newBook.is_favorite,
          rating: null
        })
      } catch (err) {
        console.error("Supabase insert error:", err)
      }
    } else {
      localStorage.setItem("raf_profile_books", JSON.stringify(updatedBooks))
    }
  }

  // 5. Kitap Durumu Güncelleme (Rating, Status, Favorite)
  const updateBookState = async (bookId: string, updates: Partial<ProfileBook>) => {
    const updatedBooks = books.map((b) => {
      if (b.id === bookId) {
        return { ...b, ...updates }
      }
      return b
    })
    setBooks(updatedBooks)

    if (userSession?.user) {
      try {
        const book = updatedBooks.find((b) => b.id === bookId)
        if (book) {
          await supabase.from("user_books_status").upsert({
            user_id: userSession.user.id,
            book_id: bookId,
            status: book.status,
            is_favorite: book.is_favorite,
            rating: book.rating
          })
        }
      } catch (err) {
        console.error("Supabase update error:", err)
      }
    } else {
      localStorage.setItem("raf_profile_books", JSON.stringify(updatedBooks))
    }
  }

  // 6. Kitap Silme (Listeden Kaldırma)
  const handleDeleteBook = async (bookId: string) => {
    const updatedBooks = books.filter((b) => b.id !== bookId)
    setBooks(updatedBooks)
    setListCount(updatedBooks.length)

    if (userSession?.user) {
      try {
        await supabase
          .from("user_books_status")
          .delete()
          .eq("user_id", userSession.user.id)
          .eq("book_id", bookId)
      } catch (err) {
        console.error("Supabase delete error:", err)
      }
    } else {
      localStorage.setItem("raf_profile_books", JSON.stringify(updatedBooks))
    }
  }

  // Özel liste yönetimi metotları
  const handleCreateList = async (name: string) => {
    if (!name.trim()) return

    const newListNameTrimmed = name.trim().toLowerCase()
    
    // Aynı isimde liste var mı kontrolü
    if (customLists.some(l => l.name.toLowerCase() === newListNameTrimmed)) {
      showCustomAlert("hata", "bu isimde bir liste zaten mevcut!")
      return
    }

    const newListId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
    const newListObj: CustomList = {
      id: newListId,
      name: name.trim(),
      books: []
    }

    const updatedLists = [newListObj, ...customLists]
    setCustomLists(updatedLists)
    localStorage.setItem("raf_custom_lists", JSON.stringify(updatedLists))

    if (userSession?.user) {
      try {
        await supabase.from("user_lists").insert({
          id: newListId,
          user_id: userSession.user.id,
          name: name.trim()
        })
      } catch (err) {
        console.error("Supabase list insertion error:", err)
      }
    }
  }

  const handleDeleteList = async (listId: string) => {
    const updatedLists = customLists.filter(l => l.id !== listId)
    setCustomLists(updatedLists)
    localStorage.setItem("raf_custom_lists", JSON.stringify(updatedLists))
    setActiveListDetail(null)

    if (userSession?.user) {
      try {
        await supabase.from("user_lists").delete().eq("id", listId)
      } catch (err) {
        console.error("Supabase list deletion error:", err)
      }
    }
  }

  const handleAddBookToList = async (listId: string, googleBook: GoogleBook) => {
    const volumeInfo = googleBook.volumeInfo
    const newBook: ProfileBook = {
      id: googleBook.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
      cover_url: volumeInfo.imageLinks?.thumbnail || "",
      status: "read",
      is_favorite: false,
      rating: null
    }

    const updatedLists = customLists.map(l => {
      if (l.id === listId) {
        if (l.books.some(b => b.id === newBook.id)) return l
        return { ...l, books: [newBook, ...l.books] }
      }
      return l
    })

    setCustomLists(updatedLists)
    localStorage.setItem("raf_custom_lists", JSON.stringify(updatedLists))

    const updatedListDetail = updatedLists.find(l => l.id === listId)
    if (updatedListDetail) {
      setActiveListDetail(updatedListDetail)
    }

    if (userSession?.user) {
      try {
        await supabase.from("books").upsert({
          id: googleBook.id,
          title: volumeInfo.title,
          authors: volumeInfo.authors || ["Bilinmeyen Yazar"],
          cover_url: volumeInfo.imageLinks?.thumbnail || "",
          published_date: volumeInfo.publishedDate || ""
        })

        await supabase.from("list_books").insert({
          list_id: listId,
          book_id: googleBook.id
        })
      } catch (err) {
        console.error("Supabase list book insert error:", err)
      }
    }
  }

  const handleRemoveBookFromList = async (listId: string, bookId: string) => {
    const updatedLists = customLists.map(l => {
      if (l.id === listId) {
        return { ...l, books: l.books.filter(b => b.id !== bookId) }
      }
      return l
    })

    setCustomLists(updatedLists)
    localStorage.setItem("raf_custom_lists", JSON.stringify(updatedLists))

    const updatedListDetail = updatedLists.find(l => l.id === listId)
    if (updatedListDetail) {
      setActiveListDetail(updatedListDetail)
    }

    if (userSession?.user) {
      try {
        await supabase
          .from("list_books")
          .delete()
          .eq("list_id", listId)
          .eq("book_id", bookId)
      } catch (err) {
        console.error("Supabase list book deletion error:", err)
      }
    }
  }

  const handleSearchAddBook = (book: GoogleBook) => {
    if (activeTab === "read") {
      if (activeListDetail) {
        handleAddBookToList(activeListDetail.id, book)
        setSearchQuery("")
        setShowDropdown(false)
      } else {
        showCustomAlert("listeyi açın", "lütfen kitap eklemek istediğiniz listeyi açın veya yeni bir liste oluşturun!")
      }
    } else {
      handleAddBook(book)
    }
  }

  // Aktif sekme kitapları
  const filteredBooks = books.filter((b) => {
    if (activeTab === "favorites") return b.is_favorite
    if (activeTab === "to_read") return b.status === "to_read"
    if (activeTab === "read") return b.status === "read"
    return false
  })

  // Güncel okunan kitaplar (Dikey Eğik Bandı - Status = reading)
  const readingBooks = books.filter((b) => b.status === "reading")

  const searchPlaceholder = () => {
    if (activeTab === "favorites") return "+ favorilerine ekle..."
    if (activeTab === "to_read") return "+ okuma listesine ekle..."
    if (activeTab === "read") {
      if (activeListDetail) return `+ "${activeListDetail.name}" listesine kitap ekle...`
      return "+ kitap eklemek için önce listeden birini seçin..."
    }
    return "+ okuduklarına ekle..."
  }

  // SVG Logo Elemanı Bileşeni (Orijinal attığınız SVG'deki birebir blur filtresi: stdDeviation="3.8")
  const BlurredSvgLogo = ({ filterId }: { filterId: string }) => (
    <svg width="293" height="204" viewBox="0 0 293 204" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[250px] sm:w-[280px] h-auto">
      <g filter={`url(#${filterId})`}>
        <path d="M56.5938 144.137L43.0199 49.7329L68.5078 46.0682C74.1168 45.2617 79.1432 45.3809 83.5872 46.4257C88.0192 47.3881 91.6451 49.4766 94.4646 52.6914C97.3667 55.8943 99.2506 60.5065 100.116 66.5279C101.053 73.0442 99.9209 78.3426 96.719 82.4232C93.5172 86.5038 89.0064 89.678 83.1866 91.9461C85.438 92.3801 87.5658 93.1265 89.5703 94.1853C91.6453 95.1498 93.3966 96.4976 94.8242 98.2288C96.5467 100.254 98.146 102.887 99.6221 106.126C101.098 109.366 102.48 112.829 103.768 116.517C105.056 120.205 106.291 123.816 107.473 127.35C108.642 130.802 109.747 133.8 110.786 136.345L98.6612 138.088C97.4794 134.554 96.3389 131.014 95.2397 127.467C94.223 123.909 93.1296 120.404 91.9598 116.952C91.0142 113.889 89.6443 110.802 87.8501 107.693C86.0441 104.501 83.779 101.922 81.0549 99.956C78.4132 97.9785 75.1952 97.2625 71.4009 97.8081L61.379 99.2491L67.6055 142.554L56.5938 144.137ZM59.938 89.2272L70.2074 87.7506C74.0017 87.205 77.3949 86.212 80.387 84.7715C83.4616 83.3191 85.7755 81.2605 87.3287 78.5957C88.9644 75.919 89.4739 72.436 88.8572 68.1468C88.3116 64.3525 87.0245 61.5488 84.9958 59.7357C82.9552 57.8402 80.4734 56.6816 77.5503 56.26C74.6272 55.8384 71.516 55.8648 68.2166 56.3392L55.4727 58.1716L59.938 89.2272ZM118.334 135.26L127.277 35.8501L138.412 34.249L175.001 127.112L163.866 128.713L153.959 101.976L131.441 105.214L129.469 133.659L118.334 135.26ZM132.139 95.1366L150.451 92.5037L135.228 51.629L132.139 95.1366ZM183.291 125.92L169.717 31.5158L223.91 23.7237L225.333 33.622L182.152 39.8307L186.724 71.6287L224.09 66.2561L225.513 76.1543L188.147 81.5269L194.303 124.337L183.291 125.92Z" fill="#111963"/>
        <path d="M71.4517 182.917C71.4314 183.215 71.4081 183.492 71.3818 183.748C71.3585 184.025 71.2762 184.258 71.1349 184.446C70.0181 184.291 69.0235 183.961 68.1509 183.455C67.299 182.946 66.5 182.366 65.754 181.716C65.008 181.065 64.2797 180.391 63.569 179.694C62.8553 178.975 62.099 178.326 61.3 177.747C61.165 178.271 61.1022 178.859 61.1116 179.51C61.1181 180.141 61.1481 180.789 61.2018 181.455C61.2554 182.12 61.2987 182.788 61.3317 183.457C61.3854 184.122 61.3904 184.743 61.3467 185.317C61.0847 185.544 60.8506 185.673 60.6444 185.702C60.4381 185.732 60.1671 185.75 59.8312 185.756C59.6572 185.571 59.5451 185.376 59.4948 185.173L59.4592 184.925C59.4415 184.802 59.4325 184.666 59.4324 184.519C59.4233 184.31 59.4334 184.087 59.4627 183.852C59.5155 183.634 59.5448 183.398 59.5504 183.144C59.5967 182.149 59.5765 181.057 59.49 179.87C59.4035 178.682 59.2801 177.458 59.1199 176.197L59.0131 175.455C58.8678 174.445 58.7019 173.437 58.5154 172.433C58.2963 171.201 58.0654 170.035 57.8228 168.933C57.6571 168.22 57.4547 167.544 57.2155 166.905C56.9939 166.242 56.7532 165.593 56.4933 164.957C56.2511 164.297 56.009 163.637 55.7668 162.978C55.246 162.318 55.2985 161.624 55.0887 160.897C55.2299 160.708 55.4139 160.524 55.6406 160.344C55.7378 160.288 55.8483 160.251 55.972 160.233C56.1369 160.209 56.3078 160.227 56.4847 160.286C57.0749 161.316 57.5812 162.422 58.0036 163.603C58.4466 164.781 58.8233 166.011 59.1339 167.292C59.462 168.55 59.7431 169.846 59.9771 171.181C60.2317 172.512 60.476 173.845 60.7099 175.18C61.1163 174.932 61.5108 174.601 61.8934 174.189C62.2937 173.752 62.6778 173.276 63.0456 172.76C63.434 172.241 63.7989 171.705 64.1402 171.15C64.4814 170.596 64.7962 170.077 65.0845 169.594C65.1492 169.458 65.2507 169.286 65.389 169.076C65.5479 168.864 65.7186 168.661 65.9011 168.466C66.1012 168.248 66.3058 168.061 66.5148 167.904C66.7209 167.727 66.9271 167.624 67.1333 167.594C67.4249 167.574 67.6754 167.632 67.8847 167.77C68.0498 167.894 68.1502 168.08 68.1858 168.327L68.2125 168.513C68.2156 168.681 68.1744 168.834 68.0891 168.972C68.0215 169.087 67.9317 169.195 67.8198 169.295C67.705 169.375 67.5813 169.466 67.4489 169.57C67.334 169.649 67.231 169.738 67.1397 169.835C66.7983 170.242 66.4555 170.712 66.1113 171.246C65.7877 171.776 65.4346 172.322 65.0521 172.882C64.6902 173.439 64.3062 173.989 63.9002 174.531C63.5117 175.05 63.0805 175.491 62.6065 175.854C63.5091 177.008 64.4793 178.047 65.5173 178.971C66.5758 179.893 67.6447 180.812 68.7239 181.731C69.2837 181.819 69.7612 181.992 70.1562 182.251C70.5513 182.51 70.9831 182.732 71.4517 182.917ZM77.3514 182.669C77.3133 182.842 77.2206 183.003 77.0734 183.151C76.9469 183.295 76.7938 183.401 76.6141 183.469C76.514 183.505 76.402 183.531 76.2783 183.549C76.1958 183.561 76.1119 183.562 76.0264 183.554C75.8172 183.563 75.6301 183.505 75.465 183.382C74.9416 181.352 74.411 179.345 73.8729 177.36C73.3319 175.354 72.8661 173.358 72.4754 171.373C72.2534 170.268 72.0638 169.169 71.9067 168.076C71.7792 167.189 71.6723 166.3 71.5861 165.407C71.3839 163.416 71.3467 161.4 71.4745 159.361C71.6718 159.27 71.8633 159.211 72.0489 159.184C72.1726 159.166 72.2978 159.159 72.4245 159.162C72.7074 159.226 72.9565 159.348 73.1717 159.528C73.1441 161.531 73.2313 163.529 73.4335 165.52C73.5139 166.519 73.6253 167.513 73.7677 168.503C73.907 169.472 74.0788 170.447 74.283 171.428C74.6471 173.376 75.0908 175.29 75.614 177.172C76.1578 179.052 76.737 180.884 77.3514 182.669ZM78.8514 160.385C79.2283 160.078 79.5508 159.905 79.8188 159.867L79.9735 159.844C80.2505 159.868 80.4568 159.985 80.5925 160.197C80.6545 160.336 80.6989 160.498 80.7256 160.683L80.7656 160.962C80.7482 161.28 80.6704 161.544 80.5321 161.753C80.3908 161.942 80.2068 162.052 79.9799 162.085C79.9387 162.091 79.9063 162.085 79.8827 162.067C79.591 162.088 79.2403 161.918 78.8304 161.556C78.7979 161.476 78.7772 161.405 78.7684 161.344C78.7446 161.179 78.7666 161.039 78.8343 160.924C78.8813 160.812 78.893 160.673 78.8692 160.508L78.8514 160.385ZM84.4482 181.743C84.2538 181.855 84.0742 181.923 83.9092 181.947C83.7855 181.964 83.6779 181.948 83.5865 181.898C83.3449 181.828 83.1326 181.669 82.9497 181.422C82.7698 181.195 82.6148 180.923 82.4849 180.604C82.358 180.307 82.2236 180.032 82.082 179.778C81.6039 178.942 81.1596 177.975 80.7491 176.876C80.3386 175.777 79.9943 174.627 79.7163 173.425C79.4885 172.427 79.3005 171.412 79.1522 170.381L79.0633 169.762C78.909 168.543 78.849 167.394 78.8834 166.315C79.1159 166.029 79.3868 165.864 79.6961 165.82L79.8198 165.802C80.1763 165.793 80.4504 165.943 80.6422 166.252C80.7219 166.367 80.7721 166.496 80.7928 166.641C80.8136 166.785 80.8152 166.943 80.7977 167.114C80.745 167.479 80.7262 167.86 80.7413 168.258C80.7653 168.718 80.8173 169.226 80.8973 169.783L80.9774 170.34C81.1107 171.12 81.2247 171.767 81.3195 172.279C81.3817 172.712 81.4617 173.196 81.5594 173.729C81.6748 174.238 81.8123 174.755 81.9718 175.28C82.1314 175.804 82.2998 176.316 82.4771 176.817C82.6749 177.315 82.886 177.758 83.1102 178.147C83.2844 178.479 83.4983 178.796 83.7519 179.096C84.0026 179.376 84.2106 179.651 84.3758 179.922C84.5617 180.19 84.6754 180.468 84.7169 180.757C84.7613 181.066 84.6718 181.395 84.4482 181.743ZM95.2271 162.292C95.5751 162.663 95.7654 162.962 95.7981 163.189L95.8069 163.251C95.8013 163.504 95.6718 163.701 95.4186 163.843C95.1859 163.982 94.8649 164.091 94.4554 164.171C94.0636 164.227 93.6512 164.287 93.2182 164.349C92.7645 164.414 92.3447 164.496 91.9589 164.593C91.57 164.67 91.2726 164.797 91.0665 164.974C90.9526 166.085 90.9801 167.228 91.1491 168.403C91.1404 168.489 91.1419 168.573 91.1538 168.655C91.3109 169.748 91.5491 170.819 91.8682 171.868C92.1786 173.002 92.542 174.065 92.9583 175.057C93.3953 176.047 93.8336 176.9 94.2732 177.615C94.5503 177.786 94.8098 178.054 95.0518 178.419C95.3113 178.76 95.6608 179.068 96.1 179.341C96.2857 179.462 96.4685 179.562 96.6483 179.641C96.8487 179.718 97.0285 179.797 97.1877 179.88C97.3498 179.983 97.4825 180.1 97.5857 180.233C97.6654 180.348 97.7171 180.488 97.7408 180.652L97.763 180.807C97.7869 181.119 97.6869 181.376 97.4632 181.576C97.2778 181.75 97.0716 181.854 96.8448 181.886L96.6592 181.913C96.4677 181.898 96.3173 181.804 96.2081 181.631C96.1019 181.477 95.8985 181.307 95.5978 181.118C95.4799 181.03 95.3237 180.968 95.1292 180.933C94.9583 180.916 94.8271 180.882 94.7358 180.832C94.3879 180.608 94.0503 180.31 93.7229 179.936C93.4191 179.58 93.1227 179.201 92.8336 178.801C92.5651 178.397 92.3054 177.982 92.0546 177.555C91.8244 177.125 91.6178 176.713 91.4348 176.318C91.2016 175.868 90.9713 175.364 90.744 174.808C90.5166 174.251 90.3009 173.629 90.097 172.943C90.0054 172.598 89.9344 172.251 89.8839 171.9C89.8513 171.673 89.8305 171.455 89.8215 171.246C89.7917 170.893 89.7501 170.53 89.6968 170.159L89.6211 169.633C89.5175 169.059 89.3961 168.434 89.257 167.76C89.2097 167.577 89.1713 167.383 89.1416 167.177C89.0734 166.702 89.045 166.212 89.0563 165.705C88.9915 165.693 88.9178 165.693 88.8353 165.705C88.6085 165.738 88.3729 165.856 88.1285 166.059C87.787 166.319 87.4293 166.613 87.0554 166.94C86.6992 167.244 86.34 167.527 85.9779 167.789C85.651 168.005 85.3433 168.133 85.0546 168.175L84.869 168.201C84.5743 168.202 84.3489 168.097 84.1925 167.888C84.0421 167.72 83.9535 167.544 83.9269 167.358C83.9209 167.317 83.9238 167.264 83.9356 167.199C83.9236 166.969 84.0191 166.756 84.2222 166.558C84.3488 166.413 84.5461 166.322 84.8142 166.283C84.9173 166.269 85.0219 166.264 85.128 166.27C85.6372 165.713 86.2334 165.248 86.9166 164.876C87.6204 164.501 88.3478 164.144 89.0988 163.805C89.0833 162.965 89.109 162.046 89.1758 161.047C89.2633 160.045 89.3243 159.079 89.3588 158.148C89.3674 157.915 89.3554 157.685 89.3228 157.458C89.2932 157.252 89.2753 157.055 89.2692 156.866C89.2602 156.657 89.2763 156.476 89.3174 156.322C89.3791 156.166 89.4953 156.023 89.6661 155.893C89.7751 155.92 89.9018 155.923 90.0462 155.902C90.1699 155.884 90.2951 155.877 90.4218 155.879C90.5485 155.882 90.6679 155.907 90.7799 155.954C90.8919 156.001 90.9892 156.093 91.0718 156.228C91.0196 157.183 90.9749 158.262 90.9377 159.468C90.9182 160.649 90.9399 161.825 91.0028 162.994C91.2532 162.979 91.5022 162.954 91.7496 162.918C92.1827 162.856 92.6422 162.758 93.1282 162.625C93.5966 162.516 94.0473 162.43 94.4803 162.368C94.7278 162.332 94.9767 162.307 95.2271 162.292ZM119.58 174.229C119.554 174.485 119.514 174.722 119.461 174.941C119.409 175.159 119.295 175.322 119.122 175.431C119.024 175.487 118.904 175.526 118.759 175.547C118.656 175.561 118.552 175.566 118.446 175.56C118.151 175.56 117.84 175.521 117.513 175.442C117.186 175.362 116.866 175.261 116.554 175.138C116.262 175.011 116.033 174.886 115.868 174.763C115.541 174.536 115.259 174.261 115.023 173.937C114.808 173.61 114.603 173.282 114.408 172.952C114.211 172.602 114.028 172.281 113.859 171.989C113.712 171.695 113.542 171.466 113.351 171.304C113.139 171.44 112.972 171.601 112.852 171.787C112.731 171.972 112.613 172.179 112.499 172.406C112.404 172.63 112.302 172.865 112.19 173.113C112.096 173.337 111.968 173.545 111.806 173.737C111.435 174.232 110.966 174.699 110.397 175.139C109.847 175.555 109.234 175.906 108.56 176.192C107.986 176.443 107.379 176.615 106.74 176.707C106.636 176.721 106.532 176.726 106.426 176.72C105.68 176.806 104.935 176.745 104.189 176.537C103.396 176.145 102.646 175.611 101.938 174.934C101.251 174.254 100.666 173.476 100.182 172.598C99.6978 171.721 99.3596 170.759 99.1672 169.713C99.1287 169.592 99.1006 169.47 99.0829 169.346C98.9524 168.439 98.9839 167.487 99.1775 166.491C99.2538 166.144 99.3669 165.759 99.5167 165.338C99.6843 164.893 99.8754 164.465 100.09 164.055C100.305 163.646 100.534 163.265 100.778 162.915C101.043 162.561 101.307 162.27 101.569 162.043C102.246 161.483 103.017 161.067 103.883 160.795C104.349 160.665 104.819 160.566 105.293 160.497C105.685 160.441 106.09 160.404 106.508 160.386C107.413 160.382 108.303 160.496 109.178 160.728C110.071 160.937 110.893 161.239 111.645 161.636C111.804 161.424 112.002 161.196 112.241 160.951C112.497 160.682 112.769 160.454 113.058 160.265C113.311 160.123 113.572 160.033 113.84 159.995L113.994 159.972C114.307 159.949 114.628 160.06 114.958 160.307C115.215 160.923 115.388 161.54 115.477 162.159L115.544 162.623C115.591 163.395 115.564 164.156 115.462 164.908C115.356 165.638 115.195 166.346 114.977 167.029C114.781 167.71 114.588 168.348 114.4 168.944C114.849 169.868 115.323 170.747 115.821 171.581C116.341 172.411 116.966 173.1 117.697 173.647L118.037 173.598C118.367 173.551 118.621 173.557 118.797 173.615C119.045 173.727 119.306 173.932 119.58 174.229ZM113.634 162.076C113.307 162.734 113.175 163.426 113.238 164.154L113.309 164.649C113.392 165.226 113.534 165.848 113.735 166.513C113.823 166.248 113.922 165.908 114.03 165.492C114.136 165.056 114.209 164.614 114.25 164.166C114.261 163.807 114.243 163.462 114.196 163.132L114.165 162.916C114.091 162.547 113.914 162.268 113.634 162.076ZM112.513 168.994C112.309 168.16 112.099 167.285 111.883 166.369C111.744 165.842 111.638 165.321 111.564 164.805C111.513 164.455 111.475 164.113 111.448 163.78C111.12 163.406 110.706 163.087 110.205 162.822C109.704 162.557 109.17 162.36 108.605 162.231C108.039 162.102 107.451 162.039 106.841 162.043C106.485 162.052 106.152 162.079 105.842 162.123C105.595 162.159 105.349 162.205 105.105 162.261C104.395 162.447 103.791 162.713 103.293 163.058C102.793 163.383 102.363 163.76 102.004 164.191C101.836 164.636 101.654 165.125 101.457 165.658C101.26 166.192 101.099 166.752 100.973 167.338C100.867 167.922 100.816 168.518 100.819 169.128C100.831 169.358 100.852 169.576 100.882 169.782C100.938 170.174 101.036 170.56 101.175 170.94C101.305 171.258 101.482 171.611 101.706 172C101.948 172.365 102.21 172.727 102.494 173.087C102.797 173.443 103.107 173.767 103.423 174.058C103.759 174.346 104.074 174.564 104.369 174.711C104.823 174.941 105.334 175.056 105.903 175.059C106.262 175.07 106.638 175.048 107.03 174.992C107.236 174.962 107.441 174.922 107.644 174.872C108.295 174.568 108.851 174.193 109.313 173.748C109.776 173.302 110.191 172.822 110.558 172.306C110.926 171.79 111.259 171.247 111.556 170.679C111.873 170.107 112.193 169.545 112.513 168.994ZM138.782 168.563C138.717 168.699 138.626 168.87 138.508 169.076C138.411 169.28 138.294 169.486 138.155 169.695C138.038 169.902 137.918 170.098 137.798 170.283C137.674 170.449 137.556 170.581 137.445 170.682C137.35 170.758 137.206 170.853 137.012 170.965C136.835 171.053 136.639 171.155 136.424 171.27C136.206 171.365 135.978 171.461 135.74 171.558C135.522 171.653 135.333 171.732 135.174 171.797C135.074 171.833 134.989 171.898 134.918 171.992C134.865 172.063 134.809 172.113 134.75 172.142L134.657 172.156C134.554 172.171 134.469 172.162 134.401 172.129C134.316 172.121 134.211 172.125 134.087 172.143L133.963 172.161C133.76 172.211 133.561 172.292 133.367 172.404C133.193 172.514 133.024 172.58 132.859 172.604C132.57 172.645 132.211 172.634 131.781 172.569C131.35 172.505 130.982 172.432 130.676 172.349C130.431 172.258 130.213 172.132 130.021 171.97C129.827 171.787 129.582 171.623 129.287 171.476C129.013 171.326 128.754 171.205 128.509 171.114C128.282 170.999 128.086 170.88 127.921 170.756C127.753 170.612 127.652 170.427 127.62 170.2L127.584 170.173C127.552 169.947 127.593 169.646 127.707 169.272C127.905 169.18 128.086 169.123 128.251 169.099C128.436 169.072 128.606 169.079 128.759 169.121C129.051 169.247 129.329 169.428 129.595 169.663C129.857 169.878 130.121 170.103 130.387 170.339C130.673 170.571 130.988 170.715 131.333 170.771C131.981 170.888 132.594 170.905 133.171 170.822C133.542 170.769 133.896 170.666 134.232 170.512C135.089 170.178 135.795 169.677 136.352 169.008C136.925 168.315 137.336 167.508 137.582 166.589C137.85 165.667 137.924 164.719 137.805 163.747L137.774 163.531C137.688 162.933 137.537 162.397 137.322 161.922C137.08 161.41 136.792 160.946 136.459 160.531C136.125 160.116 135.757 159.748 135.353 159.427C134.946 159.086 134.541 158.755 134.137 158.434C133.093 158.058 132.097 157.938 131.149 158.074C131.025 158.092 130.903 158.12 130.782 158.159C129.722 158.395 128.72 158.823 127.778 159.443C127.142 159.85 126.519 160.276 125.91 160.722C125.297 161.147 124.823 161.657 124.488 162.252C124.872 163.313 125.241 164.417 125.596 165.566C125.968 166.691 126.292 167.844 126.567 169.025C126.759 169.924 126.922 170.837 127.056 171.765L127.189 172.693C127.329 173.957 127.365 175.235 127.299 176.529C127.278 176.974 127.27 177.427 127.273 177.89C127.277 178.353 127.267 178.796 127.244 179.22C127.244 179.662 127.209 180.078 127.139 180.467C127.089 180.853 126.992 181.203 126.848 181.519C126.654 181.926 126.348 182.285 125.93 182.598C125.512 182.911 125.068 183.122 124.6 183.231L124.383 183.262C123.992 183.319 123.617 183.278 123.261 183.14C122.819 182.993 122.494 182.639 122.288 182.08C121.682 180.504 121.243 178.841 120.97 177.091L120.922 176.751C120.687 175.122 120.592 173.505 120.634 171.899C120.659 170.169 120.84 168.502 121.178 166.896C121.515 165.29 121.979 163.834 122.57 162.528C122.508 162.095 122.321 161.669 122.008 161.251C121.716 160.83 121.437 160.428 121.172 160.046C120.906 159.663 120.735 159.277 120.658 158.888C120.634 158.87 120.621 158.851 120.618 158.831C120.568 158.48 120.697 158.135 121.006 157.796C121.165 157.879 121.339 157.917 121.528 157.911C121.737 157.902 121.9 157.941 122.018 158.029C122.198 158.551 122.423 159.013 122.691 159.417C122.977 159.796 123.262 160.166 123.545 160.525C123.84 160.377 124.109 160.202 124.353 159.998C124.595 159.774 124.836 159.55 125.078 159.326C125.34 159.099 125.593 158.884 125.837 158.68C126.102 158.474 126.392 158.295 126.707 158.145C126.804 158.088 126.915 158.052 127.039 158.034L127.131 158.02C127.155 158.038 127.187 158.044 127.229 158.038C127.332 158.023 127.442 157.986 127.56 157.927C127.813 157.786 128.064 157.623 128.311 157.44C128.579 157.255 128.86 157.088 129.155 156.94C129.467 156.769 129.813 156.614 130.193 156.475C130.375 156.428 130.59 156.387 130.838 156.351C131.044 156.321 131.262 156.3 131.492 156.288C132.199 156.376 132.813 156.477 133.335 156.592C133.854 156.686 134.327 156.828 134.754 157.019C135.202 157.207 135.627 157.451 136.028 157.752C136.426 158.031 136.847 158.402 137.292 158.864C137.838 159.438 138.292 160.11 138.655 160.878C139.036 161.623 139.298 162.417 139.44 163.26L139.458 163.383C139.576 164.208 139.592 165.048 139.504 165.902C139.402 166.801 139.161 167.688 138.782 168.563ZM125.712 176.252C125.699 175.433 125.656 174.545 125.581 173.587C125.507 172.924 125.422 172.263 125.327 171.603L125.212 170.799C125.058 169.874 124.89 169.003 124.71 168.187C124.53 167.371 124.345 166.672 124.156 166.089C124.046 165.768 123.896 165.452 123.704 165.143C123.512 164.834 123.394 164.672 123.35 164.657C123.312 164.684 123.287 164.73 123.275 164.794C123.263 164.859 123.24 164.915 123.204 164.962C122.973 165.838 122.767 166.825 122.588 167.924C122.41 169.023 122.28 170.168 122.198 171.358C122.117 172.549 122.111 173.749 122.179 174.96C122.198 175.673 122.256 176.37 122.354 177.05C122.422 177.525 122.511 177.996 122.62 178.464C122.744 179.036 122.923 179.62 123.156 180.218C123.41 180.813 123.803 181.273 124.333 181.596C124.696 181.481 124.965 181.232 125.141 180.849C125.338 180.462 125.474 180.011 125.547 179.496C125.644 178.998 125.692 178.454 125.691 177.865C125.714 177.293 125.721 176.756 125.712 176.252ZM167.836 169.058C167.815 169.356 167.792 169.633 167.766 169.889C167.742 170.166 167.66 170.399 167.519 170.588C166.402 170.433 165.407 170.102 164.535 169.596C163.683 169.087 162.884 168.508 162.138 167.857C161.392 167.207 160.663 166.533 159.953 165.835C159.239 165.117 158.483 164.468 157.684 163.888C157.549 164.413 157.486 165.001 157.495 165.652C157.502 166.282 157.532 166.93 157.586 167.596C157.639 168.262 157.683 168.929 157.716 169.598C157.769 170.264 157.774 170.884 157.73 171.459C157.468 171.686 157.234 171.814 157.028 171.844C156.822 171.873 156.551 171.891 156.215 171.897C156.041 171.712 155.929 171.518 155.879 171.314L155.843 171.067C155.825 170.943 155.816 170.808 155.816 170.66C155.807 170.451 155.817 170.229 155.846 169.993C155.899 169.775 155.929 169.539 155.934 169.286C155.98 168.29 155.96 167.198 155.874 166.011C155.787 164.824 155.664 163.6 155.504 162.339L155.397 161.597C155.252 160.586 155.086 159.579 154.899 158.574C154.68 157.343 154.449 156.176 154.207 155.075C154.041 154.362 153.838 153.686 153.599 153.047C153.378 152.384 153.137 151.734 152.877 151.098C152.635 150.439 152.393 149.779 152.151 149.119C151.908 148.459 151.682 147.766 151.472 147.038C151.614 146.849 151.798 146.665 152.024 146.485C152.122 146.429 152.232 146.392 152.356 146.374C152.521 146.351 152.692 146.368 152.868 146.427C153.459 147.458 153.965 148.564 154.387 149.745C154.83 150.923 155.207 152.152 155.518 153.434C155.846 154.692 156.127 155.988 156.361 157.322C156.615 158.654 156.86 159.987 157.094 161.321C157.5 161.073 157.895 160.743 158.277 160.33C158.678 159.894 159.062 159.417 159.429 158.901C159.818 158.383 160.183 157.846 160.524 157.292C160.865 156.738 161.18 156.219 161.468 155.735C161.533 155.6 161.634 155.427 161.773 155.218C161.932 155.006 162.102 154.802 162.285 154.608C162.485 154.389 162.69 154.202 162.899 154.046C163.105 153.869 163.311 153.766 163.517 153.736C163.809 153.715 164.059 153.774 164.269 153.912C164.434 154.036 164.534 154.221 164.57 154.469L164.596 154.654C164.599 154.822 164.558 154.975 164.473 155.114C164.405 155.229 164.315 155.336 164.204 155.437C164.089 155.516 163.965 155.608 163.833 155.711C163.718 155.791 163.615 155.879 163.524 155.977C163.182 156.383 162.839 156.854 162.495 157.387C162.171 157.918 161.818 158.463 161.436 159.023C161.074 159.581 160.69 160.13 160.284 160.673C159.895 161.192 159.464 161.633 158.99 161.995C159.893 163.15 160.863 164.189 161.901 165.113C162.96 166.034 164.028 166.954 165.108 167.872C165.668 167.96 166.145 168.133 166.54 168.392C166.935 168.651 167.367 168.873 167.836 169.058ZM183.557 156.095L183.606 156.436C183.671 156.889 183.702 157.327 183.7 157.748C183.703 158.063 183.722 158.345 183.758 158.592C183.785 158.778 183.82 158.951 183.865 159.113C183.771 160.221 183.537 161.297 183.16 162.34C182.784 163.384 182.277 164.32 181.638 165.148C180.997 165.956 180.218 166.615 179.302 167.126C178.64 167.495 177.916 167.735 177.133 167.848C176.824 167.892 176.501 167.918 176.165 167.924C175.075 167.954 174.11 167.756 173.27 167.33C172.45 166.901 171.734 166.309 171.12 165.555C170.507 164.802 170.001 163.917 169.602 162.901C169.2 161.864 168.886 160.773 168.658 159.627C168.587 159.279 168.523 158.909 168.467 158.518C168.41 158.126 168.361 157.712 168.32 157.276C168.281 156.86 168.231 156.436 168.168 156.003C168.109 155.591 168.039 155.18 167.96 154.77C167.886 154.402 167.776 154.007 167.631 153.586C167.534 153.348 167.472 153.136 167.445 152.95C167.427 152.826 167.423 152.722 167.432 152.636C167.458 152.38 167.534 152.18 167.661 152.035C167.808 151.888 167.983 151.789 168.187 151.738L168.279 151.725C168.444 151.701 168.614 151.709 168.788 151.747C168.988 151.823 169.186 151.953 169.38 152.135C169.496 152.792 169.602 153.461 169.7 154.141C169.798 154.822 169.886 155.504 169.963 156.187C169.999 156.582 170.043 156.965 170.096 157.336C170.233 158.285 170.406 159.196 170.616 160.071C170.897 161.294 171.299 162.404 171.821 163.402C172.341 164.38 173.082 165.147 174.046 165.703C174.32 165.853 174.619 165.957 174.944 166.016C175.288 166.072 175.639 166.095 175.995 166.086C176.352 166.076 176.717 166.056 177.091 166.023C177.483 165.966 177.854 165.913 178.205 165.863C179.259 165.29 180.058 164.554 180.603 163.655C181.165 162.732 181.632 161.739 182.005 160.675C182.022 159.915 182.026 159.209 182.017 158.558C182.004 157.887 181.973 157.228 181.922 156.583L181.642 154.634C181.509 154.001 181.346 153.309 181.154 152.558C180.983 152.393 180.835 152.172 180.711 151.895C180.62 151.698 180.558 151.486 180.525 151.259L180.503 151.104C180.485 150.833 180.523 150.586 180.617 150.362C180.711 150.138 180.9 149.984 181.182 149.901L181.306 149.884C181.554 149.848 181.747 149.873 181.885 149.958C182.047 150.061 182.174 150.211 182.266 150.409C182.354 150.585 182.415 150.787 182.447 151.014L182.461 151.107C182.479 151.378 182.492 151.618 182.501 151.827C182.54 152.095 182.608 152.422 182.705 152.808C182.8 153.173 182.898 153.559 182.998 153.966C183.116 154.349 183.224 154.733 183.322 155.119C183.44 155.502 183.518 155.827 183.557 156.095ZM192.078 166.173C192.04 166.347 191.947 166.507 191.8 166.655C191.673 166.799 191.52 166.905 191.34 166.973C191.24 167.009 191.128 167.035 191.005 167.053C190.922 167.065 190.838 167.067 190.753 167.058C190.544 167.067 190.356 167.01 190.191 166.886C189.668 164.856 189.137 162.849 188.599 160.864C188.058 158.858 187.592 156.862 187.202 154.877C186.98 153.772 186.79 152.673 186.633 151.58C186.506 150.694 186.399 149.804 186.312 148.911C186.11 146.92 186.073 144.905 186.201 142.866C186.398 142.774 186.59 142.715 186.775 142.688C186.899 142.67 187.024 142.663 187.151 142.666C187.434 142.73 187.683 142.852 187.898 143.032C187.87 145.035 187.958 147.033 188.16 149.024C188.24 150.023 188.352 151.017 188.494 152.007C188.633 152.976 188.805 153.952 189.009 154.932C189.374 156.88 189.817 158.794 190.34 160.676C190.884 162.556 191.463 164.388 192.078 166.173ZM208.828 152.462L208.877 152.802C208.942 153.256 208.974 153.693 208.971 154.114C208.974 154.43 208.994 154.711 209.029 154.958C209.056 155.144 209.092 155.318 209.136 155.48C209.043 156.588 208.808 157.663 208.432 158.707C208.056 159.75 207.548 160.686 206.91 161.514C206.268 162.322 205.489 162.981 204.573 163.492C203.911 163.861 203.188 164.102 202.404 164.214C202.095 164.259 201.772 164.284 201.436 164.29C200.346 164.321 199.381 164.123 198.541 163.696C197.722 163.267 197.005 162.675 196.392 161.922C195.778 161.168 195.272 160.283 194.873 159.267C194.472 158.23 194.157 157.139 193.929 155.993C193.858 155.645 193.794 155.276 193.738 154.884C193.682 154.492 193.633 154.078 193.591 153.642C193.552 153.227 193.502 152.803 193.44 152.37C193.38 151.957 193.311 151.546 193.231 151.137C193.157 150.769 193.048 150.374 192.903 149.953C192.805 149.714 192.743 149.502 192.717 149.316C192.699 149.193 192.694 149.088 192.703 149.003C192.729 148.746 192.806 148.546 192.932 148.401C193.079 148.254 193.255 148.155 193.458 148.105L193.551 148.091C193.716 148.068 193.885 148.075 194.059 148.113C194.259 148.19 194.457 148.319 194.652 148.501C194.767 149.158 194.874 149.827 194.972 150.508C195.069 151.188 195.157 151.87 195.234 152.554C195.27 152.948 195.314 153.331 195.368 153.702C195.504 154.651 195.677 155.563 195.887 156.438C196.168 157.66 196.57 158.77 197.092 159.769C197.612 160.746 198.354 161.513 199.318 162.069C199.592 162.219 199.891 162.324 200.215 162.382C200.56 162.438 200.91 162.461 201.267 162.452C201.623 162.443 201.989 162.422 202.363 162.389C202.755 162.333 203.126 162.279 203.476 162.229C204.531 161.656 205.33 160.921 205.874 160.022C206.436 159.099 206.904 158.106 207.277 157.042C207.294 156.281 207.297 155.576 207.288 154.925C207.276 154.253 207.244 153.594 207.193 152.949L206.913 151.001C206.78 150.367 206.617 149.675 206.425 148.924C206.254 148.759 206.107 148.538 205.983 148.261C205.891 148.064 205.829 147.852 205.797 147.625L205.774 147.47C205.756 147.199 205.794 146.952 205.889 146.728C205.983 146.504 206.171 146.351 206.454 146.268L206.577 146.25C206.825 146.214 207.018 146.239 207.157 146.325C207.319 146.428 207.445 146.578 207.537 146.775C207.626 146.952 207.686 147.154 207.719 147.38L207.732 147.473C207.75 147.744 207.763 147.984 207.773 148.193C207.811 148.462 207.879 148.789 207.977 149.174C208.071 149.54 208.169 149.926 208.269 150.332C208.388 150.715 208.496 151.099 208.593 151.485C208.711 151.868 208.79 152.194 208.828 152.462ZM203.22 143.102L203.238 143.226C203.288 143.576 203.24 143.825 203.093 143.973C202.952 144.161 202.757 144.274 202.51 144.309L202.474 144.283C202.227 144.318 201.959 144.283 201.67 144.177C201.399 144.048 201.197 143.888 201.064 143.696C200.967 143.605 200.909 143.497 200.892 143.374C200.88 143.291 200.888 143.206 200.918 143.117C200.95 142.902 201.162 142.693 201.554 142.489C201.789 142.371 202 142.299 202.185 142.272C202.392 142.242 202.574 142.269 202.733 142.351C202.987 142.504 203.149 142.754 203.22 143.102ZM196.618 143.515C196.995 143.208 197.317 143.035 197.585 142.997L197.74 142.974C198.017 142.998 198.223 143.115 198.359 143.327C198.421 143.466 198.465 143.628 198.492 143.813L198.532 144.092C198.515 144.41 198.435 144.663 198.294 144.852C198.153 145.041 197.959 145.153 197.711 145.189L197.649 145.197C197.358 145.218 197.007 145.048 196.597 144.686C196.565 144.606 196.544 144.536 196.535 144.474C196.511 144.309 196.533 144.169 196.601 144.054C196.648 143.942 196.66 143.803 196.636 143.638L196.618 143.515ZM231.046 154.161C231.1 155.268 230.966 156.235 230.642 157.06C230.337 157.862 229.882 158.58 229.279 159.214C228.693 159.824 227.992 160.367 227.176 160.842C226.384 161.335 225.536 161.804 224.632 162.25L224.385 162.285C223.457 162.419 222.616 162.424 221.861 162.301C221.024 162.19 220.26 161.994 219.567 161.715C218.874 161.436 218.226 161.098 217.622 160.7C217.017 160.303 216.402 159.907 215.778 159.513C215.657 159.846 215.606 160.296 215.624 160.861C215.639 161.406 215.619 161.925 215.564 162.417C215.529 162.906 215.404 163.282 215.189 163.544C215.077 163.644 214.949 163.705 214.805 163.726C214.578 163.758 214.286 163.706 213.929 163.567C213.817 163.373 213.748 163.183 213.721 162.998L213.703 162.874C213.691 162.644 213.69 162.413 213.698 162.18C213.707 161.947 213.714 161.704 213.72 161.451C213.717 161.283 213.703 161.116 213.68 160.951L213.64 160.673C213.774 159.265 213.858 157.727 213.892 156.059C213.926 154.391 213.839 152.762 213.631 151.171C213.578 150.8 213.504 150.432 213.409 150.067C213.314 149.701 213.221 149.346 213.13 149.002C213.035 148.637 212.962 148.279 212.912 147.928C212.865 147.598 212.87 147.271 212.929 146.947C212.787 146.694 212.659 146.386 212.544 146.024C212.425 145.641 212.316 145.246 212.215 144.84C212.112 144.412 211.998 143.987 211.874 143.563C211.767 143.115 211.643 142.691 211.502 142.29C211.416 141.987 211.314 141.644 211.196 141.261C211.101 140.043 211.039 140.831 211.009 140.624C210.992 140.501 210.986 140.386 210.991 140.28C210.991 139.985 211.097 139.77 211.309 139.634C211.368 139.605 211.439 139.584 211.521 139.572C211.748 139.54 212.081 139.586 212.52 139.713C213.096 141.377 213.624 143.143 214.103 145.01C214.582 146.878 214.966 148.748 215.257 150.622C215.539 150.244 215.797 149.839 216.029 149.406C216.282 148.969 216.537 148.543 216.792 148.128C217.066 147.689 217.353 147.268 217.653 146.867C217.974 146.464 218.343 146.105 218.761 145.793C219.315 145.397 219.892 145.093 220.493 144.881C220.876 144.762 221.274 144.674 221.686 144.614C221.892 144.585 222.11 144.564 222.34 144.552C222.947 144.528 223.545 144.589 224.134 144.736C224.721 144.862 225.265 145.057 225.766 145.322C226.402 145.652 227.028 146.119 227.641 146.726C228.254 147.332 228.807 148.031 229.3 148.824C229.79 149.595 230.196 150.442 230.518 151.364C230.713 151.988 230.856 152.62 230.948 153.259C230.993 153.568 231.025 153.869 231.046 154.161ZM228.896 156.774C229.16 155.684 229.217 154.613 229.066 153.561L229.03 153.314C228.829 152.206 228.471 151.184 227.958 150.248C227.444 149.311 226.812 148.497 226.06 147.806C225.308 147.114 224.518 146.596 223.689 146.252C223.197 146.197 222.745 146.198 222.333 146.258C222.065 146.296 221.82 146.353 221.599 146.426C220.978 146.642 220.43 146.931 219.956 147.294C219.479 147.636 219.042 148.036 218.645 148.493C218.265 148.926 217.904 149.347 217.563 149.753C217.404 150.26 217.191 150.754 216.923 151.235C216.653 151.694 216.406 152.172 216.182 152.667C215.979 153.159 215.852 153.662 215.799 154.174C215.77 154.41 215.772 154.641 215.804 154.868C215.852 155.198 215.952 155.531 216.106 155.867C216.038 156.129 216.022 156.384 216.058 156.631C216.061 156.652 216.074 156.671 216.098 156.689C216.136 156.957 216.214 157.209 216.332 157.444C216.471 157.677 216.628 157.886 216.802 158.071C216.976 158.257 217.157 158.42 217.346 158.562C217.652 158.791 218.01 159.013 218.42 159.228C218.83 159.443 219.238 159.647 219.645 159.841C220.072 160.032 220.486 160.204 220.887 160.357C221.309 160.507 221.674 160.633 221.984 160.736C222.364 160.745 222.729 160.724 223.079 160.673C223.43 160.623 223.776 160.542 224.118 160.429C224.801 160.205 225.442 159.902 226.039 159.522C226.637 159.141 227.176 158.716 227.656 158.247C228.133 157.758 228.546 157.267 228.896 156.774ZM248.421 146.769L248.47 147.109C248.535 147.563 248.567 148 248.564 148.422C248.567 148.737 248.587 149.018 248.622 149.266C248.649 149.451 248.684 149.625 248.729 149.787C248.635 150.895 248.401 151.97 248.025 153.014C247.648 154.057 247.141 154.993 246.502 155.822C245.861 156.629 245.082 157.289 244.166 157.799C243.504 158.168 242.781 158.409 241.997 158.521C241.688 158.566 241.365 158.591 241.029 158.597C239.939 158.628 238.974 158.43 238.134 158.003C237.315 157.574 236.598 156.983 235.985 156.229C235.371 155.475 234.865 154.59 234.466 153.574C234.065 152.537 233.75 151.446 233.522 150.3C233.451 149.953 233.387 149.583 233.331 149.191C233.275 148.799 233.226 148.385 233.184 147.949C233.145 147.534 233.095 147.11 233.033 146.677C232.973 146.264 232.904 145.853 232.824 145.444C232.75 145.076 232.64 144.681 232.496 144.26C232.398 144.021 232.336 143.809 232.09 143.624C232.292 143.5 232.287 143.395 232.296 143.31C232.322 143.053 232.399 142.853 232.525 142.709C232.672 142.561 232.847 142.462 233.051 142.412L233.144 142.399C233.309 142.375 233.478 142.382 233.652 142.42C233.852 142.497 234.05 142.626 234.244 142.809C234.36 143.466 234.467 144.134 234.564 144.815C234.662 145.495 234.75 146.177 234.827 146.861C234.863 147.255 234.907 147.638 234.961 148.01C235.097 148.958 235.27 149.87 235.48 150.745C235.761 151.967 236.163 153.078 236.685 154.076C237.205 155.054 237.946 155.82 238.91 156.376C239.184 156.526 239.484 156.631 239.808 156.689C240.153 156.745 240.503 156.768 240.86 156.759C241.216 156.75 241.581 156.729 241.956 156.696C242.347 156.64 242.719 156.587 243.069 156.536C244.123 155.964 244.923 155.228 245.467 154.329C246.029 153.406 246.496 152.413 246.87 151.349C246.887 150.589 246.89 149.883 246.881 149.232C246.868 148.56 246.837 147.902 246.786 147.256L246.506 145.308C246.373 144.674 246.21 143.982 246.018 143.231C245.847 143.066 245.7 142.845 245.576 142.569C245.484 142.371 245.422 142.159 245.389 141.932L245.367 141.778C245.349 141.507 245.387 141.259 245.481 141.035C245.575 140.811 245.764 140.658 246.047 140.575L246.17 140.557C246.418 140.522 246.611 140.546 246.749 140.632C246.911 140.735 247.038 140.885 247.13 141.082C247.218 141.259 247.279 141.461 247.312 141.687L247.325 141.78C247.343 142.051 247.356 142.291 247.365 142.501C247.404 142.769 247.472 143.096 247.57 143.482C247.664 143.847 247.762 144.233 247.862 144.639C247.98 145.022 248.088 145.406 248.186 145.792C248.304 146.175 248.382 146.501 248.421 146.769ZM242.813 137.409L242.831 137.533C242.881 137.883 242.833 138.132 242.686 138.28C242.544 138.469 242.35 138.581 242.103 138.616L242.067 138.59C241.82 138.625 241.552 138.59 241.263 138.484C240.992 138.355 240.79 138.195 240.657 138.003C240.56 137.912 240.502 137.805 240.484 137.681C240.472 137.598 240.481 137.513 240.511 137.425C240.543 137.209 240.755 137 241.146 136.796C241.382 136.678 241.593 136.606 241.778 136.579C241.984 136.55 242.167 136.576 242.326 136.658C242.58 136.811 242.742 137.062 242.813 137.409ZM236.211 137.822C236.588 137.515 236.91 137.342 237.178 137.304L237.333 137.282C237.61 137.305 237.816 137.423 237.952 137.635C238.014 137.773 238.058 137.935 238.085 138.121L238.125 138.399C238.108 138.717 238.028 138.971 237.887 139.159C237.746 139.348 237.551 139.46 237.304 139.496L237.242 139.505C236.95 139.526 236.6 139.355 236.19 138.993C236.157 138.913 236.137 138.843 236.128 138.781C236.104 138.616 236.126 138.476 236.194 138.361C236.241 138.249 236.252 138.11 236.229 137.945L236.211 137.822Z" fill="#1C2044"/>
      </g>
      <defs>
        <filter id={filterId} x="-7.6" y="-7.59978" width="307.545" height="219.117" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="3.8" result="effect1_foregroundBlur_86_1181"/>
        </filter>
      </defs>
    </svg>
  )

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white pt-10">

      {/* Profil Ana Bölümü (Sağa kaydırılmış mizanpaj) */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:pl-40 lg:pr-4 xl:pl-52 xl:pr-4 flex-grow flex flex-col lg:flex-row gap-8 py-6 z-10 relative">
        
        {/* SOL SÜTUN (%75): Profil Kartı, Arama ve Grid */}
        <div className="w-full lg:w-[75%] flex flex-col gap-6">
          
          {/* A. Profil Kartı (Köşeli, sol tarafında büyütülen keskin köşeli RAF logosu ve dev yuvarlak fotosu olan katmanlı tasarım) */}
          <div className="w-full bg-white rounded-none border border-slate-200/80 shadow-sm p-6 sm:p-8 pl-28 sm:pl-44 lg:pl-48 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative min-h-[200px]">
            
            {/* 1. KATMAN: Daha da Sola Kaydırılan (left-[-330px]), Crafty Girls Fontlu Köşeli "RAF kitap kulübü" Logosu (z-10) */}
            <div className="absolute left-[-220px] sm:left-[-280px] lg:left-[-330px] top-[-35px] sm:top-[-45px] z-10 shadow-2xl rounded-none border border-[#070825]/20 select-none pointer-events-none bg-[#070825]">
              <svg width="310" height="190" viewBox="0 0 272 167" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[230px] sm:w-[280px] lg:w-[310px] h-auto">
                <rect width="271.34" height="167" fill="#070825"/>
                {/* RAF Başlığı */}
                <path d="M41 112.5V17.125H66.75C72.4167 17.125 77.375 17.9583 81.625 19.625C85.875 21.2083 89.1667 23.7917 91.5 27.375C93.9167 30.9583 95.125 35.7917 95.125 41.875C95.125 48.4583 93.25 53.5417 89.5 57.125C85.75 60.7083 80.8333 63.2083 74.75 64.625C76.9167 65.375 78.9167 66.4167 80.75 67.75C82.6667 69 84.2083 70.5833 85.375 72.5C86.7917 74.75 88 77.5833 89 81C90 84.4167 90.875 88.0417 91.625 91.875C92.375 95.7083 93.0833 99.4583 93.75 103.125C94.4167 106.708 95.0833 109.833 95.75 112.5H83.5C82.8333 108.833 82.2083 105.167 81.625 101.5C81.125 97.8333 80.5417 94.2083 79.875 90.625C79.375 87.4583 78.4583 84.2083 77.125 80.875C75.7917 77.4583 73.9167 74.5833 71.5 72.25C69.1667 69.9167 66.0833 68.75 62.25 68.75H52.125V112.5H41ZM52.125 58.625H62.5C66.3333 58.625 69.8333 58.125 73 57.125C76.25 56.125 78.8333 54.4167 80.75 52C82.75 49.5833 83.75 46.2083 83.75 41.875C83.75 38.0417 82.875 35.0833 81.125 33C79.375 30.8333 77.0833 29.3333 74.25 28.5C71.4167 27.6667 68.3333 27.25 65 27.25H52.125V58.625ZM103.375 112.5L126.375 15.375H137.625L160.625 112.5H149.375L143.375 84.625H120.625L114.625 112.5H103.375ZM122.75 74.75H141.25L132 32.125L122.75 74.75ZM169 112.5V17.125H223.75V27.125H180.125V59.25H217.875V69.25H180.125V112.5H169Z" fill="#FAF8F6"/>
                {/* Crafty Girls Fontlu "kitap kulübü" Alt Yazısı */}
                <text x="136" y="152" textAnchor="middle" className="font-crafty fill-white tracking-widest" style={{ fontSize: "26px" }}>
                  kitap kulübü
                </text>
              </svg>
            </div>

            {/* 2. KATMAN: Dev Profil Fotosu / Çemberi (z-20 - Logonun Sağ Altını Kapatacak Şekilde Üstte) */}
            <div className="absolute left-[-35px] sm:left-[-45px] top-[25px] sm:top-[20px] w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-[#1a2542] rounded-full flex flex-col items-center justify-center text-white select-none border-4 border-[#fbf8f7] shadow-2xl z-20">
              
              {/* YENİ EKLENEN SEMBOL: Profil Fotosunun Dışında Hemen Sol Üstünde (z-30) - Artık Tıklanabilir Link */}
              <Link href="/settings" className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 z-30 drop-shadow-md cursor-pointer hover:scale-110 transition-transform select-none">
                <svg width="40" height="40" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10">
                  <g clipPath="url(#clip0_124_36_profile)">
                    <path d="M25.8767 12.7858C25.3209 10.3361 23.9767 8.20068 22.1413 6.64173C21.0943 5.7509 19.8793 5.05657 18.5609 4.59806C17.4106 4.19195 16.1697 3.96924 14.8772 3.96924C13.688 3.96924 12.5377 4.15264 11.4519 4.50636C9.92671 4.99107 8.54369 5.8033 7.38039 6.85133C5.58376 8.44959 4.30413 10.6243 3.81297 13.0871C3.64494 13.847 3.56738 14.633 3.56738 15.4321C3.56738 16.1002 3.61908 16.7684 3.73541 17.3972C4.16195 19.8863 5.37695 22.1002 7.10896 23.764C8.32395 24.9299 9.81038 25.8339 11.4519 26.3579C12.5377 26.7116 13.688 26.895 14.8772 26.895C16.1697 26.895 17.4106 26.6723 18.5609 26.2662C19.9956 25.7684 21.3011 24.9823 22.4256 23.9867C24.1835 22.3754 25.4502 20.2138 25.9543 17.764C26.1094 17.0173 26.1869 16.2312 26.1869 15.4321C26.1869 14.5151 26.0835 13.6374 25.8767 12.7858ZM14.8772 19.9256C12.4213 19.9256 10.4308 17.9212 10.4308 15.4321C10.4308 12.943 12.4213 10.9256 14.8772 10.9256C17.333 10.9256 19.3235 12.943 19.3235 15.4321C19.3235 17.9212 17.333 19.9256 14.8772 19.9256Z" fill="#ECCDDE"/>
                    <path d="M17.4235 0H12.5893C11.9612 0 11.4519 0.516143 11.4519 1.15284V5.06987C11.4519 5.70656 11.9612 6.22271 12.5893 6.22271H17.4235C18.0517 6.22271 18.5609 5.70656 18.5609 5.06987V1.15284C18.5609 0.516143 18.0517 0 17.4235 0Z" fill="#ECCDDE"/>
                    <path d="M17.4235 23.7773H12.5893C11.9612 23.7773 11.4519 24.2935 11.4519 24.9302V28.8472C11.4519 29.4839 11.9612 30.0001 12.5893 30.0001H17.4235C18.0517 30.0001 18.5609 29.4839 18.5609 28.8472V24.9302C18.5609 24.2935 18.0517 23.7773 17.4235 23.7773Z" fill="#ECCDDE"/>
                    <path d="M7.88156 21.9755L5.46596 17.7315C5.15205 17.18 4.45647 16.9908 3.91233 17.309L0.564718 19.2663C0.0205785 19.5845 -0.166062 20.2895 0.147844 20.841L2.56344 25.085C2.87735 25.6365 3.57293 25.8256 4.11707 25.5075L7.46469 23.5502C8.00882 23.232 8.19547 22.527 7.88156 21.9755Z" fill="#ECCDDE"/>
                    <path d="M29.4496 9.36759L27.034 5.12359C26.72 4.57208 26.0245 4.38292 25.4803 4.70107L22.1327 6.6584C21.5886 6.97656 21.4019 7.68155 21.7158 8.23306L24.1314 12.4771C24.4453 13.0286 25.1409 13.2177 25.6851 12.8996L29.0327 10.9422C29.5768 10.6241 29.7635 9.91909 29.4496 9.36759Z" fill="#ECCDDE"/>
                    <path d="M27.4156 25.5983L29.8356 21.3569C30.1501 20.8057 29.9642 20.1005 29.4204 19.7818L26.0748 17.8209C25.531 17.5022 24.8352 17.6906 24.5207 18.2418L22.1007 22.4832C21.7863 23.0344 21.9722 23.7396 22.516 24.0583L25.8616 26.0192C26.4054 26.3379 27.1012 26.1495 27.4156 25.5983Z" fill="#ECCDDE"/>
                    <path d="M5.4746 12.7248L7.89458 8.48334C8.20906 7.93216 8.02314 7.22697 7.47933 6.90824L4.13374 4.94735C3.58993 4.62862 2.89416 4.81705 2.57968 5.36822L0.159698 9.60966C-0.154778 10.1608 0.031135 10.866 0.574945 11.1848L3.92054 13.1456C4.46435 13.4644 5.16012 13.2759 5.4746 12.7248Z" fill="#ECCDDE"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_124_36_profile">
                      <rect width="30" height="30" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </Link>

              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="font-logo text-4xl sm:text-5xl md:text-6xl tracking-widest leading-none">RAF</span>
                  <span className="font-handwritten text-xs sm:text-sm text-accent-pink mt-1.5 leading-none">küratör</span>
                </div>
              )}
            </div>

            {/* Kart Sol/Orta İçerik */}
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              
              {/* Kullanıcı Bilgileri */}
              <div className="flex-grow w-full">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <h1 className="font-logo text-3xl lg:text-4xl text-[#1a2542] tracking-wide uppercase">
                      {profile.full_name}
                    </h1>
                  </div>
                  
                  {/* Biyografi */}
                  <p className="font-serif text-[15px] text-slate-500 italic lowercase pl-0.5">
                    {profile.bio}
                  </p>

                  {/* İstatistikler (Tıklanabilir Bağlantılar) */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 select-none justify-center sm:justify-start">
                    <Link 
                      href={`/profile/connections${isOwnProfile ? "" : `?username=${profile.username}`}`} 
                      className="hover:text-accent-pink transition-colors cursor-pointer"
                    >
                      <strong className="text-slate-600 hover:text-accent-pink font-semibold transition-colors">{followerCount}</strong> takipçi
                    </Link>
                    <span>•</span>
                    <Link 
                      href={`/profile/connections${isOwnProfile ? "" : `?username=${profile.username}`}`} 
                      className="hover:text-accent-pink transition-colors cursor-pointer"
                    >
                      <strong className="text-slate-600 hover:text-accent-pink font-semibold transition-colors">{followingCount}</strong> takip ediliyor
                    </Link>
                    <span>•</span>
                    <span><strong className="text-slate-600 font-semibold">{listCount}</strong> kitap</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Kart Sağ Üst Home İkonu (Search Sayfasındaki Dolu Ev İkonu) */}
            <Link 
              href="/" 
              className="absolute right-6 top-6 text-[#1a2542] hover:text-accent-pink transition-colors z-20"
              title="Ana Sayfaya Dön"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.22-.22v7.75A1.5 1.5 0 0 1 18 22.5h-4a1.5 1.5 0 0 1-1.5-1.5v-6a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v6A1.5 1.5 0 0 1 9 22.5H5A1.5 1.5 0 0 1 3.5 21v-7.75l-.22.22a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
              </svg>
            </Link>

            {/* Takip Et / Takibi Bırak Butonu (Başka birinin profili görüntülendiğinde çıkar, 3 sekme ikonunun biraz üstünde ve sağdan %40 dışarı taşar) */}
            {!isOwnProfile && (
              <button
                onClick={handleFollowClick}
                className="absolute bottom-[36px] z-20 text-white bg-[#1a2542] hover:bg-accent-pink pl-6 pr-16 py-2 rounded-2xl text-[13px] font-semibold transition-all duration-300 border-0 cursor-pointer select-none whitespace-nowrap lowercase shadow-lg flex items-center justify-start"
                style={{ 
                  left: "calc(100% - 75px)",
                  fontFamily: "'Kosugi Maru', sans-serif",
                  letterSpacing: "0.15em"
                }}
              >
                {isFollowing ? "takibi bırak" : "takip et"}
              </button>
            )}

            {/* Sekme Seçim Butonları (Kutunun Sağ Alt Köşesine Dışarı Taşacak Şekilde Absolute Konumlandırıldı) */}
            <div className="absolute bottom-[-16px] right-4 sm:right-6 flex items-center gap-6 z-20 select-none">
              
              {/* Bookmark İkonu (Okuma Listesi) */}
              <button
                onClick={() => setActiveTab("to_read")}
                className="bg-transparent border-0 p-0 transition-all duration-300 ease-in-out cursor-pointer scale-100 hover:scale-110 outline-none"
                title="Okuma Listesi"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  className={`w-7 h-7 fill-current stroke-current transition-colors duration-300 ${
                    activeTab === "to_read"
                      ? "text-accent-pink"
                      : "text-[#1a2542] hover:text-accent-pink"
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
              </button>

              {/* List İkonu (Okuduklarım) */}
              <button
                onClick={() => setActiveTab("read")}
                className="bg-transparent border-0 p-0 transition-all duration-300 ease-in-out cursor-pointer scale-100 hover:scale-110 outline-none"
                title="Okuduklarım"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  className={`w-7 h-7 fill-current stroke-current transition-colors duration-300 ${
                    activeTab === "read"
                      ? "text-accent-pink"
                      : "text-[#1a2542] hover:text-accent-pink"
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-3.75 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </button>

              {/* Kalp İkonu (Favoriler) */}
              <button
                onClick={() => setActiveTab("favorites")}
                className="bg-transparent border-0 p-0 transition-all duration-300 ease-in-out cursor-pointer scale-100 hover:scale-110 outline-none"
                title="Favorilerim"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  className={`w-7 h-7 fill-current stroke-current transition-colors duration-300 ${
                    activeTab === "favorites"
                      ? "text-accent-pink"
                      : "text-[#1a2542] hover:text-accent-pink"
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>

            </div>

          </div>

          {/* B ARAMA BARI VE C KİTAPLAR KUTUSU (SOLA KAYDIRILAN VE KUTUSU KOYULAŞTIRILAN ALAN) */}
          <div className="w-full flex flex-col gap-6 -ml-4 sm:-ml-8 lg:-ml-14 xl:-ml-20 transition-all">
            
            {/* B. İnteraktif Arama & Listeye Ekleme Barı */}
            <div ref={dropdownRef} className="w-full relative">
              <div className="w-full flex items-center bg-white rounded-full border border-slate-200/90 shadow-sm px-5 py-2.5 focus-within:border-accent-pink transition-colors">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder()}
                  className="w-full bg-transparent outline-none font-serif text-base text-[#1a2542] lowercase placeholder-slate-400"
                />
                <button 
                  className="text-[#1a2542] hover:text-accent-pink transition-colors ml-3 cursor-pointer"
                  title="Kitap Ara"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              {/* Arama Sonuçları Dropdown */}
              {showDropdown && (searchQuery.trim().length > 1) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden z-30 max-h-[320px] overflow-y-auto scrollbar-thin">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm font-serif text-slate-400 lowercase">
                      aranıyor...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm font-serif text-slate-400 lowercase">
                      kitap bulunamadı.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {searchResults.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleSearchAddBook(book)}
                          className="w-full flex items-center gap-4 p-3 hover:bg-[#fbf8f7] text-left transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                        >
                          <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                            {book.volumeInfo.imageLinks?.thumbnail ? (
                              <img 
                                src={book.volumeInfo.imageLinks.thumbnail} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 select-none">kapak yok</div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-sans font-semibold text-sm text-[#1a2542] line-clamp-1">
                              {book.volumeInfo.title}
                            </span>
                            <span className="font-serif text-xs text-slate-400 lowercase mt-0.5 line-clamp-1">
                              {book.volumeInfo.authors?.join(", ") || "bilinmeyen yazar"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* C. Kitaplar Kutusu veya Özel Listeler Kutusu */}
            <div className="w-full bg-[#efe6e1] p-5 sm:p-7 rounded-3xl border border-[#e2d5cd] shadow-sm min-h-[300px]">
              {activeTab === "read" ? (
                /* ÖZEL LİSTELER GÖRÜNÜMÜ */
                activeListDetail ? (
                  /* LİSTE DETAY GÖRÜNÜMÜ */
                  <div className="w-full flex flex-col gap-6">
                    {/* Liste Üst Detay Bilgisi */}
                    <div className="flex items-center justify-between border-b border-black/10 pb-4 select-none">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveListDetail(null)}
                          className="text-xs text-white bg-accent-pink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1 py-1.5 px-4 rounded-full shadow-sm border-0"
                          style={{ fontFamily: "'Kosugi Maru', sans-serif" }}
                        >
                          ← listelere geri dön
                        </button>
                        <span className="text-slate-400 font-serif lowercase">•</span>
                        <h4 className="font-koho font-bold text-2xl text-[#1a2542] lowercase">
                          {activeListDetail.name}
                        </h4>
                        <span className="bg-[#1a2542] text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none shadow-sm">
                          {activeListDetail.books.length} kitap
                        </span>
                      </div>

                      {/* Listeyi Silme Butonu */}
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            showCustomConfirm(
                              "listeyi sil",
                              `"${activeListDetail.name}" listesini silmek istediğinize emin misiniz? bu işlem geri alınamaz.`,
                              () => handleDeleteList(activeListDetail.id)
                            )
                          }}
                          className="text-xs text-white bg-[#1a2542] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1 font-semibold uppercase py-1.5 px-4 rounded-full shadow-sm border-0"
                          style={{ fontFamily: "'Kosugi Maru', sans-serif" }}
                          title="Listeyi Sil"
                        >
                          listeyi sil
                        </button>
                      )}
                    </div>

                    {/* Liste Kitapları Grid */}
                    {activeListDetail.books.length === 0 ? (
                      <div className="w-full py-14 text-center select-none">
                        <span className="font-serif text-slate-500 lowercase text-[15px]">
                          bu listede henüz kitap bulunmuyor. yukarıdaki arama barını kullanarak listeye kitap ekleyebilirsiniz!
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
                        {activeListDetail.books.map((item) => (
                          <div 
                            key={item.id}
                            className="group aspect-[2/3] bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm relative transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                          >
                            {/* Kitap Kapağı */}
                            <div className="w-full h-full bg-[#fbf8f7] relative">
                              {item.cover_url ? (
                                <img 
                                  src={item.cover_url} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                  <span className="font-sans font-medium text-xs text-slate-400 line-clamp-2">{item.title}</span>
                                  <span className="font-serif text-[10px] text-slate-300 lowercase mt-1">{item.authors[0]}</span>
                                </div>
                              )}
                            </div>

                            {/* HOVER EFEKTİ */}
                            <div className="absolute inset-0 bg-black/80 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 text-white">
                              <div className="flex justify-end select-none">
                                {isOwnProfile && (
                                  <button
                                    onClick={() => handleRemoveBookFromList(activeListDetail.id, item.id)}
                                    className="text-white/60 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                    title="Listeden Çıkar"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 items-center text-center select-none pt-2 border-t border-white/10">
                                <span className="font-sans font-semibold text-xs leading-tight line-clamp-2">{item.title}</span>
                                <span className="font-serif text-[10px] text-slate-400 line-clamp-1">{item.authors?.join(", ")}</span>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* LİSTE SEÇİM GÖRÜNÜMÜ */
                  <div className="w-full flex flex-col gap-6">
                    {/* Listeler Başlık Barı */}
                    <div className="flex items-center justify-between border-b border-black/10 pb-4 select-none">
                      <h4 className="font-koho font-semibold text-lg text-[#1a2542] lowercase">
                        okuma listelerim
                      </h4>
                    </div>

                    {/* Liste Kartları Grid (İlk kart + ekleme kartıdır) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-fade-in">
                      
                      {/* En Baştaki Yeni Liste Ekleme Kartı (Siyah Gölgeli ve + İşaretli) */}
                      {isOwnProfile && (
                        <div
                          onClick={() => {
                            showCustomPrompt(
                              "yeni liste oluştur",
                              "lütfen oluşturmak istediğiniz listenin adını yazın:",
                              "liste adı...",
                              (name) => {
                                if (name && name.trim()) {
                                  handleCreateList(name)
                                }
                              }
                            )
                          }}
                          className="group bg-gradient-to-b from-[#1a2542] to-[#070825] rounded-2xl p-4 border border-slate-700/30 shadow-lg relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between aspect-[2/3]"
                        >
                          <div className="flex-grow flex flex-col items-center justify-center text-white select-none">
                            <span className="text-5xl font-light mb-2 group-hover:scale-125 transition-transform duration-200 text-accent-pink">+</span>
                            <span className="font-koho font-semibold text-xs tracking-wider uppercase opacity-85 group-hover:opacity-100 transition-opacity">yeni liste</span>
                          </div>
                          <div className="mt-3 select-none">
                            <h4 className="font-koho font-semibold text-sm text-slate-300 lowercase line-clamp-1 group-hover:text-accent-pink transition-colors">
                              yeni liste oluştur
                            </h4>
                            <span className="font-serif text-[10px] text-slate-400 lowercase mt-0.5 block">
                              tıkla ve isimlendir
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Mevcut Özel Listeler */}
                      {customLists.map((list) => (
                        <div
                          key={list.id}
                          onClick={() => setActiveListDetail(list)}
                          className="group bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm relative transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col justify-between aspect-[2/3]"
                        >
                          {/* Kitap Kapakları 2x2 Kolajı */}
                          <div className="w-full aspect-[2/3] bg-[#fbf8f7] border border-slate-100 rounded-xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-1 p-1">
                            {list.books.slice(0, 4).map((b, i) => (
                              <div key={b.id || i} className="w-full h-full bg-slate-50 overflow-hidden rounded-md shadow-sm">
                                <img src={b.cover_url} className="w-full h-full object-cover" alt="" />
                              </div>
                            ))}
                            {Array.from({ length: Math.max(0, 4 - list.books.length) }).map((_, i) => (
                              <div key={i} className="w-full h-full bg-slate-100/70 border border-dashed border-slate-200 rounded-md flex items-center justify-center text-slate-300 text-sm font-light select-none">
                                +
                              </div>
                            ))}
                          </div>

                          {/* Liste Açıklama */}
                          <div className="mt-3 select-none">
                            <h4 className="font-koho font-semibold text-sm text-[#1a2542] lowercase group-hover:text-accent-pink transition-colors line-clamp-1">
                              {list.name}
                            </h4>
                            <span className="font-serif text-[10px] text-slate-400 lowercase mt-0.5 block">
                              {list.books.length} kitap
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                /* STANDART TABS (Favorites, To Read) */
                filteredBooks.length === 0 ? (
                  <div className="w-full py-14 text-center select-none">
                    <span className="font-serif text-slate-500 lowercase text-[15px]">
                      bu listede henüz kitap bulunmuyor. yukarıdaki arama barından ekleyebilirsiniz!
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredBooks.map((item) => (
                      <div 
                        key={item.id}
                        className="group aspect-[2/3] bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm relative transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                      >
                        
                        {/* Kitap Kapağı */}
                        <div className="w-full h-full bg-[#fbf8f7] relative">
                          {item.cover_url ? (
                            <img 
                              src={item.cover_url} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                              <span className="font-sans font-medium text-xs text-slate-400 line-clamp-2">{item.title}</span>
                              <span className="font-serif text-[10px] text-slate-300 lowercase mt-1">{item.authors[0]}</span>
                            </div>
                          )}

                          {/* Puan Kartı */}
                          {item.rating !== null && (
                            <div className="absolute top-2.5 left-2.5 bg-[#1a2542] text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none shadow-sm">
                              {item.rating}/10
                            </div>
                          )}
                        </div>

                        {/* HOVER EFEKTİ */}
                        <div className="absolute inset-0 bg-black/80 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 text-white">
                          
                          <div className="flex justify-end select-none">
                            {isOwnProfile && (
                              <button
                                onClick={() => handleDeleteBook(item.id)}
                                className="text-white/60 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                title="Listeden Kaldır"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 items-center select-none pt-2 border-t border-white/10">
                            
                            {/* 5 Yıldızlı İnteraktif Puanlama Sistemi */}
                            {isOwnProfile && (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-slate-400 lowercase">puan ver:</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const currentStars = item.rating ? Math.round(item.rating / 2) : 0
                                    const isFilled = star <= currentStars
                                    return (
                                      <button
                                        key={star}
                                        onClick={() => {
                                          const newRating = star === currentStars ? null : star * 2
                                          updateBookState(item.id, { rating: newRating })
                                        }}
                                        className="text-lg transition-transform duration-150 hover:scale-125 cursor-pointer outline-none"
                                        title={`${star} Yıldız`}
                                      >
                                        {isFilled ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-slate-500 hover:text-amber-300">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.15-.363.68-.363.83 0l2.235 5.377 5.86.471c.408.033.57.542.275.833l-4.243 3.633 1.293 5.422c.088.372-.3.659-.623.473L12 17.514l-4.887 2.99c-.324.187-.711-.1-.623-.473l1.293-5.422L3.44 11.013c-.295-.29-.133-.8-.275-.833l5.86-.471 2.236-5.377Z" />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Okuyor / Okudu Butonları (Aktifken Lacivert Yanan) */}
                            {isOwnProfile && (
                              <div className="flex gap-1.5 text-[9px] uppercase tracking-wider mt-1">
                                <button
                                  onClick={() => updateBookState(item.id, { status: "reading" })}
                                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                    item.status === "reading" ? "bg-[#1a2542] text-white font-bold" : "bg-zinc-800 text-slate-300 hover:text-white"
                                  }`}
                                >
                                  okuyor
                                </button>
                                <button
                                  onClick={() => updateBookState(item.id, { status: "read" })}
                                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                    item.status === "read" ? "bg-[#1a2542] text-white font-bold" : "bg-zinc-800 text-slate-300 hover:text-white"
                                  }`}
                                >
                                  okudu
                                </button>
                              </div>
                            )}

                          </div>

                        </div>

                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>

        </div>

        {/* SAĞ SÜTUN (%25): Güncel Okuma Alanı (Dikey Ribbon Şerit Hizalı Kitaplar) */}
        <div className="w-full lg:w-[25%] flex flex-col items-center justify-start select-none pt-2 relative z-10">
          <div className="relative flex flex-col items-center min-h-[580px] w-full">
            
            {/* Dikey Açık Pembe Şerit */}
            <div className="hidden lg:block absolute top-[-300px] bottom-[-300px] w-24 bg-[#f8dce2] z-0 shadow-sm border-l border-r border-[#f6d2da]/40 pointer-events-none left-1/2 -translate-x-1/2" />

            {/* 3 Adet Blurlu SVG Logo - Pembe Şeridin Arkasında (Orijinal SVG Blur Filtresi: stdDeviation="3.8") */}
            <div className="hidden lg:block absolute top-[-50px] bottom-[-50px] inset-x-0 pointer-events-none z-0">
              {/* 1. Logo (Aşağı çekilmiş konum: top-[130px]) */}
              <div className="absolute top-[130px] left-1/2 -translate-x-1/2 rotate-[-18deg] opacity-45">
                <BlurredSvgLogo filterId="filter_raf_bg_1" />
              </div>
              {/* 2. Logo (Aşağı çekilmiş konum: top-[350px]) */}
              <div className="absolute top-[350px] left-1/2 -translate-x-1/2 rotate-[16deg] opacity-45">
                <BlurredSvgLogo filterId="filter_raf_bg_2" />
              </div>
              {/* 3. Logo (Aşağı çekilmiş konum: top-[570px]) */}
              <div className="absolute top-[570px] left-1/2 -translate-x-1/2 rotate-[-10deg] opacity-45">
                <BlurredSvgLogo filterId="filter_raf_bg_3" />
              </div>
            </div>

            {/* Çember Çiziyormuş Gibi Duran El Yazısı SVG Başlığı (Kitapların Üzerinde) */}
            <div className="flex justify-center w-full select-none -mb-10 z-20 relative">
              <svg viewBox="0 0 340 145" className="w-72 h-32 overflow-visible">
                <path id="circle-text-path" d="M 15 115 C 60 0, 280 0, 325 115" fill="transparent" />
                <text className="font-handwritten fill-[#1a2542] tracking-wider" style={{ fontSize: "22px" }}>
                  <textPath href="#circle-text-path" startOffset="50%" textAnchor="middle">
                    güncel olarak okuduklarım
                  </textPath>
                </text>
              </svg>
            </div>

            {/* Dikey Eğik Kitaplar (Şeridin üstünde tam ortalanmış, 3D gölgeli ve beyaz çerçeveli) */}
            <div className="relative z-10 flex flex-col items-center gap-6 pt-12 w-full px-2">
              {readingBooks.length === 0 ? (
                <div className="w-[120px] h-[180px] rounded-xl border-2 border-dashed border-[#1a2542]/20 flex items-center justify-center text-center p-3 rotate-[-6deg] bg-white/70 mt-8 shadow-sm">
                  <span className="font-serif text-slate-400 lowercase text-[10px] leading-snug">
                    henüz okunan kitap yok.
                  </span>
                </div>
              ) : (
                readingBooks.map((item, idx) => {
                  const rotations = [
                    "rotate-[-12deg] -translate-x-2 translate-y-0 z-10",
                    "rotate-[10deg] translate-x-3 -translate-y-4 z-20",
                    "rotate-[-8deg] -translate-x-1 -translate-y-8 z-30"
                  ]
                  const rotationClass = rotations[idx % rotations.length]

                  return (
                    <div 
                      key={item.id}
                      className={`w-[125px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_35px_rgba(0,0,0,0.3)] border-2 border-white hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-300 cursor-pointer bg-zinc-800 relative group/reading ${rotationClass}`}
                      title={`${item.title} - ${item.authors[0]}`}
                    >
                      {item.cover_url ? (
                        <img 
                          src={item.cover_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-white">
                          <span className="text-[10px] font-sans font-bold leading-tight line-clamp-3">{item.title}</span>
                        </div>
                      )}

                      {/* Okundu Tamamlama İşareti */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateBookState(item.id, { status: "read" })
                        }}
                        className="absolute bottom-2 right-2 bg-[#1a2542] hover:bg-accent-pink text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover/reading:opacity-100 shadow-lg border border-white/20 transition-all cursor-pointer"
                        title="Okundu Olarak İşaretle"
                      >
                        ✓
                      </button>
                    </div>
                  )
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Alt Sınır: Pembe Şerit (2 Satıra indirildi, Crafty Girls) */}
      <div className="w-full overflow-hidden whitespace-nowrap py-3 border-t border-slate-200/50 select-none flex flex-col gap-1 mt-6">
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
