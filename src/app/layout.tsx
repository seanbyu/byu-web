import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "beauty by you",
  description: "Beauty salon booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
