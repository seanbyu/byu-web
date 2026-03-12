"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, Search, Scissors, Palette, Wand2, Sparkles, Play } from "lucide-react";
import type { ComponentType } from "react";

type TabKey = "styleTip" | "styleBook" | "salon";

type StyleCategory = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
};

type VideoItem = {
  id: string;
  title: string;
  youtubeUrl: string;
};

const STYLE_CATEGORIES: StyleCategory[] = [
  { id: "bangs", icon: Scissors, labelKey: "styleBook.categories.bangs" },
  { id: "wave", icon: Palette, labelKey: "styleBook.categories.wave" },
  { id: "men", icon: Wand2, labelKey: "styleBook.categories.men" },
  { id: "daily", icon: Sparkles, labelKey: "styleBook.categories.daily" },
];

// ✏️ 여기에 YouTube URL을 추가하세요 (youtu.be/xxx 또는 youtube.com/shorts/xxx 모두 지원)
const CATEGORY_VIDEOS: Record<string, VideoItem[]> = {
  bangs: [
    { id: "bg1", title: "테스트 영상 1", youtubeUrl: "https://www.youtube.com/shorts/0abRLnAj9bY" },
    { id: "bg2", title: "테스트 영상 2", youtubeUrl: "https://www.youtube.com/shorts/tPlWklZOaJY" },
    { id: "bg3", title: "테스트 영상 3", youtubeUrl: "https://www.youtube.com/shorts/kDU3CWIuOio" },
    { id: "bg4", title: "테스트 영상 4", youtubeUrl: "https://www.youtube.com/shorts/32E9L-FvWZA" },
  ],
  wave: [],
  men: [],
  daily: [],
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^&\n?#]+)/
  );
  return match?.[1] ?? null;
}

function YouTubeCard({ video }: { video: VideoItem }) {
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoId = extractYouTubeId(video.youtubeUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (iframeLoaded && pendingPlay) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*"
      );
      setPlaying(true);
      setPendingPlay(false);
    }
  }, [iframeLoaded, pendingPlay]);

  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&enablejsapi=1`;

  const handlePlay = () => {
    if (iframeLoaded) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*"
      );
      setPlaying(true);
    } else {
      setPendingPlay(true);
    }
  };

  return (
    <div ref={containerRef} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-[9/16] w-full bg-gray-100">
        {inView && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            className={`absolute inset-0 h-full w-full ${playing ? "" : "pointer-events-none"}`}
          />
        )}
        {!playing && (
          <button onClick={handlePlay} className="group absolute inset-0 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
              {pendingPlay ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                  <Play className="h-4 w-4 fill-gray-900 text-gray-900" style={{ marginLeft: 2 }} />
                </div>
              )}
            </div>
          </button>
        )}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-medium text-gray-900">{video.title}</p>
      </div>
    </div>
  );
}

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "styleTip", labelKey: "tabs.styleTip" },
  { key: "styleBook", labelKey: "tabs.styleBook" },
  { key: "salon", labelKey: "tabs.salon" },
];

export function SearchView() {
  const t = useTranslations("search");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("styleBook");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVideos = selectedCategory
    ? (CATEGORY_VIDEOS[selectedCategory] ?? [])
    : Object.values(CATEGORY_VIDEOS).flat();
  const validVideos = filteredVideos.filter((v) => extractYouTubeId(v.youtubeUrl));

  return (
    <div className="flex h-dvh flex-col overflow-y-auto overscroll-none bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              autoFocus
              className="w-full rounded-full border-2 border-primary-300 bg-gray-50 py-2 pl-9 pr-4 text-base text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[60px] z-40 bg-white">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 py-4 pb-24">
        {activeTab === "styleBook" && (
          <div className="space-y-5">
            {/* Style Categories */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {t("styleBook.categoryTitle")}
              </h3>
              <div className="grid grid-cols-4 gap-2.5">
                {STYLE_CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const isActive = selectedCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCategory(isActive ? null : item.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2.5 transition-colors
                        ${isActive
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? "text-primary-600" : "text-primary-500"}`} />
                      <span className="text-[11px] font-medium sm:text-xs">
                        {t(item.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Video Grid */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {t("styleBook.videoTitle")}
              </h3>
              {validVideos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {validVideos.map((video) => (
                    <YouTubeCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Play className="mb-2 h-8 w-8" />
                  <p className="text-sm">{t("styleBook.noVideos")}</p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "styleTip" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">{t("styleTip.comingSoon")}</p>
          </div>
        )}

        {activeTab === "salon" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">{t("salon.comingSoon")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
