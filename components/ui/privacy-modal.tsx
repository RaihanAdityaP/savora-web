'use client'

import { X, Lock, Eye, Share2, Database, Shield, UserCheck, Clock, Cookie, Baby, Mail } from 'lucide-react'

interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="bg-gradient-to-br from-[#2A9D8F] via-[#264653] to-[#1a5c54] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">Kebijakan Privasi</h3>
                <p className="text-white/90 text-sm font-medium mt-1">Perlindungan data Anda adalah prioritas kami</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(85vh-240px)]">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 pb-4 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full bg-[#2A9D8F]"></div>
              <span>Terakhir diperbarui: 30 Desember 2025</span>
            </div>

            {/* Section 1 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#2A9D8F]/20 transition-colors">
                  <Database className="w-5 h-5 text-[#2A9D8F]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Informasi yang Kami Kumpulkan</h4>
                </div>
              </div>
              <div className="ml-13 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Kami mengumpulkan informasi berikut saat Anda menggunakan Savora:
                </p>
                <div className="space-y-2">
                  {[
                    { icon: UserCheck, title: 'Informasi Akun', desc: 'Email, username, nama lengkap, foto profil' },
                    { icon: Eye, title: 'Konten', desc: 'Resep, foto, video, komentar, dan ulasan yang Anda unggah' },
                    { icon: Share2, title: 'Aktivitas', desc: 'Resep yang Anda simpan, ikuti, dan rating yang diberikan' },
                    { icon: Database, title: 'Data Teknis', desc: 'Alamat IP, browser, perangkat, dan log aktivitas' },
                    { icon: Cookie, title: 'Cookies', desc: 'Data untuk menjaga sesi login dan preferensi' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-[#2A9D8F]/5 to-transparent p-3 rounded-xl border border-[#2A9D8F]/10">
                      <div className="w-8 h-8 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Penggunaan Informasi</h4>
                </div>
              </div>
              <div className="ml-13 space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Informasi yang kami kumpulkan digunakan untuk:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Menyediakan dan meningkatkan layanan platform',
                    'Memproses autentikasi dan keamanan akun',
                    'Menampilkan konten yang relevan dan personal',
                    'Mengirim notifikasi terkait aktivitas akun',
                    'Menganalisis penggunaan platform untuk perbaikan',
                    'Mencegah penyalahgunaan dan aktivitas ilegal',
                    'Mematuhi kewajiban hukum'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-green-900 text-lg mb-2">Berbagi Informasi</h4>
                  <div className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    TIDAK DIJUAL
                  </div>
                </div>
              </div>
              <div className="ml-13 space-y-3">
                <p className="text-sm text-green-900 leading-relaxed font-semibold">
                  Kami <span className="bg-green-200 px-2 py-0.5 rounded">TIDAK menjual</span> data pribadi Anda.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Informasi Anda dapat dibagikan dalam kondisi berikut:
                </p>
                <div className="space-y-2">
                  {[
                    { title: 'Konten Publik', desc: 'Resep, profil, dan komentar yang Anda publikasikan dapat dilihat pengguna lain' },
                    { title: 'Penyedia Layanan', desc: 'Supabase (database), Vercel (hosting), dan layanan pihak ketiga terpercaya lainnya' },
                    { title: 'Kewajiban Hukum', desc: 'Jika diminta oleh otoritas yang berwenang' },
                    { title: 'Perlindungan Hak', desc: 'Untuk melindungi hak, properti, atau keamanan Savora dan penggunanya' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-green-200">
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Keamanan Data</h4>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed ml-13">
                Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda, termasuk enkripsi, kontrol akses, dan monitoring keamanan. Namun, tidak ada sistem yang 100% aman dari serangan cyber. Anda bertanggung jawab untuk menjaga kerahasiaan password akun Anda.
              </p>
            </div>

            {/* Section 5 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Hak Pengguna</h4>
                </div>
              </div>
              <div className="ml-13 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Anda memiliki hak untuk:
                </p>
                <div className="space-y-2">
                  {[
                    { title: 'Akses', desc: 'Melihat data pribadi yang kami simpan' },
                    { title: 'Koreksi', desc: 'Memperbarui informasi yang tidak akurat' },
                    { title: 'Penghapusan', desc: 'Menghapus akun dan data pribadi Anda' },
                    { title: 'Portabilitas', desc: 'Mengunduh data Anda dalam format terstruktur' },
                    { title: 'Keberatan', desc: 'Menolak pemrosesan data tertentu' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-indigo-50 p-3 rounded-lg">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 italic">
                  Untuk menggunakan hak ini, hubungi kami melalui email atau fitur kontak di platform.
                </p>
              </div>
            </div>

            {/* Condensed sections */}
            {[
              { num: 6, icon: Clock, color: 'orange', title: 'Retensi Data', text: 'Kami menyimpan data Anda selama akun Anda aktif dan periode wajar setelahnya untuk keperluan hukum dan keamanan. Data yang sudah tidak diperlukan akan dihapus secara berkala.' },
              { num: 7, icon: Cookie, color: 'amber', title: 'Cookies dan Teknologi Pelacakan', text: 'Kami menggunakan cookies untuk menjaga sesi login, mengingat preferensi, dan menganalisis penggunaan platform. Anda dapat mengatur browser untuk menolak cookies, namun beberapa fitur mungkin tidak berfungsi dengan baik.' },
              { num: 8, icon: Baby, color: 'pink', title: 'Privasi Anak-anak', text: 'Platform ini tidak ditujukan untuk anak-anak di bawah 13 tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari anak-anak. Jika kami mengetahui adanya data anak-anak, kami akan segera menghapusnya.' },
              { num: 9, icon: Eye, color: 'slate', title: 'Perubahan Kebijakan', text: 'Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di platform. Penggunaan platform setelah perubahan berarti Anda menyetujui kebijakan yang baru.' }
            ].map((section) => (
              <div key={section.num} className="group">
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-${section.color}-100 flex items-center justify-center flex-shrink-0 group-hover:bg-${section.color}-200 transition-colors`}>
                    <section.icon className={`w-5 h-5 text-${section.color}-600`} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">{section.title}</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed ml-13">{section.text}</p>
              </div>
            ))}

            {/* Contact Section */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                  <Mail className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Kontak</h4>
                </div>
              </div>
              <div className="ml-13 space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-teal-50 p-3 rounded-lg">
                    <Mail className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Email</p>
                      <p className="text-sm text-gray-900 font-medium">privacy@savora.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-teal-50 p-3 rounded-lg">
                    <Eye className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Website</p>
                      <p className="text-sm text-gray-900 font-medium">savora-web.vercel.app</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Commitment */}
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-10 -mt-10"></div>
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="font-bold text-blue-900 mb-2 text-base">Komitmen Kami</h5>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Kami berkomitmen untuk melindungi privasi Anda dan menggunakan data Anda secara bertanggung jawab sesuai dengan hukum yang berlaku di Indonesia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#2A9D8F] to-[#264653] text-white rounded-2xl font-bold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            Saya Mengerti & Menyetujui
          </button>
        </div>
      </div>
    </div>
  )
}