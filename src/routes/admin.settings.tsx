import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreSettings, adminUpdateSettings, adminUploadImage } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

type Form = {
  store_name: string;
  logo_url: string;
  phone: string;
  whatsapp: string;
  instagram_url: string;
  facebook_url: string;
  email: string;
  address: string;
  topbar_text: string;
  free_shipping_threshold_dzd: number;
};

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["store-settings"], queryFn: () => getStoreSettings() });
  const [f, setF] = useState<Form | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (q.data) {
      setF({
        store_name: q.data.store_name ?? "",
        logo_url: q.data.logo_url ?? "",
        phone: q.data.phone ?? "",
        whatsapp: q.data.whatsapp ?? "",
        instagram_url: q.data.instagram_url ?? "",
        facebook_url: q.data.facebook_url ?? "",
        email: q.data.email ?? "",
        address: q.data.address ?? "",
        topbar_text: q.data.topbar_text ?? "",
        free_shipping_threshold_dzd: q.data.free_shipping_threshold_dzd ?? 0,
      });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: (v: Form) =>
      adminUpdateSettings({
        data: {
          ...v,
          logo_url: v.logo_url || null,
          phone: v.phone || null,
          whatsapp: v.whatsapp || null,
          instagram_url: v.instagram_url || null,
          facebook_url: v.facebook_url || null,
          email: v.email || null,
          address: v.address || null,
          topbar_text: v.topbar_text || null,
        } as any,
      } as any),
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onLogoFile(file: File) {
    if (!f) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("الحد الأقصى 5MB");
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res: any = await adminUploadImage({ data: { filename: file.name, dataUrl, folder: "logos" } as any } as any);
      setF({ ...f, logo_url: res.url });
      toast.success("تم رفع الشعار");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  if (!f) return <p>جاري التحميل...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">إعدادات المتجر</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.store_name.trim()) return toast.error("اسم المتجر مطلوب");
          save.mutate(f);
        }}
        className="space-y-5 rounded-lg border border-border bg-card p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>اسم المتجر *</Label>
            <Input required value={f.store_name} onChange={(e) => setF({ ...f, store_name: e.target.value })} />
          </div>
          <div>
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <div>
            <Label>رقم الهاتف</Label>
            <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0555 00 00 00" />
          </div>
          <div>
            <Label>رقم واتساب (بالتنسيق الدولي)</Label>
            <Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="213555000000" />
          </div>
          <div>
            <Label>رابط انستغرام</Label>
            <Input type="url" value={f.instagram_url} onChange={(e) => setF({ ...f, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <Label>رابط فيسبوك</Label>
            <Input type="url" value={f.facebook_url} onChange={(e) => setF({ ...f, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
          </div>
          <div className="md:col-span-2">
            <Label>العنوان</Label>
            <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>نص الشريط العلوي</Label>
            <Textarea rows={2} value={f.topbar_text} onChange={(e) => setF({ ...f, topbar_text: e.target.value })} />
          </div>
          <div>
            <Label>حد الشحن المجاني (دج، 0 = معطّل)</Label>
            <Input
              type="number"
              min={0}
              value={f.free_shipping_threshold_dzd}
              onChange={(e) => setF({ ...f, free_shipping_threshold_dzd: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <Label>الشعار</Label>
          <div className="flex items-center gap-3">
            {f.logo_url && <img src={f.logo_url} alt="logo" className="h-14 w-14 rounded object-contain bg-secondary" />}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
              <Upload className="h-4 w-4" />
              {uploading ? "جاري الرفع..." : "رفع شعار"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onLogoFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {f.logo_url && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setF({ ...f, logo_url: "" })}>
                حذف
              </Button>
            )}
          </div>
          <Input
            className="mt-2"
            placeholder="أو ألصق رابط الشعار"
            value={f.logo_url}
            onChange={(e) => setF({ ...f, logo_url: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="gold-gradient text-ink" disabled={save.isPending}>
            {save.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
