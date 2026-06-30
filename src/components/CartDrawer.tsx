import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { formatDZD } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CartDrawer() {
  const { isOpen, close, items, removeItem, updateQuantity, subtotal } = useCart();
  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">سلة التسوق</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">السلة فارغة</p>
            <Button onClick={close} variant="outline">تابع التسوق</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((it) => (
                <div key={it.product_id} className="flex gap-3 border-b border-border/50 pb-4">
                  {it.image && <img src={it.image} alt={it.name} className="h-20 w-20 rounded object-cover" />}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{it.name}</p>
                      <button onClick={() => removeItem(it.product_id)} aria-label="حذف"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                    </div>
                    <p className="mt-1 text-sm font-bold text-gold-dark">{formatDZD(it.price)}</p>
                    <div className="mt-auto flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(it.product_id, it.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(it.product_id, it.quantity + 1)} disabled={it.quantity >= it.max_stock}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="text-lg font-bold">{formatDZD(subtotal())}</span>
              </div>
              <p className="text-xs text-muted-foreground">رسوم التوصيل تُحسب في صفحة الدفع.</p>
              <Link to="/checkout" onClick={close}>
                <Button className="w-full gold-gradient text-ink font-semibold hover:opacity-90">إتمام الطلب</Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
