"use client"

import React from "react"
import Link from "next/link"

export default function BilgiPage() {
  const repeatingRafText = Array(25).fill("RAF").join("  ")

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between overflow-x-hidden relative selection:bg-accent-pink selection:text-white">
      
      {/* Üst Logo, Slogan ve Home İkonu */}
      <div className="pt-12 flex flex-col items-center select-none z-10">
        <Link href="/" className="flex items-baseline hover:opacity-85 transition-opacity">
          <span className="font-logo text-7xl lg:text-8xl font-normal tracking-[0.03em] text-white leading-none">RAF</span>
          <span className="font-logo text-2xl lg:text-3xl font-light text-white/90 ml-3">&CO.</span>
        </Link>
        <p className="font-handwritten text-xl lg:text-2xl text-white/80 mt-1">
          kitap kulübü
        </p>
        
        {/* Beyaz Home İkonu (Search sayfasındaki dolu ev ikonu) */}
        <Link 
          href="/" 
          className="mt-6 text-white/70 hover:text-accent-pink transition-colors"
          title="Ana Sayfaya Dön"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.22-.22v7.75A1.5 1.5 0 0 1 18 22.5h-4a1.5 1.5 0 0 1-1.5-1.5v-6a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v6A1.5 1.5 0 0 1 9 22.5H5A1.5 1.5 0 0 1 3.5 21v-7.75l-.22.22a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
          </svg>
        </Link>
      </div>

      {/* Orta Alan: Tanıtım Metinleri (Figma Birebir Paragraflar) */}
      <div className="flex-grow flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-[900px] text-center text-slate-300/90 font-sans text-[15px] sm:text-base leading-relaxed space-y-8 select-text">
          <p>
            Raf&co. , çevrimiçi ortamda okuduğunuz veya okumak istediğiniz kitapları profilinize ekleyebileceğiniz, arkadaşlarınızı takip edebileceğiniz dinamik bir dijital kitaplık rafıdır. Çıkış motivasyonumuz, insanların içindeki paylaşım ve bağ kurma ihtiyacına samimi bir yanıt verebilmekti. Okumak genelde bireysel bir eylem olsa da bazen bir cümle, bir karakter ya da seri ruhumuzda derin izler bırakır. Böyle anlarda yoğun duygu ve düşüncelerimizi başkalarına aktarmak isteriz. İşte RAF tam da bu noktada devreye girerek, kelimenin tam anlamıyla sizinle aynı sayfada olan insanları keşfetmenize olanak tanıyor. Kitapları sadece değerlendirdiğiniz bir araç olmanın ötesine geçiyor ve okuduklarınız üzerinden dijital kimliğinizi inşa edip kendinizi tanıtmanız için köprü vazifesi görüyor.
          </p>
          <p>
            Kurucumuz olan, okumayı çok seven İTÜ'lü bir mimarlık öğrencisi tarafından hayata geçirilen projemiz, "az çoktur" felsefesini merkeze alıyor. Hayatın minik detaylarla güzelleştiğine inanıyoruz ve bu yüzden platformumuza özel incelikler ekledik. Aylık kitap seçkilerimizle ilham veriyoruz. Ayrıca mekana duyduğumuz saygının yansıması olarak, sitemizin bekleme sayfalarında Türkiye'nin öne çıkan kütüphanelerine ve onları tasarlayan mimarlara yer veriyoruz. Yakında sahafları gezdiğimiz bir blog serisi eklemeyi ve okuma kültürünü destekleyecek marka iş birliklerini hayata geçirmeyi hedefliyoruz.
          </p>
          <p>
            Kendi dijital rafınızı oluşturmak oldukça zahmetsizdir. Gmail hesabınızı kullanarak saniyeler içinde profilinizi oluşturabilir ve hemen okuma yolculuğunuzu dijitalleştirmeye başlayabilirsiniz. Hesap açmak istemezseniz de kapımız daima açık; RAF web sitesini ziyaret edebilir, diğer okurların listelerine veya profillerine özgürce göz atabilirsiniz. Bu platformu kullanıcılarımızla birlikte şekillendirmek istediğimiz için her türlü öneri ve eleştiriniz bizim için çok kıymetli. Kitapların gücüne inandığımız bu yolda, edebiyatı dijitalle harmanlıyor, sizi de kendi rafınızı dizmeye davet ediyoruz.
          </p>
        </div>
      </div>

      {/* Alt Alan: İletişim Bilgileri */}
      <div className="pb-10 flex flex-col items-center select-none z-10 gap-1 text-center">
        <span className="font-serif text-sm text-slate-400 lowercase">iletişim için</span>
        <a 
          href="mailto:raf.co.kitap@gmail.com" 
          className="font-serif text-base text-white/90 hover:text-accent-pink hover:underline transition-colors"
        >
          raf.co.kitap@gmail.com
        </a>
      </div>

      {/* Alt Sınır: Koyu Zemin Üzeri BEYAZ Şerit (3 Satırlı, Crafty Girls fontuyla ve TAM BEYAZ) */}
      <div className="w-full overflow-hidden whitespace-nowrap py-3 border-t border-white/5 select-none flex flex-col gap-1">
        <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none">
          {repeatingRafText}
        </div>
        <div className="font-crafty text-xl lg:text-2xl text-[#FAF8F6] tracking-[0.2em] leading-none">
          {repeatingRafText}
        </div>
        <div className="font-crafty text-xl lg:text-2xl text-white tracking-[0.2em] leading-none">
          {repeatingRafText}
        </div>
      </div>

    </div>
  )
}
