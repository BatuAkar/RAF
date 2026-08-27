"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface ConnectionProfile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
}

export default function ConnectionsPage() {
  const [followers, setFollowers] = useState<ConnectionProfile[]>([])
  const [following, setFollowing] = useState<ConnectionProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userSession, setUserSession] = useState<any>(null)
  const [targetUsername, setTargetUsername] = useState<string | null>(null)

  // Şerit için tekrarlayan metin (Ana sayfadakiyle birebir aynı, daha uzun)
  const repeatingRafText = Array(80).fill("RAF").join("  ")

  useEffect(() => {
    const loadConnections = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      setUserSession(session)

      const params = new URLSearchParams(window.location.search)
      const usernameParam = params.get("username")
      setTargetUsername(usernameParam)
      
      let targetUserId = session?.user?.id

      if (usernameParam) {
        try {
          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", usernameParam)
            .single()

          if (targetProfile) {
            targetUserId = targetProfile.id
          }
        } catch (err) {
          console.error("Hedef profil bulunamadı:", err)
        }
      }

      if (targetUserId) {
        try {
          // 1. Takipçileri Yükle (following_id = hedef kullanıcı id)
          const { data: followersList, error: followersErr } = await supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", targetUserId)

          if (!followersErr && followersList && followersList.length > 0) {
            const followerIds = followersList.map(f => f.follower_id)
            const { data: followerProfiles } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url, bio")
              .in("id", followerIds)

            if (followerProfiles) {
              setFollowers(followerProfiles as ConnectionProfile[])
            } else {
              setFollowers([])
            }
          } else {
            setFollowers([])
          }

          // 2. Takip Edilenleri Yükle (follower_id = hedef kullanıcı id)
          const { data: followingList, error: followingErr } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", targetUserId)

          if (!followingErr && followingList && followingList.length > 0) {
            const followingIds = followingList.map(f => f.following_id)
            const { data: followingProfiles } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url, bio")
              .in("id", followingIds)

            if (followingProfiles) {
              setFollowing(followingProfiles as ConnectionProfile[])
            } else {
              setFollowing([])
            }
          } else {
            setFollowing([])
          }
        } catch (err) {
          console.error("Sosyal veriler yüklenirken hata oluştu:", err)
        }
      } else {
        // Oturum açılmamışsa ve parametre yoksa fallback
        setFollowers([
          {
            id: "f1",
            username: "deniz_okur",
            full_name: "Deniz Yılmaz",
            avatar_url: "",
            bio: "klasik edebiyat sevdalısı. itü."
          },
          {
            id: "f2",
            username: "ceren_k",
            full_name: "Ceren Kaya",
            avatar_url: "",
            bio: "sanat tarihi ve kahve."
          }
        ])
        setFollowing([
          {
            id: "f3",
            username: "ali_b",
            full_name: "Ali Bulut",
            avatar_url: "",
            bio: "bilimkurgu ve distopik romanlar."
          }
        ])
      }
      setLoading(false)
    }

    loadConnections()
  }, [])

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col overflow-x-hidden relative selection:bg-accent-pink selection:text-white">
      
      {/* Üst Alan */}
      <div className="w-full flex flex-col">
        
        {/* Orijinal Pembe Şerit (Ana sayfadakiyle birebir aynı) */}
        <div className="w-full overflow-hidden whitespace-nowrap pt-8 pb-3 border-b-2 border-black select-none flex flex-col gap-1.5 relative z-30 bg-[#fbf8f7]">
          <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
            {repeatingRafText}
          </div>
          <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
            {repeatingRafText}
          </div>
          <div className="font-crafty text-xl lg:text-2xl text-accent-pink/35 tracking-[0.2em] leading-tight">
            {repeatingRafText}
          </div>
        </div>

      </div>

      {/* Alt Bölüm Konteyneri */}
      <div className="flex-grow w-full relative flex flex-col">
        
        {/* Profile Geri Dön Butonu - Şeritin hemen altında sol kenarda absolute */}
        <div className="absolute top-6 left-4 sm:left-6 z-40">
          <Link 
            href={targetUsername ? `/profile?username=${targetUsername}` : "/profile"} 
            className="text-accent-pink hover:scale-110 transition-transform duration-200 cursor-pointer shadow-sm flex items-center justify-center" 
            aria-label="Profile Geri Dön"
            title="Profile Geri Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* İki Sütunlu Grid */}
        <div className="flex-grow w-full max-w-6xl mx-auto px-6 sm:px-12 flex flex-col md:flex-row relative z-10">
          
          {/* SOL SÜTUN: Takipçiler */}
          <div className="w-full md:w-1/2 md:pr-10 pb-12 md:pb-16 pt-16 md:pt-20">
            <h3 className="font-koho font-semibold text-2xl text-[#1a2542] tracking-wider mb-8 uppercase pl-2 select-none">
              takipçiler
            </h3>

            {loading ? (
              <div className="py-10 text-center font-serif italic text-slate-400 lowercase select-none">yükleniyor...</div>
            ) : followers.length === 0 ? (
              <div className="py-10 text-center font-serif italic text-slate-400 lowercase select-none">
                henüz takipçiniz yok.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {followers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile?username=${user.username}`}
                    className="flex items-center gap-4 p-3 hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-slate-200/50 cursor-pointer text-left"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1a2542] flex-shrink-0 border border-slate-100 shadow-sm flex items-center justify-center text-white font-logo text-sm select-none">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.username.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans font-semibold text-sm text-[#1a2542]">
                        {user.full_name || user.username}
                      </span>
                      <span className="font-serif text-xs text-slate-500 lowercase line-clamp-1 mt-0.5">
                        {user.bio || "henüz biyografi eklememiş..."}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ORTAK DİKEY BÖLÜCÜ ÇİZGİ (Masaüstünde görünür - Siyah renkli, şeritin altından ekranın en altına kadar uzanan) */}
          <div className="hidden md:block w-[2px] bg-black self-stretch" />

          {/* SAĞ SÜTUN: Takip Edilenler */}
          <div className="w-full md:w-1/2 md:pl-10 pt-12 md:pt-20 pb-12 md:pb-16 border-t border-black md:border-t-0">
            <h3 className="font-koho font-semibold text-2xl text-[#1a2542] tracking-wider mb-8 uppercase pl-2 select-none">
              takip edilenler
            </h3>

            {loading ? (
              <div className="py-10 text-center font-serif italic text-slate-400 lowercase select-none">yükleniyor...</div>
            ) : following.length === 0 ? (
              <div className="py-10 text-center font-serif italic text-slate-400 lowercase select-none">
                henüz kimseyi takip etmiyorsunuz.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {following.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile?username=${user.username}`}
                    className="flex items-center gap-4 p-3 hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-slate-200/50 cursor-pointer text-left"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1a2542] flex-shrink-0 border border-slate-100 shadow-sm flex items-center justify-center text-white font-logo text-sm select-none">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.username.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans font-semibold text-sm text-[#1a2542]">
                        {user.full_name || user.username}
                      </span>
                      <span className="font-serif text-xs text-slate-500 lowercase line-clamp-1 mt-0.5">
                        {user.bio || "henüz biyografi eklememiş..."}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
