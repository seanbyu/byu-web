import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Scissors, Sun, Sparkles, Smile, Clock } from "lucide-react";

const VALID_CATEGORIES = ["hair", "nail", "makeup", "skin"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  hair: Scissors,
  nail: Sun,
  makeup: Sparkles,
  skin: Smile,
};

type Props = {
  params: Promise<{ locale: string; category: string }>;
};

export default async function CategoryComingSoonPage({ params }: Props) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category as Category)) {
    notFound();
  }

  const t = await getTranslations("common");
  const cat = category as Category;
  const Icon = CATEGORY_ICONS[cat];

  return (
    <div className="app-page-bleed bg-white min-h-dvh">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link
            href="/"
            className="touch-target -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold">{t(`categories.${cat}`)}</span>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-9 w-9 text-gray-400" />
        </div>
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary-500" />
          <p className="text-lg font-semibold text-gray-800">{t("comingSoon")}</p>
        </div>
        <p className="text-sm text-gray-400">{t("comingSoonDesc")}</p>
      </div>
    </div>
  );
}
