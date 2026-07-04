import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { checkAdmin, claimFirstAdmin } from "@/lib/admin.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "حسابي — LUXE TIME DZ" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate({ to: "/auth" }); return; }
      setEmail(data.user.email ?? null);
      setReady(true);
    });
  }, [navigate]);

  const admin = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => checkAdmin(),
    enabled: ready,
  });

  async function logout() {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  }

  async function claim() {
    try {
      const r = await claimFirstAdmin();
      if (r.claimed) { toast.success("تمت ترقيتك إلى مشرف"); admin.refetch(); }
      else toast.error("يوجد مشرف مسبقاً");
    } catch (e: any) { toast.error(e.message); }
  }

  if (!ready) return <div className="container-lux py-12 text-center text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="container-lux py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-bold">حسابي</h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/track"><Button variant="outline" className="w-full">تتبع طلباتي</Button></Link>
          <Link to="/shop"><Button variant="outline" className="w-full">متابعة التسوق</Button></Link>
        </div>
        {admin.data && (
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-6">
            {admin.data.isAdmin ? (
              <>
                <p className="font-semibold">أنت مشرف ✨</p>
                <Link to="/admin"><Button className="mt-3 gold-gradient text-ink">لوحة التحكم</Button></Link>
              </>
            ) : !admin.data.adminExists ? (
              <>
                <p className="font-semibold">إعداد المتجر</p>
                <p className="mt-1 text-sm text-muted-foreground">لا يوجد مشرف بعد. اضغط للترقية لأول مشرف.</p>
                <Button onClick={claim} className="mt-3 gold-gradient text-ink">أصبح مشرفاً</Button>
              </>
            ) : null}
          </div>
        )}
        <Button onClick={logout} variant="destructive" className="w-full">تسجيل الخروج</Button>
      </div>
    </div>
  );
}
