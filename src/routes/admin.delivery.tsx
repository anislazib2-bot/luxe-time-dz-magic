import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListWilayas,
  adminUpdateWilaya,
  adminListCommuneRates,
  adminUpsertCommuneRate,
  adminDeleteCommuneRate,
} from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/delivery")({ component: DeliveryPage });

const MAX = 100000;

function validatePrice(n: number): string | null {
  if (!Number.isFinite(n)) return "قيمة غير صالحة";
  if (!Number.isInteger(n)) return "أدخل رقمًا صحيحًا";
  if (n < 0) return "لا يمكن أن يكون سالبًا";
  if (n > MAX) return `القيمة يجب أن تكون أقل من ${MAX}`;
  return null;
}

function DeliveryPage() {
  return (
    <div className="space-y-10">
      <WilayaSection />
      <CommuneSection />
    </div>
  );
}

function WilayaSection() {
  const qc = useQueryClient();
  const wilayas = useQuery({ queryKey: ["admin-wilayas"], queryFn: () => adminListWilayas() });
  const [edits, setEdits] = useState<Record<number, { home: string; office: string }>>({});
  const [errors, setErrors] = useState<Record<number, { home?: string; office?: string }>>({});

  useEffect(() => {
    if (wilayas.data) {
      const m: Record<number, { home: string; office: string }> = {};
      wilayas.data.forEach((w: any) => {
        m[w.code] = { home: String(w.delivery_home_dzd), office: String(w.delivery_office_dzd) };
      });
      setEdits(m);
    }
  }, [wilayas.data]);

  const save = useMutation({
    mutationFn: (v: { code: number; delivery_home_dzd: number; delivery_office_dzd: number }) =>
      adminUpdateWilaya({ data: v as any } as any),
    onSuccess: () => {
      toast.success("تم تحديث سعر الولاية");
      qc.invalidateQueries({ queryKey: ["admin-wilayas"] });
      qc.invalidateQueries({ queryKey: ["wilayas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave(code: number) {
    const e = edits[code];
    const home = Number(e.home);
    const office = Number(e.office);
    const errHome = validatePrice(home);
    const errOffice = validatePrice(office);
    if (errHome || errOffice) {
      setErrors({ ...errors, [code]: { home: errHome ?? undefined, office: errOffice ?? undefined } });
      toast.error(errHome ?? errOffice ?? "قيم غير صالحة");
      return;
    }
    setErrors({ ...errors, [code]: {} });
    save.mutate({ code, delivery_home_dzd: home, delivery_office_dzd: office });
  }

  const changedCodes = useMemo(() => {
    if (!wilayas.data) return [] as number[];
    return wilayas.data
      .filter((w: any) => {
        const e = edits[w.code];
        if (!e) return false;
        return Number(e.home) !== w.delivery_home_dzd || Number(e.office) !== w.delivery_office_dzd;
      })
      .map((w: any) => w.code as number);
  }, [wilayas.data, edits]);

  async function handleSaveAll() {
    if (!changedCodes.length) { toast.info("لا توجد تغييرات للحفظ"); return; }
    for (const code of changedCodes) {
      const e = edits[code];
      const home = Number(e.home);
      const office = Number(e.office);
      if (validatePrice(home) || validatePrice(office)) {
        toast.error(`قيم غير صالحة للولاية ${code}`);
        return;
      }
    }
    try {
      for (const code of changedCodes) {
        const e = edits[code];
        await adminUpdateWilaya({ data: { code, delivery_home_dzd: Number(e.home), delivery_office_dzd: Number(e.office) } as any } as any);
      }
      toast.success(`تم حفظ ${changedCodes.length} تغيير`);
      qc.invalidateQueries({ queryKey: ["admin-wilayas"] });
      qc.invalidateQueries({ queryKey: ["wilayas"] });
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحفظ");
    }
  }

  if (!wilayas.data) return <p>جاري التحميل...</p>;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">أسعار التوصيل حسب الولاية</h1>
          <p className="text-sm text-muted-foreground">السعر الافتراضي المطبَّق على جميع بلديات الولاية.</p>
        </div>
        <Button onClick={handleSaveAll} disabled={save.isPending || changedCodes.length === 0} className="gap-2">
          حفظ الكل {changedCodes.length > 0 && `(${changedCodes.length})`}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase">
            <tr>
              <th className="p-3 text-start">الكود</th>
              <th className="p-3 text-start">الولاية</th>
              <th className="p-3">للمنزل (دج)</th>
              <th className="p-3">للمكتب (دج)</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {wilayas.data.map((w: any) => {
              const e = edits[w.code] ?? { home: String(w.delivery_home_dzd), office: String(w.delivery_office_dzd) };
              const err = errors[w.code] ?? {};
              return (
                <tr key={w.code}>
                  <td className="p-3">{w.code}</td>
                  <td className="p-3">{w.name_ar}</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min={0}
                      max={MAX}
                      className={`h-8 w-28 ${err.home ? "border-destructive" : ""}`}
                      value={e.home}
                      onChange={(ev) => setEdits({ ...edits, [w.code]: { ...e, home: ev.target.value } })}
                    />
                    {err.home && <p className="mt-1 text-[11px] text-destructive">{err.home}</p>}
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min={0}
                      max={MAX}
                      className={`h-8 w-28 ${err.office ? "border-destructive" : ""}`}
                      value={e.office}
                      onChange={(ev) => setEdits({ ...edits, [w.code]: { ...e, office: ev.target.value } })}
                    />
                    {err.office && <p className="mt-1 text-[11px] text-destructive">{err.office}</p>}
                  </td>
                  <td className="p-3">
                    <Button size="sm" onClick={() => handleSave(w.code)} disabled={save.isPending}>حفظ</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CommuneSection() {
  const qc = useQueryClient();
  const wilayas = useQuery({ queryKey: ["admin-wilayas"], queryFn: () => adminListWilayas() });
  const [wilayaFilter, setWilayaFilter] = useState<string>("all");

  const rates = useQuery({
    queryKey: ["admin-commune-rates", wilayaFilter],
    queryFn: () =>
      adminListCommuneRates({
        data: wilayaFilter === "all" ? {} : { wilaya_code: Number(wilayaFilter) },
      } as any),
  });

  const wilayaMap = useMemo(() => {
    const m: Record<number, string> = {};
    (wilayas.data ?? []).forEach((w: any) => { m[w.code] = w.name_ar; });
    return m;
  }, [wilayas.data]);

  const [draft, setDraft] = useState({ wilaya_code: "", commune: "", home: "", office: "" });
  const [draftErr, setDraftErr] = useState<Record<string, string>>({});

  const upsert = useMutation({
    mutationFn: (v: any) => adminUpsertCommuneRate({ data: v } as any),
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-commune-rates"] });
      setDraft({ wilaya_code: "", commune: "", home: "", office: "" });
      setDraftErr({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCommuneRate({ data: { id } } as any),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-commune-rates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleAdd() {
    const err: Record<string, string> = {};
    const code = Number(draft.wilaya_code);
    if (!draft.wilaya_code || !Number.isInteger(code) || code < 1 || code > 58) err.wilaya_code = "اختر الولاية";
    const commune = draft.commune.trim();
    if (commune.length < 2) err.commune = "اسم البلدية قصير جدًا";
    if (commune.length > 80) err.commune = "اسم البلدية طويل جدًا";
    const home = Number(draft.home);
    const office = Number(draft.office);
    const eh = validatePrice(home); if (eh) err.home = eh;
    const eo = validatePrice(office); if (eo) err.office = eo;
    setDraftErr(err);
    if (Object.keys(err).length) return;
    upsert.mutate({ wilaya_code: code, commune, delivery_home_dzd: home, delivery_office_dzd: office });
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold">تسعير خاص حسب البلدية</h2>
        <p className="text-sm text-muted-foreground">
          هذه الأسعار تتجاوز سعر الولاية الافتراضي عند اختيار البلدية عند إتمام الطلب.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">إضافة تسعيرة بلدية</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <Select value={draft.wilaya_code} onValueChange={(v) => setDraft({ ...draft, wilaya_code: v })}>
              <SelectTrigger className={draftErr.wilaya_code ? "border-destructive" : ""}>
                <SelectValue placeholder="الولاية" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {(wilayas.data ?? []).map((w: any) => (
                  <SelectItem key={w.code} value={String(w.code)}>{w.code} - {w.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {draftErr.wilaya_code && <p className="mt-1 text-[11px] text-destructive">{draftErr.wilaya_code}</p>}
          </div>
          <div>
            <Input
              placeholder="اسم البلدية"
              value={draft.commune}
              onChange={(e) => setDraft({ ...draft, commune: e.target.value })}
              className={draftErr.commune ? "border-destructive" : ""}
            />
            {draftErr.commune && <p className="mt-1 text-[11px] text-destructive">{draftErr.commune}</p>}
          </div>
          <div>
            <Input
              type="number" min={0} max={MAX} placeholder="سعر المنزل"
              value={draft.home}
              onChange={(e) => setDraft({ ...draft, home: e.target.value })}
              className={draftErr.home ? "border-destructive" : ""}
            />
            {draftErr.home && <p className="mt-1 text-[11px] text-destructive">{draftErr.home}</p>}
          </div>
          <div>
            <Input
              type="number" min={0} max={MAX} placeholder="سعر المكتب"
              value={draft.office}
              onChange={(e) => setDraft({ ...draft, office: e.target.value })}
              className={draftErr.office ? "border-destructive" : ""}
            />
            {draftErr.office && <p className="mt-1 text-[11px] text-destructive">{draftErr.office}</p>}
          </div>
          <Button onClick={handleAdd} disabled={upsert.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">تصفية:</span>
        <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">كل الولايات</SelectItem>
            {(wilayas.data ?? []).map((w: any) => (
              <SelectItem key={w.code} value={String(w.code)}>{w.code} - {w.name_ar}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase">
            <tr>
              <th className="p-3 text-start">الولاية</th>
              <th className="p-3 text-start">البلدية</th>
              <th className="p-3">للمنزل (دج)</th>
              <th className="p-3">للمكتب (دج)</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(rates.data ?? []).map((r: any) => (
              <CommuneRow key={r.id} row={r} wilayaName={wilayaMap[r.wilaya_code] ?? r.wilaya_code} onDelete={() => del.mutate(r.id)} />
            ))}
            {rates.data && rates.data.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد تسعيرات خاصة بالبلديات بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CommuneRow({ row, wilayaName, onDelete }: { row: any; wilayaName: string; onDelete: () => void }) {
  const qc = useQueryClient();
  const [home, setHome] = useState(String(row.delivery_home_dzd));
  const [office, setOffice] = useState(String(row.delivery_office_dzd));
  const [err, setErr] = useState<{ home?: string; office?: string }>({});

  useEffect(() => {
    setHome(String(row.delivery_home_dzd));
    setOffice(String(row.delivery_office_dzd));
  }, [row.delivery_home_dzd, row.delivery_office_dzd]);

  const save = useMutation({
    mutationFn: (v: any) => adminUpsertCommuneRate({ data: v } as any),
    onSuccess: () => {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["admin-commune-rates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    const h = Number(home);
    const o = Number(office);
    const eh = validatePrice(h);
    const eo = validatePrice(o);
    if (eh || eo) { setErr({ home: eh ?? undefined, office: eo ?? undefined }); toast.error(eh ?? eo ?? ""); return; }
    setErr({});
    save.mutate({ id: row.id, wilaya_code: row.wilaya_code, commune: row.commune, delivery_home_dzd: h, delivery_office_dzd: o });
  }

  return (
    <tr>
      <td className="p-3">{row.wilaya_code} - {wilayaName}</td>
      <td className="p-3">{row.commune}</td>
      <td className="p-3">
        <Input type="number" min={0} max={MAX} className={`h-8 w-28 ${err.home ? "border-destructive" : ""}`} value={home} onChange={(e) => setHome(e.target.value)} />
        {err.home && <p className="mt-1 text-[11px] text-destructive">{err.home}</p>}
      </td>
      <td className="p-3">
        <Input type="number" min={0} max={MAX} className={`h-8 w-28 ${err.office ? "border-destructive" : ""}`} value={office} onChange={(e) => setOffice(e.target.value)} />
        {err.office && <p className="mt-1 text-[11px] text-destructive">{err.office}</p>}
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={save.isPending}>حفظ</Button>
          <Button size="sm" variant="destructive" onClick={onDelete} className="px-2"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </td>
    </tr>
  );
}
