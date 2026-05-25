"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/context";
import { getInitials } from "@/lib/utils";
import { Camera, Globe, Lock, LogOut, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const supabase = createClient();
  const { t, lang, setLang } = useLang();
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "", avatar_url: "" });
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile({ full_name: data?.full_name ?? "", email: user.email ?? "", phone: data?.phone ?? "", avatar_url: data?.avatar_url ?? "" });
    })();
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url });
    if (error) toast.error("Failed to save profile");
    else toast.success(t.settings.profileUpdated);
    setSavingProfile(false);
  }

  async function changePassword() {
    if (passwords.next !== passwords.confirm) { toast.error(t.settings.passwordMismatch); return; }
    if (passwords.next.length < 6) { toast.error(t.settings.passwordTooShort); return; }
    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    if (error) toast.error(error.message);
    else { toast.success(t.settings.passwordUpdated); setPasswords({ next: "", confirm: "" }); }
    setSavingPassword(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">{t.settings.title}</h2>
        <p className="text-muted-foreground text-sm">{t.settings.subtitle}</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-primary" />
            <CardTitle className="text-base">{t.settings.profile}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 object-cover" />
                ) : (
                  getInitials(profile.full_name || "U")
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                <Camera size={12} />
              </button>
            </div>
            <div>
              <p className="font-semibold">{profile.full_name || t.settings.fullName}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <Input label={t.settings.fullName} value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          <Input label={t.settings.phone} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <Input label={t.settings.email} value={profile.email} disabled className="opacity-60" />

          <Button onClick={saveProfile} loading={savingProfile} size="sm">
            <Save size={14} /> {t.settings.saveProfile}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            <CardTitle className="text-base">{t.settings.changePassword}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label={t.settings.newPassword} type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
          <Input label={t.settings.confirmPassword} type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
          <Button onClick={changePassword} loading={savingPassword} size="sm" variant="outline">
            <Lock size={14} /> {t.settings.updatePassword}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences / Language */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <CardTitle className="text-base">{t.settings.preferences}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-foreground">{t.settings.language}</label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setLang("en")}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${lang === "en" ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                <span className="text-base">🇬🇧</span> English
              </button>
              <button
                onClick={() => setLang("sw")}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${lang === "sw" ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                <span className="text-base">🇹🇿</span> Kiswahili
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {lang === "sw" ? "Lugha itabadilika mara moja." : "Language change takes effect immediately."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t.settings.signOut}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t.settings.signOutDesc}</p>
          <Button variant="danger" onClick={signOut} size="sm">
            <LogOut size={14} /> {t.settings.signOut}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
