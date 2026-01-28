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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

// Font class map by locale
const fontClassMap: Record<Locale, string> = {
  en: geistSans.variable,
  ko: `${geistSans.variable} ${notoSansKR.variable}`,
  th: `${geistSans.variable} ${notoSansThai.variable}`,
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
        className={`${localeFonts} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            <ClientAuthProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID}>
              {children}
              <AuthBottomNav />
            </ClientAuthProvider>
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
