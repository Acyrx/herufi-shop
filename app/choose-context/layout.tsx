import { AuthThemeFix } from "@/components/auth/theme-fix";

export default function ChooseContextLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AuthThemeFix />
      {children}
    </div>
  );
}
