import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/lib/types";
import { formatDZD, effectivePrice, discountPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ p }: { p: ProductRow }) {
  const img = p.images[0];
  const off = discountPercent(p);
  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
        {img ? (
          <img
            src={img}
            alt={`${p.brand} ${p.name_ar}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">لا توجد صورة</div>
        )}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {p.is_limited && <Badge className="gold-gradient text-ink border-0">إصدار محدود</Badge>}
          {p.is_new && !p.is_limited && <Badge variant="secondary">جديد</Badge>}
          {off > 0 && <Badge variant="destructive">-{off}%</Badge>}
        </div>
        {p.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <span className="rounded-md bg-ink px-3 py-1 text-xs font-semibold text-primary-foreground">نفذت الكمية</span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wider text-gold-dark">{p.brand}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{p.name_ar}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{formatDZD(effectivePrice(p))}</span>
          {p.discount_price_dzd && (
            <span className="text-xs text-muted-foreground line-through">{formatDZD(p.price_dzd)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
