import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminStats } from "@/lib/admin.functions";
import { formatDZD } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminStats() });
  if (isLoading || !data) return <p className="text-muted-foreground">جاري التحميل...</p>;
  const cards = [
    { l: "الإيرادات (مسلّمة)", v: formatDZD(data.revenue) },
    { l: "إجمالي الطلبات", v: data.orderCount },
    { l: "المنتجات", v: data.productCount },
    { l: "مخزون منخفض", v: data.lowStock },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.l} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.l}</p>
            <p className="mt-1 text-2xl font-bold">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">حسب الحالة</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(data.byStatus).map(([k, v]) => (
            <span key={k} className="rounded-full bg-secondary px-3 py-1">{k}: <b>{v}</b></span>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border p-4 font-semibold">آخر الطلبات</h2>
        <div className="divide-y divide-border">
          {data.recentOrders.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between p-3 text-sm">
              <div><p className="font-medium">{o.order_number}</p><p className="text-xs text-muted-foreground">{o.full_name}</p></div>
              <div className="text-end"><p className="font-bold">{formatDZD(o.total_dzd)}</p><p className="text-xs text-muted-foreground">{o.status}</p></div>
            </div>
          ))}
          {data.recentOrders.length === 0 && <p className="p-4 text-sm text-muted-foreground">لا توجد طلبات بعد</p>}
        </div>
      </div>
    </div>
  );
}
