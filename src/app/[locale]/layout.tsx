import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai, Noto_Sans_KR } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ClientAuthProvider } from "@/features/auth/providers/ClientAuthProvider";
import { AuthBottomNav } from "@/features/auth/components/AuthBottomNav";
import "../globals.css";

// Base Latin font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Thai font - Noto Sans Thai for optimal readability
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Korean font - Noto Sans KR for better Korean typography
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// Font class map by locale - className과 variable 모두 사용
const fontClassMap: Record<Locale, string> = {
  en: `${geistSans.className} ${geistSans.variable}`,
  ko: `${notoSansKR.className} ${geistSans.variable} ${notoSansKR.variable}`,
  th: `${notoSansThai.className} ${geistSans.variable} ${notoSansThai.variable}`,
};

export const metadata: Metadata = {
  title: "Salon Store",
  description: "Beauty salon booking platform",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  // Get locale-specific font classes
  const localeFonts = fontClassMap[locale as Locale] || fontClassMap.en;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${localeFonts} ${geistMono.variable} antialiased bg-gray-100`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            <ClientAuthProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID}>
              {/* 모바일 앱 레이아웃: 회색 배경 + 중앙 흰색 컨테이너 */}
              <div className="min-h-screen flex justify-center">
                {/* 모바일 컨테이너: 흰색 배경, 최대 너비, flex 구조 */}
                <div className="w-full max-w-[448px] min-h-screen flex flex-col bg-white shadow-xl">
                  {/* 메인 컨텐츠 - flex-1로 남은 공간 차지 */}
                  <main className="flex-1">
                    {children}
                  </main>
                  {/* 하단 네비게이션 - 컨테이너 하단에 sticky */}
                  <AuthBottomNav />
                </div>
              </div>
            </ClientAuthProvider>
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
