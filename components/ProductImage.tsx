import Image from "next/image";
import type { Product } from "@/lib/store";
import { categoryLabel } from "@/lib/store";

/** Product photo, or an elegant bottle placeholder when no image is uploaded. */
export function ProductImage({
  product,
  priority,
  sizes = "(max-width: 768px) 50vw, 25vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  if (product.imageUrl) {
    return (
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,#2f2a26_0%,#18171b_60%,#101014_100%)]">
      <svg viewBox="0 0 80 140" className="h-1/2 w-auto opacity-80" aria-hidden>
        <rect x="32" y="6" width="16" height="14" rx="2" fill="#80634C" />
        <rect x="36" y="20" width="8" height="10" fill="#C6A477" opacity=".7" />
        <rect x="10" y="30" width="60" height="104" rx="10" fill="none" stroke="#C6A477" strokeWidth="1.5" />
        <rect x="16" y="70" width="48" height="58" rx="6" fill="#C6A477" opacity=".12" />
        <line x1="24" y1="56" x2="56" y2="56" stroke="#C6A477" strokeWidth=".8" opacity=".6" />
      </svg>
      <span className="mt-4 font-serif text-sm italic tracking-wide text-champagne/70">
        {categoryLabel(product.category)}
      </span>
    </div>
  );
}
