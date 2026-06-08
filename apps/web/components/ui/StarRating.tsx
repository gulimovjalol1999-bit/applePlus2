import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md'
  className?: string
}

export function StarRating({ rating, reviewCount, size = 'sm', className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < Math.floor(rating)
          const partial = !filled && i < rating
          return (
            <svg
              key={i}
              className={cn(
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5',
                filled || partial ? 'text-amber-400' : 'text-ap-gray3'
              )}
              viewBox="0 0 20 20"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={filled ? '0' : '1.5'}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )
        })}
      </div>
      <span className={cn('font-medium text-ap-black', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className={cn('text-ap-text2', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  )
}
