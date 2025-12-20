'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Star, User } from 'lucide-react'
import { useState } from 'react'

interface RecipeCardProps {
  recipe: {
    id: string
    title: string
    description: string | null
    image_url: string | null
    cooking_time: number | null
    difficulty: string | null
    views_count: number
    profiles: {
      username: string | null
      avatar_url: string | null
      role: string
    } | null
    categories: {
      id: number
      name: string
    } | null
  }
  rating?: number
  onTap?: () => void
}

export default function RecipeCard({ recipe, rating, onTap }: RecipeCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    if (onTap) {
      onTap()
    }
  }

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-yellow-400 to-orange-400'
      case 'premium':
        return 'from-purple-400 to-purple-600'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <Link href={`/recipe/${recipe.id}`} onClick={handleClick}>
      <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-[#E76F51]/10 overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer mb-3">
        <div className="flex h-[140px] md:h-[160px]">
          {/* Image Section */}
          <div className="relative w-[140px] md:w-[180px] flex-shrink-0">
            {recipe.image_url && !imageError ? (
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#E76F51]/20 to-[#F4A261]/20 flex items-center justify-center">
                <span className="text-5xl md:text-6xl">🍳</span>
              </div>
            )}

            {/* Difficulty Badge */}
            {recipe.difficulty && (
              <div className="absolute top-2 left-2 px-2 md:px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] md:text-xs font-bold text-gray-800 shadow-lg border border-white/50 capitalize">
                {recipe.difficulty}
              </div>
            )}

            {/* Rating Badge */}
            {rating && rating > 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 text-white fill-white" />
                <span className="text-xs font-bold text-white">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content Section — FIXED WITH SCROLL */}
          <div className="flex-1 p-3 md:p-4 flex flex-col overflow-y-auto">
            {/* Category Badge */}
            {recipe.categories && (
              <div className="mb-1.5">
                <span className="inline-block px-2 md:px-3 py-1 bg-gradient-to-r from-[#264653] to-[#2A9D8F] text-white text-[9px] md:text-[10px] font-bold rounded-full">
                  {recipe.categories.name}
                </span>
              </div>
            )}

            {/* Title — Fixed position */}
            <div className="min-h-[2.5rem] flex items-start mb-1">
              <h3
                className="text-sm md:text-base font-bold text-gray-900 group-hover:text-[#E76F51] transition-colors leading-tight"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                }}
                title={recipe.title}
              >
                {recipe.title}
              </h3>
            </div>

            {/* Description — Only on medium+ screens */}
            {recipe.description && (
              <div className="min-h-[3rem]">
                <p
                  className="hidden md:block text-gray-600 text-xs leading-relaxed"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}
                  title={recipe.description}
                >
                  {recipe.description}
                </p>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer — Always visible at bottom */}
            <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br ${getRoleGradient(recipe.profiles?.role || 'user')} p-0.5 shadow-sm`}>
                  {recipe.profiles?.avatar_url ? (
                    <Image
                      src={recipe.profiles.avatar_url}
                      alt={recipe.profiles.username || 'User'}
                      width={28}
                      height={28}
                      className="rounded-full w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <span
                  className="text-[10px] md:text-xs font-semibold text-gray-700 line-clamp-1 max-w-[80px] md:max-w-[120px] text-ellipsis"
                  title={recipe.profiles?.username || 'Anonymous'}
                >
                  {recipe.profiles?.username || 'Anonymous'}
                </span>
              </div>

              {/* Cooking Time */}
              {recipe.cooking_time && (
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                  <span className="text-[10px] md:text-xs font-semibold text-blue-900">
                    {recipe.cooking_time}m
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}