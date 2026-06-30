import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { lookupOrder } from "@/lib/orders.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDZD } from "@/lib/format";
import { Package, Search } from "lucide-react";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [{ title: "تتبع الطلب — LUXE TIME DZ" }] }),
  component: TrackPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  shipping: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const mut = useMutation({
    mutationFn: async () => await lookupOrder({ data: { order_number: orderNumber.trim(), phone: phone.trim() } } as any),
  });

  return (
    <div className="container-lux py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Package className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-3 font-display text-3xl font-bold">تتبع طلبك</h1>
          <p className="mt-2 text-sm text-muted-foreground">أدخل رقم الطلب ورقم الهاتف للاطلاع على حالة طلبك</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <Label>رقم الطلب</Label>
            <Input placeholder="LTD-20260101-1234" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
          </div>
          <div>
            <Label>رقم الهاتف</Label>
            <Input placeholder="0555 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <Button type="submit" className="self-end gold-gradient text-ink font-semibold" disabled={mut.isPending}>
            <Search className="me-1 h-4 w-4" /> بحث
          </Button>
        </form>

        {mut.isError && <p className="mt-4 text-center text-sm text-destructive">{(mut.error as Error).message}</p>}

        {mut.isSuccess && (
          mut.data ? (
            <div className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">رقم الطلب</p>
                  <p className="font-bold">{mut.data.order.order_number}</p>
                </div>
                <Badge className="gold-gradient text-ink border-0">{STATUS_LABELS[mut.data.order.status] ?? mut.data.order.status}</Badge>
              </div>
              <div className="grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-2">
                <div><p className="text-muted-foreground">الاسم</p><p className="font-medium">{mut.data.order.full_name}</p></div>
                <div><p className="text-muted-foreground">التاريخ</p><p className="font-medium">{new Date(mut.data.order.created_at).toLocaleDateString("ar-DZ")}</p></div>
                <div><p className="text-muted-foreground">نوع التوصيل</p><p className="font-medium">{mut.data.order.delivery_type === "home" ? "للمنزل" : "من المكتب"}</p></div>
                <div><p className="text-muted-foreground">الإجمالي</p><p className="font-bold">{formatDZD(mut.data.order.total_dzd)}</p></div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 font-semibold">المنتجات</h3>
                <div className="space-y-2">
                  {mut.data.items.map((it: any) => (
                    <div key={it.id ?? it.product_id} className="flex justify-between text-sm">
                      <span>{it.name_snapshot} × {it.quantity}</span>
                      <span className="font-medium">{formatDZD(it.price_snapshot * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-center text-muted-foreground">لم يتم العثور على طلب بهذه المعلومات.</p>
          )
        )}
      </div>
    </div>
  );
}
