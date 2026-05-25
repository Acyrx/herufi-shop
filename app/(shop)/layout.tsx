import { Toaster } from "sonner";
import { ShopNavbar } from "@/components/shop/navbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ShopNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8 pb-20">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
