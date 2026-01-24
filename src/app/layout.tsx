import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salon Store",
  description: "Beauty salon booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
