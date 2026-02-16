'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  itemId: string;
  type: 'load' | 'truck';
  size?: 'sm' | 'md';
}

const STORAGE_KEY = 'nzela_favorites';

function getFavorites(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setFavorites(favorites: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function FavoriteButton({ itemId, type, size = 'md' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const key = `${type}:${itemId}`;

  useEffect(() => {
    const favs = getFavorites();
    queueMicrotask(() => setIsFavorite(!!favs[key]));
  }, [key]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favs = getFavorites();
    if (favs[key]) {
      delete favs[key];
      setIsFavorite(false);
    } else {
      favs[key] = true;
      setIsFavorite(true);
    }
    setFavorites(favs);
  };

  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={toggle}
      className={`p-1.5 rounded-lg transition-all ${
        isFavorite
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-400'
      }`}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={`${sizeClasses} ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
}
