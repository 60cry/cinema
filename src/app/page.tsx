import {
  getPopularMovies,
  getPopularTvShows,
  getPopularAnime,
  getTopRatedMovies,
} from "@/lib/tmdb";
import { getLatestCommentsWithMediaDetails, type CommentWithMedia } from "@/lib/comments";
import { CommentTicker } from "@/components/home/CommentTicker";
import { HeroSlider } from "@/components/home/HeroSlider";
import { MediaGridList } from "@/components/media/MediaGridList";
import { Suspense } from "react";
import type { Metadata } from "next";

export const revalidate = 3600; // 1 hour in seconds

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.CANONICAL_URL || "https://cinema4arab.online";
  const pageTitle = "سينما العرب | مشاهدة وتحميل أفلام ومسلسلات وانمي مترجمة";
  const pageDescription = "اكبر منصة عربية لمشاهدة وتحميل الافلام والمسلسلات والانمي بجودة عالية ومترجمة. اكتشف آلاف العناوين المميزة مع تحديثات يومية وروابط مباشرة.";

  const ogImageUrl = new URL(`${siteUrl}/api/og`);
  ogImageUrl.searchParams.set("title", "سينما العرب");
  ogImageUrl.searchParams.set("description", "اكبر منصة عربية للأفلام والمسلسلات والانمي");

  return {
    title: {
      absolute: pageTitle,
    },
    description: pageDescription,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: "سينما العرب - أفلام ومسلسلات وانمي",
        },
      ],
      url: siteUrl,
      type: "website",
      locale: "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function HomePage() {
  let popularMoviesData, popularTvShowsData, popularAnimeData, topRatedMoviesData;
  let commentsWithMedia: CommentWithMedia[] = [];

  try {
    [popularMoviesData, popularTvShowsData, popularAnimeData, topRatedMoviesData, commentsWithMedia] =
      await Promise.all([
        getPopularMovies(1),
        getPopularTvShows(1),
        getPopularAnime(1),
        getTopRatedMovies(1),
        getLatestCommentsWithMediaDetails(50),
      ]);
  } catch (error) {
    console.error("Error fetching data for HomePage:", error);
    popularMoviesData = { page: 1, results: [], total_pages: 0, total_results: 0 };
    popularTvShowsData = { page: 1, results: [], total_pages: 0, total_results: 0 };
    popularAnimeData = { page: 1, results: [], total_pages: 0, total_results: 0 };
    topRatedMoviesData = { page: 1, results: [], total_pages: 0, total_results: 0 };
    commentsWithMedia = [];
  }

  return (
    <div className="w-full">
      <h1 className="sr-only">سينما العرب | مشاهدة وتحميل أفلام ومسلسلات وانمي مترجمة</h1>
      <HeroSlider movies={popularMoviesData?.results || []} />

      {/* Latest Comments Marquee Section */}
      <CommentTicker comments={commentsWithMedia} />

      {/* Content Sections */}
      <div className="bg-[var(--section-background)] w-full px-0 py-8 sm:py-12">
        <div className="container mx-auto px-2 sm:px-4 space-y-6 sm:space-y-10">
          {/* Popular Movies Section */}
          <Suspense fallback={<div className="h-64 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />}>
            {popularMoviesData?.results?.length > 0 ? (
              <MediaGridList
                title="أحدث الأفلام المترجمة"
                items={popularMoviesData.results}
                type="movie"
                viewMoreLink="/movies"
                className="bg-card p-3 sm:p-6 rounded-xl border border-border"
                initialCount={12}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">لم يتم العثور على أفلام جديدة.</p>
            )}
          </Suspense>

          {/* Top Rated Movies Section */}
          <Suspense fallback={<div className="h-64 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />}>
            {topRatedMoviesData?.results?.length > 0 ? (
              <MediaGridList
                title="أفضل الأفلام تقييماً"
                items={topRatedMoviesData.results}
                type="movie"
                viewMoreLink="/movies"
                className="bg-card p-3 sm:p-6 rounded-xl border border-border"
                initialCount={12}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">لم يتم العثور على أفلام عالية التقييم.</p>
            )}
          </Suspense>

          {/* Popular TV Shows Section */}
          <Suspense fallback={<div className="h-64 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />}>
            {popularTvShowsData?.results?.length > 0 ? (
              <MediaGridList
                title="أحدث المسلسلات الحصرية"
                items={popularTvShowsData.results}
                type="tv"
                viewMoreLink="/tv"
                className="bg-card p-3 sm:p-6 rounded-xl border border-border"
                initialCount={12}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">لم يتم العثور على مسلسلات جديدة.</p>
            )}
          </Suspense>

          {/* Popular Anime Section */}
          <Suspense fallback={<div className="h-64 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />}>
            {popularAnimeData?.results?.length > 0 ? (
              <MediaGridList
                title="أحدث مسلسلات الأنمي المترجمة"
                items={popularAnimeData.results}
                type="tv"
                viewMoreLink="/anime"
                className="bg-card p-3 sm:p-6 rounded-xl border border-border"
                initialCount={12}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">لم يتم العثور على انمي جديد.</p>
            )}
          </Suspense>

          {/* SEO Editorial / Crawlable About Section */}
          <section className="bg-card/70 border border-border/80 rounded-2xl p-6 sm:p-10 mt-12 text-muted-foreground leading-relaxed">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
              عن سينما العرب - وجهتك الأولى لمشاهدة وتحميل الأفلام والمسلسلات
            </h2>
            <p className="mb-4 text-sm sm:text-base">
              مرحباً بكم في <strong>سينما العرب</strong>، المنصة الرائدة في العالم العربي لتقديم أحدث الأفلام والمسلسلات التلفزيونية والأنمي المترجم والمدبلج بأعلى جودة ممكنة (FHD, 1080p, 720p, 4K). نحرص على تزويد المشاهدين بتجربة سينمائية مميزة تشمل روابط مشاهدة مباشرة سريعة وسيرفرات تحميل متعددة تلائم جميع سرعات الإنترنت ومختلف الأجهزة.
            </p>
            <p className="text-sm sm:text-base">
              تضم مكتبتنا تشكيلة واسعة من تصنيفات السينما العالمية والعربية: أفلام الأكشن، المغامرات، الخيال العلمي، الدراما، الرعب، والكوميديا، بالإضافة إلى المواسم الكاملة لأشهر المسلسلات العالمية وحلقات الأنمي الياباني الأسبوعية فور صدورها مع ترجمة احترافية ودقيقة.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}