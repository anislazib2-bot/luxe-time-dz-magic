import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListWilayas, adminUpdateWilaya } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/delivery")({ component: DeliveryPage });

function DeliveryPage() {
  const qc = useQueryClient();
  const wilayas = useQuery({ queryKey: ["admin-wilayas"], queryFn: () => adminListWilayas() });
  const [edits, setEdits] = useState<Record<number, { home: number; office: number }>>({});

  useEffect(() => {
    if (wilayas.data) {
      const m: Record<number, { home: number; office: number }> = {};
      wilayas.data.forEach((w: any) => { m[w.code] = { home: w.delivery_home_dzd, office: w.delivery_office_dzd }; });
      setEdits(m);
    }
  }, [wilayas.data]);

  const save = useMutation({
    mutationFn: (v: { code: number; delivery_home_dzd: number; delivery_office_dzd: number }) => adminUpdateWilaya({ data: v as any } as any),
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["admin-wilayas"] }); qc.invalidateQueries({ queryKey: ["wilayas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!wilayas.data) return <p>جاري التحميل...</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">أسعار التوصيل بالولاية</h1>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase"><tr><th className="p-3 text-start">الكود</th><th className="p-3 text-start">الولاية</th><th className="p-3">للمنزل</th><th className="p-3">للمكتب</th><th></th></tr></thead>
          <tbody className="divide-y divide-border">
            {wilayas.data.map((w: any) => {
              const e = edits[w.code] ?? { home: w.delivery_home_dzd, office: w.delivery_office_dzd };
              return (
                <tr key={w.code}>
                  <td className="p-3">{w.code}</td>
                  <td className="p-3">{w.name_ar}</td>
                  <td className="p-3"><Input type="number" className="h-8 w-24" value={e.home} onChange={(ev) => setEdits({ ...edits, [w.code]: { ...e, home: Number(ev.target.value) } })} /></td>
                  <td className="p-3"><Input type="number" className="h-8 w-24" value={e.office} onChange={(ev) => setEdits({ ...edits, [w.code]: { ...e, office: Number(ev.target.value) } })} /></td>
                  <td className="p-3"><Button size="sm" onClick={() => save.mutate({ code: w.code, delivery_home_dzd: e.home, delivery_office_dzd: e.office })}>حفظ</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
