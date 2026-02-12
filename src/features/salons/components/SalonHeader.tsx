"use client";

import { PageHeader } from "@/components/ui/PageHeader";

export function SalonHeader() {
  return (
    <PageHeader
      showLanguage={true}
      showHome={true}
      showSearch={false}
      showShare={false}
    />
  );
}
