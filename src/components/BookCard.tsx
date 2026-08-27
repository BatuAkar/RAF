import React from "react"
import { GoogleBook } from "../types"

interface BookCardProps {
  book: GoogleBook
  onAddClick?: (book: GoogleBook) => void
}

export const BookCard: React.FC<BookCardProps> = ({ book, onAddClick }) => {
  const { title, authors, publishedDate, imageLinks } = book.volumeInfo
  const thumbnail = imageLinks?.thumbnail

  // Tarihten sadece yılı çekiyoruz
  const publishYear = publishedDate
    ? publishedDate.split("-")[0]
    : "Bilinmiyor"

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white border border-slate-200/80 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div>
        {/* Kitap Kapağı Alanı */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-50 shadow-sm border border-slate-100">
          <img
            src={thumbnail}
            alt={`${title} kapak görseli`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Üzerine gelindiğinde yumuşak degrade overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Kitap Bilgileri */}
        <div className="mt-3 px-1">
          <h3 className="line-clamp-2 text-xs font-semibold text-[#1e293b] group-hover:text-accent-pink transition-colors duration-200" title={title}>
            {title}
          </h3>
          <p className="mt-1 truncate text-[10px] text-slate-400">
            {authors?.join(", ")}
          </p>
        </div>
      </div>

      {/* Kart Alt Bilgisi */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 px-1">
        <span className="text-[9px] font-medium tracking-wider text-slate-400">
          {publishYear}
        </span>
        <button 
          onClick={() => onAddClick?.(book)}
          className="rounded-full bg-slate-50 p-1 text-slate-400 hover:bg-accent-pink hover:text-white transition-colors duration-200 cursor-pointer"
          aria-label="Kitabı rafa ekle"
          title="Kitabı rafa ekle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-3 w-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
