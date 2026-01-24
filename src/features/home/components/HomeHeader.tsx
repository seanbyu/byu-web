import { Search, ShoppingCart } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex-1 mr-4">
        <div className="relative bg-gray-100 rounded-full px-4 py-2 flex items-center">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
            readOnly // Temporary
          />
        </div>
      </div>
      <button className="p-2 relative">
        <ShoppingCart className="w-6 h-6 text-gray-700" />
        {/* Optional: Cart Badge */}
      </button>
    </header>
  );
}
