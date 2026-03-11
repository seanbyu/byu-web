"use client";

import { useState, useRef } from "react";
import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Scissors, Sparkles, Palette, Wand2, Play } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

type StylingCategory = {
    id: string;
    icon: ComponentType<{ className?: string }>;
    labelKey: string;
};

type VideoItem = {
    id: string;
    title: string;
    youtubeUrl: string;
};

const CATEGORIES: StylingCategory[] = [
    { id: "bangs", icon: Scissors, labelKey: "categories.bangs" },
    { id: "wave", icon: Palette, labelKey: "categories.wave" },
    { id: "men", icon: Wand2, labelKey: "categories.men" },
    { id: "daily", icon: Sparkles, labelKey: "categories.daily" },
];

// ✏️ 여기에 YouTube URL을 추가하세요 (youtu.be/xxx 또는 youtube.com/watch?v=xxx 모두 지원)
const CATEGORY_VIDEOS: Record<string, VideoItem[]> = {
    bangs: [
        { id: "bg1", title: "테스트 영상 1", youtubeUrl: "https://www.youtube.com/shorts/0abRLnAj9bY" },
        { id: "bg2", title: "테스트 영상 2", youtubeUrl: "https://www.youtube.com/shorts/tPlWklZOaJY" },
        { id: "bg3", title: "테스트 영상 3", youtubeUrl: "https://www.youtube.com/shorts/kDU3CWIuOio" },
        { id: "bg4", title: "테스트 영상 4", youtubeUrl: "https://www.youtube.com/shorts/32E9L-FvWZA" },
    ],
    wave: [
        // { id: "wv1", title: "웨이브 스타일링", youtubeUrl: "https://youtu.be/xxxxx" },
    ],
    men: [
        // { id: "mn1", title: "남자 스타일링", youtubeUrl: "https://youtu.be/xxxxx" },
    ],
    daily: [
        // { id: "da1", title: "데일리 셀프 스타일링", youtubeUrl: "https://youtu.be/xxxxx" },
    ],
};

function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^&\n?#]+)/);
    return match?.[1] ?? null;
}

function YouTubeCard({ video }: { video: VideoItem }) {
    const [playing, setPlaying] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const videoId = extractYouTubeId(video.youtubeUrl);

    if (!videoId) return null;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    // enablejsapi=1: postMessage로 재생 제어 (autoplay 없이 미리 로드)
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&enablejsapi=1`;

    const handlePlay = () => {
        // 클릭 핸들러 내에서 동기적으로 postMessage → 브라우저 autoplay 정책 우회
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            "*",
        );
        setPlaying(true);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="relative aspect-[9/16] w-full bg-gray-100">
                {/* iframe 미리 로드, loading=lazy로 뷰포트 밖은 지연 */}
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                />
                {!playing && (
                    <button onClick={handlePlay} className="group absolute inset-0 w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                                <Play className="h-4 w-4 fill-gray-900 text-gray-900" style={{ marginLeft: 2 }} />
                            </div>
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

export function StylingBookView() {
    const t = useTranslations("stylingBook");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredVideos = selectedCategory
        ? (CATEGORY_VIDEOS[selectedCategory] ?? [])
        : Object.values(CATEGORY_VIDEOS).flat();

    const validVideos = filteredVideos.filter((v) => extractYouTubeId(v.youtubeUrl));

    return (
        <div className="app-page-bleed bg-white">
            <PageHeader
                title={t("title")}
                showBack={true}
                showHome={false}
                showSearch={false}
                showShare={false}
                showLanguage={true}
            />

            <div className="app-page-tight app-stack pt-2">
                {/* Hero */}
                <section className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
                    <p className="text-xs font-semibold text-primary-600">{t("heroBadge")}</p>
                    <h2 className="mt-1 text-base font-bold text-gray-900 sm:text-lg">{t("heroTitle")}</h2>
                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">{t("heroDescription")}</p>
                </section>

                {/* Category filter */}
                <section className="app-section">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">{t("categoryTitle")}</h3>
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                        {CATEGORIES.map((item) => {
                            const Icon = item.icon;
                            const isActive = selectedCategory === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedCategory(isActive ? null : item.id)}
                                    className={`touch-target flex flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2.5 transition-colors
                    ${
                        isActive
                            ? "border-primary-300 bg-primary-50 text-primary-700"
                            : "border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}>
                                    <Icon
                                        className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? "text-primary-600" : "text-primary-500"}`}
                                    />
                                    <span className="text-[11px] font-medium sm:text-xs">{t(item.labelKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Video section */}
                <section className="app-section">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">{t("videoSectionTitle")}</h3>
                    {validVideos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                            {validVideos.map((video) => (
                                <YouTubeCard key={video.id} video={video} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                            <Play className="mb-2 h-8 w-8" />
                            <p className="text-sm">{t("noVideos")}</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
