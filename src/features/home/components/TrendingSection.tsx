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
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            D-{item.dDay}
          </div>
        )}
        <button className="absolute bottom-2 right-2 p-1.5 bg-white/80 rounded-full backdrop-blur-sm">
          <Heart
            className={`w-4 h-4 ${item.isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
          />
        </button>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-medium mb-0.5">
          {item.shopName}
        </p>
        <h3 className="text-xs text-gray-900 font-normal line-clamp-2 min-h-[32px]">
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
        <button className="text-xs text-gray-400">전체보기</button>
      </div>
      <div className="flex overflow-x-auto px-4 pb-4 gap-3 scrollbar-hide">
        {items.map((item) => (
          <TrendingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
