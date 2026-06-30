import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListOrders, adminUpdateOrderStatus, adminGetOrder } from "@/lib/admin.functions";
import { formatDZD } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUSES = ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"] as const;
const LABEL: Record<string, string> = { pending: "قيد المراجعة", confirmed: "مؤكد", preparing: "قيد التحضير", shipping: "في الطريق", delivered: "تم التسليم", cancelled: "ملغى" };

export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });

function OrdersPage() {
  const [status, setStatus] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ["admin-orders", status], queryFn: () => adminListOrders({ data: { status: status as any } } as any) });
  const update = useMutation({
    mutationFn: (v: { id: string; status: string }) => adminUpdateOrderStatus({ data: v as any } as any),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">الطلبات</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase">
            <tr><th className="p-3 text-start">الرقم</th><th className="p-3 text-start">العميل</th><th className="p-3 text-start">الهاتف</th><th className="p-3 text-start">الإجمالي</th><th className="p-3 text-start">الحالة</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(orders.data ?? []).map((o: any) => (
              <tr key={o.id}>
                <td className="p-3 font-mono text-xs">{o.order_number}</td>
                <td className="p-3">{o.full_name}</td>
                <td className="p-3">{o.phone}</td>
                <td className="p-3 font-semibold">{formatDZD(o.total_dzd)}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-3"><button onClick={() => setOpenId(o.id)} className="text-xs underline">تفاصيل</button></td>
              </tr>
            ))}
            {orders.data && orders.data.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
          </tbody>
        </table>
      </div>
      {openId && <OrderDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function OrderDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["admin-order", id], queryFn: () => adminGetOrder({ data: { id } } as any) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>تفاصيل الطلب {data?.order?.order_number}</DialogTitle></DialogHeader>
        {data && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-muted-foreground">العميل</p><p>{data.order.full_name}</p></div>
              <div><p className="text-muted-foreground">الهاتف</p><p>{data.order.phone}</p></div>
              <div><p className="text-muted-foreground">الولاية</p><p>{data.order.wilaya_code} - {data.order.commune}</p></div>
              <div><p className="text-muted-foreground">التوصيل</p><p>{data.order.delivery_type === "home" ? "للمنزل" : "من المكتب"}</p></div>
              {data.order.address && <div className="col-span-2"><p className="text-muted-foreground">العنوان</p><p>{data.order.address}</p></div>}
              {data.order.notes && <div className="col-span-2"><p className="text-muted-foreground">ملاحظات</p><p>{data.order.notes}</p></div>}
            </div>
            <div className="border-t border-border pt-3">
              <h3 className="mb-2 font-semibold">المنتجات</h3>
              {data.items.map((it: any) => (
                <div key={it.id} className="flex justify-between py-1">
                  <span>{it.name_snapshot} × {it.quantity}</span>
                  <span>{formatDZD(it.price_snapshot * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 text-end">
              <p>الفرعي: {formatDZD(data.order.subtotal_dzd)}</p>
              <p>التوصيل: {formatDZD(data.order.delivery_dzd)}</p>
              <p className="text-base font-bold">الإجمالي: {formatDZD(data.order.total_dzd)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
