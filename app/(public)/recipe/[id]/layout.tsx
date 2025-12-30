'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, ChefHat, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// KONFIGURASI API
const CHAT_CONFIG = {
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  API_KEY: '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', 
  MODEL: 'llama-3.3-70b-versatile',
  SYSTEM_PROMPT: `Anda adalah Chef AI dari Savora, asisten memasak cerdas yang ramah dan membantu.

Tugas Anda:
- Menjawab pertanyaan tentang memasak dalam Bahasa Indonesia
- Memberikan tips praktis dan mudah dipahami
- Menjelaskan dengan detail tapi tidak bertele-tele
- Selalu ramah dan suportif
- Fokus pada resep Indonesia dan internasional`,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1500,
  TOP_P: 0.9,
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function RecipeLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hai! Saya asisten memasak pintar dari Savora.\n\nSaya bisa bantu kamu dengan:\n\n• Pertanyaan seputar resep\n• Tips dan trik memasak\n• Substitusi bahan\n• Saran menu dan variasi\n• Teknik memasak\n\nAda yang ingin ditanyakan?'
      }])
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch(CHAT_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CHAT_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CHAT_CONFIG.MODEL,
          messages: [
            {
              role: 'system',
              content: CHAT_CONFIG.SYSTEM_PROMPT
            },
            ...messages.slice(1).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: CHAT_CONFIG.TEMPERATURE,
          max_tokens: CHAT_CONFIG.MAX_TOKENS,
          top_p: CHAT_CONFIG.TOP_P,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('API Response:', data)
      
      if (!data) {
        throw new Error('Response is null or undefined')
      }

      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('No choices in response')
      }

      const message = data.choices[0]?.message
      if (!message || !message.content) {
        throw new Error('No message content in response')
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: message.content
      }])

    } catch (error) {
      console.error('Chat error:', error)
      
      let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.'
      
      if (error instanceof Error) {
        if (error.message.includes('API Error')) {
          errorMessage = 'Maaf, layanan AI sedang sibuk. Silakan coba lagi dalam beberapa saat.'
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Maaf, koneksi internet bermasalah. Periksa koneksi Anda.'
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {children}

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-[#E76F51] via-[#E85D3E] to-[#F4A261] text-white rounded-full shadow-2xl hover:shadow-[#E76F51]/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
          aria-label="Buka Asisten Memasak AI"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#E76F51] via-[#E85D3E] to-[#F4A261] text-white p-5 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Asisten Savora</h3>
                <p className="text-xs text-white/90">Asisten Memasak AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 hover:rotate-90 transition-all duration-200"
              aria-label="Tutup chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white shadow-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#E76F51]" />
                    <span className="text-sm text-gray-600">Sedang menyiapkan jawaban...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input or Login Prompt */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
            {isLoggedIn === false ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#E76F51]/10 to-[#F4A261]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <LogIn className="w-7 h-7 text-[#E76F51]" />
                </div>
                <p className="text-sm text-gray-700 font-semibold mb-1">
                  Butuh akses untuk chat
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Login terlebih dahulu untuk mulai mengobrol dengan asisten AI
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#E76F51]/30 hover:scale-105 transition-all text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Login Sekarang
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tanya tentang resep, bahan, atau tips memasak..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/20 focus:outline-none resize-none text-sm transition-all"
                    rows={2}
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-4 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#E76F51]/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none self-end"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 px-1">
                  Tekan <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">Enter</kbd> untuk kirim pesan
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}