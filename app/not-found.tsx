import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#264653] via-[#2A9D8F] to-[#E76F51] p-4">
      <div className="text-center">
        <div className="mb-8 animate-scale-in">
          <div className="inline-block p-8 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/50 shadow-2xl">
            <svg
              className="w-32 h-32 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-8xl font-bold text-white mb-4 animate-fade-in">
          404
        </h1>
        
        <h2 className="text-3xl font-bold text-white mb-4 animate-fade-in">
          Halaman Tidak Ditemukan
        </h2>
        
        <p className="text-xl text-white/90 mb-8 max-w-md mx-auto animate-fade-in">
          Maaf, resep yang Anda cari sepertinya belum tersedia di dapur kami! 🍳
        </p>

        <div className="flex gap-4 justify-center animate-fade-in">
          <Link
            href="/home"
            className="px-8 py-4 bg-white text-[#E76F51] rounded-2xl font-bold text-lg hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
          >
            Kembali ke Beranda
          </Link>
          
          <Link
            href="/search"
            className="px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold text-lg border-2 border-white/50 hover:bg-white/30 transition-all hover:scale-105"
          >
            Cari Resep Lain
          </Link>
        </div>

        <div className="mt-12 text-white/70 text-sm">
          <p>Atau hubungi tim kami jika ada masalah</p>
        </div>
      </div>
    </div>
  )
}