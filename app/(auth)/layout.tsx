import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-primary-gradient">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Logo Header */}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#FF6B35] p-1 shadow-xl">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="Savora"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
            </div>
            <span className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              Savora
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-white/70 text-sm">
          <p>&copy; 2026 Savora. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}