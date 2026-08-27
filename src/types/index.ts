import { Database } from "./database.types"

// Convenience mappings for DB Entities
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type Book = Database["public"]["Tables"]["books"]["Row"]
export type BookInsert = Database["public"]["Tables"]["books"]["Insert"]
export type BookUpdate = Database["public"]["Tables"]["books"]["Update"]

export type Review = Database["public"]["Tables"]["reviews"]["Row"]
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"]
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"]

export type UserBookStatus = Database["public"]["Tables"]["user_books_status"]["Row"]
export type UserBookStatusInsert = Database["public"]["Tables"]["user_books_status"]["Insert"]
export type UserBookStatusUpdate = Database["public"]["Tables"]["user_books_status"]["Update"]

// Enums and Custom types
export type ReadingStatus = "want_to_read" | "reading" | "read" | "abandoned"

// Google Books API Interface Definitions
export interface GoogleBookVolumeInfo {
  title: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  pageCount?: number
  printType?: string
  categories?: string[]
  averageRating?: number
  ratingsCount?: number
  imageLinks?: {
    smallThumbnail?: string
    thumbnail?: string
  }
  language?: string
  previewLink?: string
  infoLink?: string
  canonicalVolumeLink?: string
}

export interface GoogleBook {
  kind: "books#volume"
  id: string
  etag: string
  selfLink: string
  volumeInfo: GoogleBookVolumeInfo
  saleInfo?: {
    country: string
    saleability: string
    isEbook: boolean
    listPrice?: {
      amount: number
      currencyCode: string
    }
  }
  accessInfo?: {
    country: string
    viewability: string
    embeddable: boolean
    publicDomain: boolean
    textToHtmlLink?: string
  }
}

export interface GoogleBooksSearchResponse {
  kind: "books#volumes"
  totalItems: number
  items?: GoogleBook[]
}
