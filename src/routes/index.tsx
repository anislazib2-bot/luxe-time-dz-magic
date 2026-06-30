import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ChevronLeft, Shield, Truck, Award, RefreshCcw, Star, Mail } from "lucide-react";
import { homePageData } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductRow } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUXE TIME DZ — متجر الساعات الفاخرة في الجزائر" },
      { name: "description", content: "تسوق أرقى الساعات الفاخرة الأصلية من Festina وغيرها. توصيل سريع لكافة ولايات الجزائر مع الدفع عند الاستلام." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({ queryKey: ["home"], queryFn: () => homePageData() });
  },
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Suspense fallback={<SectionSkeleton />}>
        <HomeSections />
      </Suspense>
      <Reviews />
      <FAQ />
      <Newsletter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.18),transparent_60%)]" />
      <div className="container-lux relative grid gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="space-y-6 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> مجموعة 2026
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.1] md:text-6xl">
            وقتك يستحق <span className="text-gradient-gold">الفخامة</span>
          </h1>
          <p className="max-w-md text-base text-primary-foreground/70 md:text-lg">
            ساعات أصلية مختارة بعناية من أرقى العلامات العالمية. صناعة سويسرية، ضمان رسمي، وتوصيل لجميع ولايات الجزائر.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/shop">
              <Button size="lg" className="gold-gradient text-ink font-semibold hover:opacity-90 hover-lift">
                تسوق المجموعة <ChevronLeft className="ms-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/shop" search={{ category: "limited" } as any}>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                الإصدارات المحدودة
              </Button>
            </Link>
          </div>
          <div className="flex gap-8 pt-4 text-sm">
            <div><p className="text-2xl font-bold text-gold">+10K</p><p className="text-primary-foreground/60">عميل سعيد</p></div>
            <div><p className="text-2xl font-bold text-gold">100%</p><p className="text-primary-foreground/60">أصلية</p></div>
            <div><p className="text-2xl font-bold text-gold">58</p><p className="text-primary-foreground/60">ولاية</p></div>
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="absolute -inset-10 rounded-full bg-gold/20 blur-3xl" />
          <img
            src="/__l5e/assets-v1/e07276f5/IMG_20260630_225837_024.jpg"
            alt="ساعة فاخرة"
            className="relative mx-auto h-[480px] w-[480px] rounded-full object-cover shadow-luxe ring-1 ring-gold/30"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { Icon: Shield, t: "ضمان رسمي", s: "سنتان على جميع المنتجات" },
    { Icon: Truck, t: "توصيل سريع", s: "لجميع ولايات الجزائر" },
    { Icon: Award, t: "أصلية 100%", s: "مع شهادة الأصالة" },
    { Icon: RefreshCcw, t: "إرجاع سهل", s: "خلال 7 أيام" },
  ];
  return (
    <section className="border-y border-border bg-cream">
      <div className="container-lux grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, t, s }) => (
          <div key={t} className="flex items-center gap-3">
            <div className="rounded-full bg-ink p-3 text-gold"><Icon className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold text-foreground">{t}</p>
              <p className="text-xs text-muted-foreground">{s}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeSections() {
  const { data } = useSuspenseQuery({ queryKey: ["home"], queryFn: () => homePageData() });
  return (
    <>
      <ProductSection title="الأكثر طلباً" subtitle="اختيارات عملائنا المفضلة" items={data.featured} link="/shop" />
      <PromoBanner />
      <ProductSection title="وصل حديثاً" subtitle="أحدث إضافات مجموعتنا" items={data.newest} link="/shop" />
      {data.limited.length > 0 && (
        <ProductSection title="إصدارات محدودة" subtitle="قطع نادرة لمحبي التميز" items={data.limited} link="/shop" dark />
      )}
    </>
  );
}

function ProductSection({ title, subtitle, items, link, dark }: { title: string; subtitle: string; items: ProductRow[]; link: string; dark?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className={dark ? "bg-ink text-primary-foreground py-16" : "py-16"}>
      <div className="container-lux">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${dark ? "text-gold" : "text-gold-dark"}`}>{subtitle}</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{title}</h2>
          </div>
          <Link to={link} className={`text-sm font-medium hover:text-gold ${dark ? "text-primary-foreground/80" : "text-foreground/80"}`}>
            عرض الكل <ChevronLeft className="inline h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {items.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="container-lux py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-charcoal to-ink p-10 text-primary-foreground md:p-14">
        <div className="absolute -end-20 -top-20 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">عرض خاص</p>
          <h3 className="mt-3 font-display text-3xl font-bold md:text-4xl">احصل على خصم 15% على طلبك الأول</h3>
          <p className="mt-3 text-primary-foreground/70">اشترك في النشرة البريدية واستلم كود الخصم فوراً.</p>
          <Link to="/shop"><Button className="mt-6 gold-gradient text-ink font-semibold">تسوق الآن</Button></Link>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const reviews = [
    { n: "أحمد بن علي", c: "وهران", t: "جودة ممتازة، الساعة وصلت في الوقت المحدد وأفضل من المتوقع. أنصح بشدة!", r: 5 },
    { n: "سارة عمراني", c: "الجزائر", t: "خدمة عملاء راقية وتغليف فاخر. الساعة هدية لزوجي وأعجبته كثيراً.", r: 5 },
    { n: "ياسين بوزيد", c: "قسنطينة", t: "أول مرة أطلب ساعة أونلاين وما ندمت. أصلية وبالضمان الكامل.", r: 5 },
  ];
  return (
    <section className="bg-secondary py-16">
      <div className="container-lux">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">آراء العملاء</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">يثق بنا الآلاف</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.n} className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <div className="flex gap-1 text-gold">{Array.from({ length: r.r }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">«{r.t}»</p>
              <div className="mt-4 border-t border-border pt-3">
                <p className="font-semibold">{r.n}</p>
                <p className="text-xs text-muted-foreground">{r.c}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "هل الساعات أصلية؟", a: "نعم، جميع الساعات أصلية 100% ومستوردة مباشرة من الموزعين الرسميين، ومرفقة بشهادة الأصالة والضمان." },
    { q: "كم تستغرق مدة التوصيل؟", a: "من 2 إلى 5 أيام عمل حسب الولاية. التوصيل متاح لجميع ولايات الجزائر الـ58." },
    { q: "هل يمكنني الدفع عند الاستلام؟", a: "نعم، الدفع عند الاستلام (COD) متاح في جميع الولايات بدون أي رسوم إضافية." },
    { q: "ما هي سياسة الإرجاع؟", a: "يمكنك إرجاع المنتج خلال 7 أيام من الاستلام في حال وجود عيب مصنعي أو عدم مطابقة الوصف." },
    { q: "هل يوجد ضمان؟", a: "نعم، جميع المنتجات تأتي بضمان رسمي لمدة سنتين على حركة الساعة." },
  ];
  return (
    <section id="faq" className="container-lux py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">الأسئلة الشائعة</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">إجابات على استفساراتك</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-lg border border-border bg-background p-5 transition hover:border-gold/40">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                <span>{f.q}</span>
                <ChevronLeft className="h-4 w-4 transition group-open:-rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="container-lux pb-16">
      <div className="rounded-2xl bg-ink p-10 text-center text-primary-foreground md:p-14">
        <Mail className="mx-auto h-10 w-10 text-gold" />
        <h2 className="mt-4 font-display text-3xl font-bold">انضم لنشرتنا البريدية</h2>
        <p className="mt-2 text-primary-foreground/70">احصل على آخر العروض والإصدارات الجديدة قبل الجميع.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); toast.success("تم اشتراكك بنجاح! تحقق من بريدك."); (e.currentTarget as HTMLFormElement).reset(); }}
          className="mx-auto mt-6 flex max-w-md gap-2"
        >
          <Input type="email" required placeholder="بريدك الإلكتروني" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
          <Button type="submit" className="gold-gradient text-ink font-semibold">اشترك</Button>
        </form>
      </div>
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="container-lux py-16">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}
