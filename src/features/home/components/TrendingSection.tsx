import { Heart } from "lucide-react";
import { SalonMenu } from "@/features/salon-menus/api";

type TrendingItem = SalonMenu & {
  shopName: string;
  discountRate: number;
  imageUrl: string;
  isLiked: boolean;
  dDay?: number;
};

interface TrendingSectionProps {
  items: TrendingItem[];
}

function TrendingCard({ item }: { item: TrendingItem }) {
  return (
    <div className="flex-none w-[140px] flex flex-col gap-2">
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {item.dDay !== undefined && (
          <div className="absolute top-2 left-2 rounded-sm bg-red-500 px-2 py-1 text-xs font-bold text-white">
            D-{item.dDay}
          </div>
        )}
        <button className="touch-target absolute bottom-1 right-1 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
          <Heart
            className={`w-4 h-4 ${item.isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
          />
        </button>
      </div>
      <div>
        <p className="mb-0.5 text-xs font-medium text-gray-500">
          {item.shopName}
        </p>
        <h3 className="line-clamp-2 min-h-[36px] text-sm font-normal text-gray-900">
          {item.name}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm font-bold text-red-500">
            {item.discountRate}%
          </span>
          <span className="text-sm font-bold text-gray-900">
            {item.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TrendingSection({ items }: TrendingSectionProps) {
  return (
    <section className="py-6">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">지금 가장 트렌디한</h2>
        <button className="touch-target px-2 text-sm text-gray-500">전체보기</button>
      </div>
      <div className="flex overflow-x-auto px-4 pb-4 gap-3 scrollbar-hide">
        {items.map((item) => (
          <TrendingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
