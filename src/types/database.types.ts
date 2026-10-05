export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      books: {
        Row: {
          id: string
          title: string
          authors: string[] | null
          cover_url: string | null
          published_date: string | null
          created_at: string
        }
        Insert: {
          id: string
          title: string
          authors?: string[] | null
          cover_url?: string | null
          published_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          authors?: string[] | null
          cover_url?: string | null
          published_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          book_id: string
          rating: number | null
          content: string | null
          is_spoiler: boolean
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          rating?: number | null
          content?: string | null
          is_spoiler?: boolean
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          rating?: number | null
          content?: string | null
          is_spoiler?: boolean
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_books_status: {
        Row: {
          user_id: string
          book_id: string
          status: "to_read" | "reading" | "read"
          is_favorite: boolean
          rating: number | null
          added_at: string
        }
        Insert: {
          user_id: string
          book_id: string
          status?: "to_read" | "reading" | "read"
          is_favorite?: boolean
          rating?: number | null
          added_at?: string
        }
        Update: {
          user_id?: string
          book_id?: string
          status?: "to_read" | "reading" | "read"
          is_favorite?: boolean
          rating?: number | null
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_status_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
