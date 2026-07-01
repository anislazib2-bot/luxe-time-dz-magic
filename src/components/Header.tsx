import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { getStoreSettings } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/shop", label: "المتجر", search: {} },
  { to: "/shop", label: "رجالي", search: { gender: "men" as const } },
  { to: "/shop", label: "نسائي", search: { gender: "women" as const } },
  { to: "/track", label: "تتبع الطلب" },
];

export function Header() {
  const count = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setUserEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar */}
      <div className="bg-ink text-primary-foreground">
        <div className="container-lux flex h-9 items-center justify-between text-xs">
          <span>توصيل لجميع ولايات الجزائر • الدفع عند الاستلام</span>
          <span className="hidden md:inline">خدمة العملاء: 0555 00 00 00</span>
        </div>
      </div>
      <div className="container-lux flex h-16 items-center justify-between gap-4 md:h-20">
        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="القائمة">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-black tracking-tight md:text-2xl">
            LUXE<span className="text-gold">·</span>TIME
          </span>
          <span className="hidden text-[10px] font-semibold tracking-[0.3em] text-muted-foreground md:inline">DZ</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              search={n.search as any}
              className="text-sm font-medium text-foreground/80 transition hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/shop" })}
            aria-label="بحث"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Link to={userEmail ? "/account" : "/auth"} aria-label="الحساب">
            <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={openCart} aria-label="السلة" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="container-lux flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                search={n.search as any}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-medium border-b border-border/40 last:border-0"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
