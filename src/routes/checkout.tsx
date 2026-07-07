import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listWilayas, listCommuneRates } from "@/lib/catalog.functions";
import { placeOrder } from "@/lib/orders.functions";
import { useCart } from "@/lib/cart-store";
import { formatDZD, isValidDZPhone } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "إتمام الطلب — LUXE TIME DZ" },
    { name: "description", content: "أكمل طلبك بأمان مع الدفع عند الاستلام والتوصيل لجميع ولايات الجزائر." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({ queryKey: ["wilayas"], queryFn: () => listWilayas() });
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const wilayas = useSuspenseQuery({ queryKey: ["wilayas"], queryFn: () => listWilayas() });
  const items = useCart((s) => s.items);
  const subtotalFn = useCart((s) => s.subtotal);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    wilaya_code: "",
    commune: "",
    address: "",
    delivery_type: "home" as "home" | "office",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ order_number: string; total_dzd: number } | null>(null);

  const subtotal = subtotalFn();
  const selectedWilaya = wilayas.data.find((w) => w.code === Number(form.wilaya_code));
  const communeRates = useQuery({
    queryKey: ["commune-rates", form.wilaya_code],
    queryFn: () => listCommuneRates({ data: { wilaya_code: Number(form.wilaya_code) } } as any),
    enabled: !!form.wilaya_code,
  });
  const communeMatch = useMemo(() => {
    if (!form.commune.trim() || !communeRates.data) return null;
    const target = form.commune.trim().toLowerCase();
    return communeRates.data.find((c: any) => c.commune.toLowerCase() === target) ?? null;
  }, [form.commune, communeRates.data]);
  const homeFee = communeMatch?.delivery_home_dzd ?? selectedWilaya?.delivery_home_dzd ?? 0;
  const officeFee = communeMatch?.delivery_office_dzd ?? selectedWilaya?.delivery_office_dzd ?? 0;
  const deliveryFee = useMemo(() => {
    if (!selectedWilaya) return 0;
    return form.delivery_type === "home" ? homeFee : officeFee;
  }, [selectedWilaya, form.delivery_type, homeFee, officeFee]);
  const total = subtotal + deliveryFee;

  const mut = useMutation({
    mutationFn: async () => {
      const res = await placeOrder({
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          wilaya_code: Number(form.wilaya_code),
          commune: form.commune.trim(),
          address: form.address.trim() || null,
          delivery_type: form.delivery_type,
          notes: form.notes.trim() || null,
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        },
      } as any);
      return res;
    },
    onSuccess: (res) => {
      clear();
      setDone(res);
      toast.success("تم تأكيد طلبك بنجاح!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (done) {
    return (
      <div className="container-lux flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-luxe">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 font-display text-2xl font-bold">تم استلام طلبك!</h1>
          <p className="mt-2 text-sm text-muted-foreground">سيتصل بك أحد ممثلينا خلال 24 ساعة لتأكيد الطلب.</p>
          <div className="mt-4 rounded-md bg-secondary p-4 text-sm">
            <p>رقم الطلب: <span className="font-bold">{done.order_number}</span></p>
            <p>المبلغ الإجمالي: <span className="font-bold">{formatDZD(done.total_dzd)}</span></p>
          </div>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => navigate({ to: "/track" })} variant="outline" className="flex-1">تتبع الطلب</Button>
            <Button onClick={() => navigate({ to: "/" })} className="flex-1 gold-gradient text-ink">العودة للرئيسية</Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-lux flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl">سلتك فارغة</h1>
        <Link to="/shop"><Button className="gold-gradient text-ink">تابع التسوق</Button></Link>
      </div>
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = "الاسم مطلوب";
    if (!isValidDZPhone(form.phone)) e.phone = "رقم الهاتف غير صحيح (مثال: 0555123456)";
    if (!form.wilaya_code) e.wilaya_code = "اختر الولاية";
    if (form.commune.trim().length < 2) e.commune = "البلدية مطلوبة";
    if (form.delivery_type === "home" && form.address.trim().length < 5) e.address = "العنوان مطلوب للتوصيل للمنزل";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="container-lux py-10">
      <h1 className="mb-6 font-display text-3xl font-bold">إتمام الطلب</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <form
          onSubmit={(e) => { e.preventDefault(); if (validate()) mut.mutate(); }}
          className="space-y-5 rounded-lg border border-border bg-card p-6"
        >
          <h2 className="font-semibold">معلومات التوصيل</h2>
          <div>
            <Label>الاسم الكامل *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name}</p>}
          </div>
          <div>
            <Label>رقم الهاتف *</Label>
            <Input type="tel" placeholder="0555 12 34 56" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>الولاية *</Label>
              <Select value={form.wilaya_code} onValueChange={(v) => setForm({ ...form, wilaya_code: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {wilayas.data.map((w) => (
                    <SelectItem key={w.code} value={String(w.code)}>{w.code} - {w.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.wilaya_code && <p className="mt-1 text-xs text-destructive">{errors.wilaya_code}</p>}
            </div>
            <div>
              <Label>البلدية *</Label>
              <Input value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} />
              {errors.commune && <p className="mt-1 text-xs text-destructive">{errors.commune}</p>}
            </div>
          </div>
          <div>
            <Label>نوع التوصيل *</Label>
            <RadioGroup value={form.delivery_type} onValueChange={(v) => setForm({ ...form, delivery_type: v as any })} className="mt-2 grid gap-2 md:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${form.delivery_type === "home" ? "border-gold" : "border-border"}`}>
                <RadioGroupItem value="home" />
                <div className="flex-1">
                  <p className="font-medium">توصيل للمنزل</p>
                  <p className="text-xs text-muted-foreground">{selectedWilaya ? formatDZD(homeFee) : "اختر الولاية"}</p>
                </div>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${form.delivery_type === "office" ? "border-gold" : "border-border"}`}>
                <RadioGroupItem value="office" />
                <div className="flex-1">
                  <p className="font-medium">استلام من المكتب</p>
                  <p className="text-xs text-muted-foreground">{selectedWilaya ? formatDZD(selectedWilaya.delivery_office_dzd) : "اختر الولاية"}</p>
                </div>
              </label>
            </RadioGroup>
          </div>
          {form.delivery_type === "home" && (
            <div>
              <Label>العنوان التفصيلي *</Label>
              <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
            </div>
          )}
          <div>
            <Label>ملاحظات (اختياري)</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="rounded-md border border-gold/30 bg-gold/5 p-4">
            <p className="text-sm font-semibold">💵 الدفع عند الاستلام</p>
            <p className="mt-1 text-xs text-muted-foreground">ستدفع المبلغ كاملاً عند استلام طلبك.</p>
          </div>
          <Button type="submit" size="lg" className="w-full gold-gradient text-ink font-semibold" disabled={mut.isPending}>
            {mut.isPending ? "جاري الإرسال..." : `تأكيد الطلب (${formatDZD(total)})`}
          </Button>
        </form>

        <aside className="space-y-4 rounded-lg border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-semibold">ملخص الطلب</h2>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.product_id} className="flex gap-3 text-sm">
                {it.image && <img src={it.image} alt={it.name} className="h-14 w-14 rounded object-cover" />}
                <div className="flex-1">
                  <p className="line-clamp-2 font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">× {it.quantity}</p>
                </div>
                <p className="font-semibold">{formatDZD(it.price * it.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span>{formatDZD(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">التوصيل</span><span>{selectedWilaya ? formatDZD(deliveryFee) : "—"}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>الإجمالي</span><span>{formatDZD(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
