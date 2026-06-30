import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-primary-foreground">
      <div className="container-lux py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-display text-2xl font-black">
              LUXE<span className="text-gold">·</span>TIME <span className="text-xs text-muted-foreground">DZ</span>
            </div>
            <p className="mt-3 text-sm text-primary-foreground/70 leading-relaxed">
              متجر الساعات الفاخرة الأول في الجزائر. ساعات أصلية مع ضمان كامل وتوصيل لجميع الولايات.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="rounded-full border border-primary-foreground/20 p-2 hover:border-gold hover:text-gold transition" aria-label="انستغرام"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-primary-foreground/20 p-2 hover:border-gold hover:text-gold transition" aria-label="فيسبوك"><Facebook className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">المتجر</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/shop" className="hover:text-gold">جميع الساعات</Link></li>
              <li><Link to="/shop" search={{ gender: "men" } as any} className="hover:text-gold">ساعات رجالية</Link></li>
              <li><Link to="/shop" search={{ gender: "women" } as any} className="hover:text-gold">ساعات نسائية</Link></li>
              <li><Link to="/shop" search={{ category: "luxury" } as any} className="hover:text-gold">الفئة الفاخرة</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">المساعدة</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/track" className="hover:text-gold">تتبع طلبك</Link></li>
              <li><a href="#faq" className="hover:text-gold">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:text-gold">سياسة الإرجاع</a></li>
              <li><a href="#" className="hover:text-gold">الضمان</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">تواصل معنا</h4>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> 0555 00 00 00</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> contact@luxetime.dz</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> الجزائر العاصمة</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-lux flex flex-col items-center justify-between gap-2 py-5 text-xs text-primary-foreground/60 md:flex-row">
          <span>© {new Date().getFullYear()} LUXE TIME DZ. جميع الحقوق محفوظة.</span>
          <span>صنع بحب في الجزائر 🇩🇿</span>
        </div>
      </div>
    </footer>
  );
}
