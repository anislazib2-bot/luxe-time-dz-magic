import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Suspense } from "react";
import { listProducts, listCategories, listBrands } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

const SearchSchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  gender: z.enum(["men", "women", "unisex"]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).optional(),
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "المتجر — ساعات فاخرة أصلية | LUXE TIME DZ" },
      { name: "description", content: "تصفح مجموعتنا الكاملة من الساعات الفاخرة الأصلية للرجال والنساء في الجزائر. أسعار تنافسية، ضمان رسمي، وتوصيل لكل الولايات." },
      { property: "og:title", content: "المتجر — ساعات فاخرة أصلية | LUXE TIME DZ" },
      { property: "og:description", content: "مجموعة كاملة من الساعات الفاخرة الأصلية في الجزائر." },
      { property: "og:url", content: "https://luxe-time-dz-magic.lovable.app/shop" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "المتجر — LUXE TIME DZ" },
      { name: "twitter:description", content: "مجموعة كاملة من الساعات الفاخرة الأصلية في الجزائر." },
    ],
    links: [{ rel: "canonical", href: "https://luxe-time-dz-magic.lovable.app/shop" }],
  }),
  validateSearch: SearchSchema,
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (prev: any) => ({ ...prev, ...patch }), replace: true });

  return (
    <div className="container-lux py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">المتجر</h1>
        <p className="mt-1 text-sm text-muted-foreground">اكتشف مجموعتنا الكاملة من الساعات الفاخرة</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded bg-muted" />}>
          <Filters search={search} update={update} />
        </Suspense>
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث عن ساعة..."
                defaultValue={search.q ?? ""}
                onChange={(e) => update({ q: e.target.value || undefined })}
                className="ps-9"
              />
            </div>
            <Select value={search.sort ?? "newest"} onValueChange={(v) => update({ sort: v as any })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر: من الأقل</SelectItem>
                <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Suspense fallback={<ProductsSkeleton />}>
            <ProductsGrid search={search} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function Filters({ search, update }: { search: any; update: (p: any) => void }) {
  const cats = useSuspenseQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const brands = useSuspenseQuery({ queryKey: ["brands"], queryFn: () => listBrands() });
  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4" /> الفلاتر</div>
      <div className="space-y-2">
        <Label>النوع</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: undefined, l: "الكل" },
            { v: "men", l: "رجالي" },
            { v: "women", l: "نسائي" },
            { v: "unisex", l: "للجنسين" },
          ].map((o) => (
            <Button
              key={o.l}
              size="sm"
              variant={search.gender === o.v ? "default" : "outline"}
              onClick={() => update({ gender: o.v })}
            >
              {o.l}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>الفئة</Label>
        <Select value={search.category ?? "_all"} onValueChange={(v) => update({ category: v === "_all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="جميع الفئات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">جميع الفئات</SelectItem>
            {cats.data.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name_ar}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>الماركة</Label>
        <Select value={search.brand ?? "_all"} onValueChange={(v) => update({ brand: v === "_all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="جميع الماركات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">جميع الماركات</SelectItem>
            {brands.data.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>السعر (دج)</Label>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="من" min={0} value={search.minPrice ?? ""} onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })} />
          <Input type="number" placeholder="إلى" min={0} value={search.maxPrice ?? ""} onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={!!search.inStock} onCheckedChange={(v) => update({ inStock: !!v || undefined })} />
        المتوفر فقط
      </label>
      <Button variant="ghost" className="w-full" onClick={() => update({ q: undefined, brand: undefined, category: undefined, gender: undefined, minPrice: undefined, maxPrice: undefined, inStock: undefined })}>
        إعادة ضبط
      </Button>
    </aside>
  );
}

function ProductsGrid({ search }: { search: any }) {
  const { data } = useSuspenseQuery({
    queryKey: ["products", search],
    queryFn: () => listProducts({
      data: {
        search: search.q,
        brand: search.brand,
        category: search.category,
        gender: search.gender,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        inStock: search.inStock,
        sort: search.sort,
      },
    } as any),
  });
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">لا توجد منتجات تطابق بحثك</p>
        <Link to="/shop" search={{}}><Button variant="link" className="mt-2">عرض كل المنتجات</Button></Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
      {data.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />)}
    </div>
  );
}
