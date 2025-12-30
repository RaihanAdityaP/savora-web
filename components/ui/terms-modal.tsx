'use client'

import { X, Shield, AlertTriangle, FileText, Scale, Ban } from 'lucide-react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
        <div className="bg-gradient-to-br from-[#E76F51] via-[#F4A261] to-[#E9C46A] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">Syarat & Ketentuan</h3>
                <p className="text-white/90 text-sm font-medium mt-1">Harap dibaca dengan seksama</p>
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
              <div className="w-2 h-2 rounded-full bg-[#E76F51]"></div>
              <span>Terakhir diperbarui: 30 Desember 2025</span>
            </div>

            {/* Section 1 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#E76F51]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E76F51]/20 transition-colors">
                  <span className="text-[#E76F51] font-black text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Penerimaan Ketentuan</h4>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed ml-11">
                Dengan mengakses dan menggunakan platform Savora, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan layanan kami.
              </p>
            </div>

            {/* Section 2 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#2A9D8F]/20 transition-colors">
                  <span className="text-[#2A9D8F] font-black text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Konten yang Diunggah</h4>
                </div>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Pengguna bertanggung jawab penuh atas konten yang mereka unggah, termasuk:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Resep masakan dan tutorial memasak', 'Foto dan video yang diunggah', 'Komentar dan ulasan', 'Informasi profil'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F]"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3 - CRITICAL */}
            <div className="group bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold text-red-900 text-lg">Hak Kekayaan Intelektual</h4>
                  </div>
                  <div className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full mb-3">
                    SANGAT PENTING
                  </div>
                </div>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-red-900 leading-relaxed font-semibold">
                  Savora <span className="bg-red-200 px-2 py-0.5 rounded">TIDAK bertanggung jawab</span> atas pelanggaran hak cipta, merek dagang, atau hak kekayaan intelektual lainnya yang dilakukan oleh pengguna.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Dengan mengunggah konten, Anda menyatakan bahwa:
                </p>
                <div className="space-y-2">
                  {[
                    'Anda memiliki hak penuh atas konten yang diunggah, ATAU',
                    'Anda telah mendapatkan izin yang sah untuk membagikan konten tersebut',
                    'Konten tidak melanggar hak cipta pihak ketiga',
                    'Anda bertanggung jawab penuh atas segala klaim hukum terkait konten yang Anda unggah'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#F4A261]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F4A261]/20 transition-colors">
                  <span className="text-[#F4A261] font-black text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Pembatasan Tanggung Jawab</h4>
                </div>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Savora bertindak sebagai platform berbagi resep dan <strong>TIDAK bertanggung jawab</strong> atas:
                </p>
                <div className="space-y-2">
                  {[
                    'Keakuratan informasi resep yang dibagikan pengguna',
                    'Kerugian atau cedera yang timbul dari mengikuti resep',
                    'Pelanggaran hak cipta atau kekayaan intelektual oleh pengguna',
                    'Interaksi atau transaksi antar pengguna',
                    'Kehilangan data atau konten',
                    'Kerusakan perangkat akibat penggunaan platform'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                      <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Larangan Konten</h4>
                </div>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Pengguna dilarang mengunggah konten yang:
                </p>
                <div className="space-y-2">
                  {[
                    'Melanggar hak cipta, merek dagang, atau hak kekayaan intelektual pihak lain',
                    'Mengandung unsur SARA, pornografi, atau kekerasan',
                    'Menyesatkan, palsu, atau penipuan',
                    'Melanggar hukum yang berlaku di Indonesia',
                    'Mengandung virus, malware, atau kode berbahaya'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remaining sections condensed */}
            {[
              { num: 6, title: 'Moderasi Konten', color: 'blue', text: 'Savora berhak untuk meninjau, menyetujui, menolak, atau menghapus konten yang dianggap melanggar syarat dan ketentuan ini tanpa pemberitahuan sebelumnya.' },
              { num: 7, title: 'Akun Pengguna', color: 'purple', text: 'Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda. Savora tidak bertanggung jawab atas kerugian yang timbul dari akses tidak sah ke akun Anda.' },
              { num: 8, title: 'Penghentian Layanan', color: 'pink', text: 'Savora berhak untuk menangguhkan atau menghentikan akses Anda ke platform jika terbukti melanggar syarat dan ketentuan ini, tanpa kompensasi apapun.' },
              { num: 9, title: 'Perubahan Ketentuan', color: 'indigo', text: 'Savora berhak untuk mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan berlaku segera setelah dipublikasikan di platform.' },
              { num: 10, title: 'Hukum yang Berlaku', color: 'slate', text: 'Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa akan diselesaikan di pengadilan yang berwenang di Indonesia.' }
            ].map((section) => (
              <div key={section.num} className="group">
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-${section.color}-100 flex items-center justify-center flex-shrink-0 group-hover:bg-${section.color}-200 transition-colors`}>
                    <span className={`text-${section.color}-600 font-black text-sm`}>{section.num}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">{section.title}</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed ml-11">{section.text}</p>
              </div>
            ))}

            {/* Final Disclaimer */}
            <div className="mt-8 p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200/30 rounded-full -mr-10 -mt-10"></div>
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="font-bold text-yellow-900 mb-2 text-base">DISCLAIMER PENTING</h5>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    Dengan menggunakan Savora, Anda <strong>membebaskan platform dan pengelolanya</strong> dari segala tuntutan hukum terkait konten yang diunggah oleh pengguna, termasuk namun tidak terbatas pada pelanggaran hak cipta, cedera, atau kerugian material.
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
            className="w-full py-4 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-2xl font-bold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Saya Mengerti & Menyetujui
          </button>
        </div>
      </div>
    </div>
  )
}