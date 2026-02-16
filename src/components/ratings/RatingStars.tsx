'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
}

export function RatingStars({ value, onChange, size = 'md', readonly = false, showValue = false }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= displayValue
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
      {showValue && (
        <span className="text-sm font-semibold text-gray-700 ml-1.5">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
