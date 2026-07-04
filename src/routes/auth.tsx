import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — LUXE TIME DZ" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("مرحباً بعودتك");
    navigate({ to: "/account" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/account`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحساب بنجاح");
    navigate({ to: "/account" });
  }

  return (
    <div className="container-lux flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-luxe">
        <h1 className="mb-6 text-center font-display text-2xl font-bold">حسابك في <span className="text-gradient-gold">LUXE TIME</span></h1>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">دخول</TabsTrigger><TabsTrigger value="signup">حساب جديد</TabsTrigger></TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4 pt-4">
              <div><Label>البريد الإلكتروني</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>كلمة المرور</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full gold-gradient text-ink font-semibold" disabled={loading}>{loading ? "..." : "دخول"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-4 pt-4">
              <div><Label>الاسم الكامل</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><Label>البريد الإلكتروني</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>كلمة المرور</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full gold-gradient text-ink font-semibold" disabled={loading}>{loading ? "..." : "إنشاء الحساب"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
