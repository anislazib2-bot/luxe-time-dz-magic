import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getProductBySlug, listProducts } from "@/lib/catalog.functions";
import { formatDZD, effectivePrice, discountPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingBag, Shield, Truck, RefreshCcw, Award } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { ProductCard } from "@/components/ProductCard";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.fetchQuery({
      queryKey: ["product", params.slug],
      queryFn: () => getProductBySlug({ data: { slug: params.slug } } as any),
    });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ params, loaderData }) => {
    const SITE = "https://luxe-time-dz-magic.lovable.app";
    const url = `${SITE}/product/${params.slug}`;
    if (!loaderData?.product) {
      return {
        meta: [{ title: "منتج غير متوفر — LUXE TIME DZ" }, { name: "robots", content: "noindex" }],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const p = loaderData.product;
    const price = p.discount_price_dzd ?? p.price_dzd;
    const img = p.images[0];
    const title = `${p.name_ar} — ${p.brand} | LUXE TIME DZ`;
    const desc = (p.description_ar ?? `اشترِ ${p.name_ar} من ${p.brand} — ساعة أصلية بضمان في الجزائر. توصيل لكل الولايات.`).slice(0, 158);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(img ? [
          { property: "og:image", content: img },
          { property: "og:image:alt", content: `${p.brand} ${p.name_ar}` },
          { name: "twitter:image", content: img },
        ] : []),
        { property: "product:price:amount", content: String(price) },
        { property: "product:price:currency", content: "DZD" },
        { property: "product:availability", content: p.stock > 0 ? "in stock" : "out of stock" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name_ar,
            description: p.description_ar ?? p.name_ar,
            image: p.images,
            sku: p.id,
            brand: { "@type": "Brand", name: p.brand },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "DZD",
              price: String(price),
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const off = discountPercent(product);
  const inStock = product.stock > 0;

  const related = useSuspenseQuery({
    queryKey: ["related", product.brand],
    queryFn: () => listProducts({ data: { brand: product.brand, limit: 4 } } as any),
  });

  return (
    <div className="container-lux py-8">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-gold">الرئيسية</Link> / <Link to="/shop" className="hover:text-gold">المتجر</Link> / <span className="text-foreground">{product.name_ar}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div
            className="relative aspect-square overflow-hidden rounded-lg bg-secondary cursor-zoom-in"
            onClick={() => setZoom(true)}
          >
            <img src={product.images[imgIdx]} alt={product.name_ar} className="h-full w-full object-cover" />
            {off > 0 && <Badge className="absolute top-3 start-3" variant="destructive">-{off}%</Badge>}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((src: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`overflow-hidden rounded border-2 transition ${i === imgIdx ? "border-gold" : "border-transparent"}`}
                >
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">{product.brand}</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight md:text-4xl">{product.name_ar}</h1>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatDZD(effectivePrice(product))}</span>
            {product.discount_price_dzd && (
              <span className="text-lg text-muted-foreground line-through">{formatDZD(product.price_dzd)}</span>
            )}
          </div>
          <p className={`text-sm font-medium ${inStock ? "text-emerald-600" : "text-destructive"}`}>
            {inStock ? `✓ متوفر (${product.stock} قطعة)` : "نفذت الكمية"}
          </p>
          {product.description_ar && (
            <p className="text-sm leading-relaxed text-foreground/80">{product.description_ar}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center rounded-md border border-input">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button
              size="lg"
              disabled={!inStock}
              onClick={() => {
                addItem({ product_id: product.id, slug: product.slug, name: product.name_ar, price: effectivePrice(product), image: product.images[0], max_stock: product.stock }, qty);
                toast.success("تمت إضافة المنتج إلى السلة");
              }}
              className="flex-1 gold-gradient text-ink font-semibold hover:opacity-90"
            >
              <ShoppingBag className="me-2 h-4 w-4" /> أضف إلى السلة
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
            {[
              { Icon: Shield, t: "ضمان سنتين" },
              { Icon: Award, t: "أصلية 100%" },
              { Icon: Truck, t: "توصيل لكل الجزائر" },
              { Icon: RefreshCcw, t: "إرجاع خلال 7 أيام" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-center gap-2 rounded-md border border-border p-3">
                <Icon className="h-4 w-4 text-gold" /> {t}
              </div>
            ))}
          </div>

          {Object.keys(product.specs ?? {}).length > 0 && (
            <div className="pt-4">
              <h3 className="mb-3 font-semibold">المواصفات الفنية</h3>
              <dl className="divide-y divide-border rounded-md border border-border text-sm">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between p-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {related.data.filter((p) => p.id !== product.id).length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-bold">منتجات ذات صلة</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.data.filter((p) => p.id !== product.id).slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoom(false)}>
          <img src={product.images[imgIdx]} alt={product.name_ar} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
