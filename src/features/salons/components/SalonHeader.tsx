"use client";

import { PageHeader } from "@/components/ui/PageHeader";

export function SalonHeader() {
  return (
    <PageHeader
      showBell
      showLanguage
      showHome={false}
      showSearch={false}
      showShare={false}
    />
  );
}
