import { GoogleBook, GoogleBooksSearchResponse } from "../types"

/**
 * Open Library API üzerinden kitap arayan yardımcı fonksiyon.
 * Hata fırlatmaz, hata durumunda konsola yazar ve boş dizi döner.
 */
async function searchOpenLibraryBooks(query: string): Promise<GoogleBook[]> {
  try {
    const encodedQuery = encodeURIComponent(query.trim())
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodedQuery}&limit=20`)

    if (!response.ok) {
      console.warn(`Open Library API response error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const docs = data.docs || []

    return docs.map((doc: any) => {
      const defaultPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Kapak Yok</text></svg>`
      const thumbnail = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : defaultPlaceholder

      return {
        kind: "books#volume",
        id: doc.key ? doc.key.replace("/works/", "") : Math.random().toString(36).substr(2, 9),
        etag: "",
        selfLink: "",
        volumeInfo: {
          title: doc.title || "Bilinmeyen Kitap",
          authors: doc.author_name && doc.author_name.length > 0
            ? doc.author_name
            : ["Bilinmeyen Yazar"],
          publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : "Yayın yılı belirsiz",
          description: doc.subtitle || "Bu kitap için açıklama bulunmuyor.",
          pageCount: doc.number_of_pages_median || 0,
          imageLinks: {
            thumbnail,
            smallThumbnail: thumbnail,
          },
        },
      } as GoogleBook
    })
  } catch (error) {
    console.error("Open Library API arama hatası:", error)
    return []
  }
}

/**
 * Kitap arama ana fonksiyonu.
 * Next.js Dev Mode'da kırmızı hata ekranı çıkarmaması için throw kullanmaz.
 * Google Books API (Anahtarlı/Anahtarsız) ve Open Library API'leri arasında pürüzsüz geçiş yapar.
 */
export async function searchBooks(query: string): Promise<GoogleBook[]> {
  if (!query || !query.trim()) {
    return []
  }

  const encodedQuery = encodeURIComponent(query.trim())
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY

  const executeGoogleFetch = async (useKey: boolean): Promise<Response> => {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=20`
    if (useKey && apiKey) {
      url += `&key=${apiKey}`
    }
    return await fetch(url)
  }

  // 1. Google Books API Denemesi
  try {
    let response: Response | null = null

    if (apiKey) {
      response = await executeGoogleFetch(true)
      if (response.status === 503) {
        console.warn("Google Books API anahtarı 503 hatası verdi. Anahtarsız Google API deneniyor...")
        response = await executeGoogleFetch(false)
      }
    } else {
      response = await executeGoogleFetch(false)
    }

    if (response && response.ok) {
      const data: GoogleBooksSearchResponse = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items.map((item) => {
          const volumeInfo = item.volumeInfo || {}
          const defaultPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Kapak Yok</text></svg>`

          return {
            ...item,
            volumeInfo: {
              ...volumeInfo,
              title: volumeInfo.title || "Bilinmeyen Kitap",
              authors: volumeInfo.authors && volumeInfo.authors.length > 0
                ? volumeInfo.authors
                : ["Bilinmeyen Yazar"],
              publishedDate: volumeInfo.publishedDate || "Yayın yılı belirsiz",
              description: volumeInfo.description || "Bu kitap için açıklama bulunmuyor.",
              pageCount: volumeInfo.pageCount || 0,
              imageLinks: {
                thumbnail: volumeInfo.imageLinks?.thumbnail || defaultPlaceholder,
                smallThumbnail: volumeInfo.imageLinks?.smallThumbnail || defaultPlaceholder,
              },
            },
          }
        })
      }
    } else {
      if (response && response.status === 429) {
        console.warn("Google Books API kotası aşıldı (429). Yedek kanala geçilecek...")
      } else {
        console.warn(`Google Books API yanıt vermedi: ${response?.status || 'Bilinmiyor'}. Yedek kanala geçilecek...`)
      }
    }
  } catch (googleError) {
    console.warn("Google Books API isteğinde hata. Yedek kanala geçiliyor...", googleError)
  }

  // 2. Yedek Kanal Denemesi (Open Library API)
  console.info("Open Library yedek kanalı üzerinden arama gerçekleştiriliyor...")
  const openLibraryResults = await searchOpenLibraryBooks(query)
  
  if (openLibraryResults.length > 0) {
    return openLibraryResults
  }

  // Tüm kaynaklar başarısız olursa boş dizi dön (Hata fırlatma!)
  return []
}
