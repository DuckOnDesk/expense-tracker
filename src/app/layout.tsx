import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "가계부",
  description: "알림 기반 자동 가계부",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {user && (
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
              <nav className="flex items-center gap-4 text-sm font-medium">
                <Link href="/" className="hover:text-blue-600">
                  대시보드
                </Link>
                <Link href="/transactions" className="hover:text-blue-600">
                  거래 내역
                </Link>
              </nav>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
