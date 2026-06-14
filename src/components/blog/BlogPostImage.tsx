import Image from 'next/image';

type BlogPostImageProps = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  objectPosition?: string;
  className?: string;
};

export function BlogPostImage({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, 33vw',
  priority = false,
  objectPosition,
  className = 'relative h-40 w-full overflow-hidden bg-slate-200',
}: BlogPostImageProps) {
  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        style={objectPosition ? { objectPosition } : undefined}
        sizes={sizes}
        priority={priority}
      />
    </div>
  );
}
