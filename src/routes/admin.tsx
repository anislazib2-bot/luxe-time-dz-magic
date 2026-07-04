import { createFileRoute, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — LUXE TIME DZ" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setReady(true);
    });
  }, [navigate]);

  const admin = useQuery({ queryKey: ["admin-check"], queryFn: () => checkAdmin(), enabled: ready });

  if (!ready || admin.isLoading) return <div className="container-lux py-12 text-center">جاري التحميل...</div>;
  if (!admin.data?.isAdmin) {
    return (
      <div className="container-lux py-12 text-center">
        <p className="text-destructive">هذه الصفحة للمشرفين فقط</p>
        <Link to="/account" className="mt-2 inline-block text-sm underline">العودة لحسابي</Link>
      </div>
    );
  }
  return (
    <div className="container-lux py-8">
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3 text-sm">
        <Link to="/admin" activeOptions={{ exact: true }} className="rounded-md px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-ink text-primary-foreground" }}>نظرة عامة</Link>
        <Link to="/admin/orders" className="rounded-md px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-ink text-primary-foreground" }}>الطلبات</Link>
        <Link to="/admin/products" className="rounded-md px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-ink text-primary-foreground" }}>المنتجات</Link>
        <Link to="/admin/delivery" className="rounded-md px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-ink text-primary-foreground" }}>التوصيل</Link>
        <Link to="/admin/settings" className="rounded-md px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "bg-ink text-primary-foreground" }}>الإعدادات</Link>
      </nav>
      <Outlet />
    </div>
  );
}
