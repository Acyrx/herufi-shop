import { Toaster } from "sonner";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="rounded-lg flex items-center justify-center">
            <Image
              src="/logo/favicon.png"
              width={50}
              height={50}
              alt="logo"
              className="rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Herufi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Smart Business Management Platform
          </p>
        </div>
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
