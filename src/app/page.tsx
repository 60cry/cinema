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
  const pageTitle = "مشاهدة وتحميل أفلام ومسلسلات وانمي مترجمة";
  const pageDescription = "اكبر منصة عربية لمشاهدة وتحميل الافلام والمسلسلات والانمي بجودة عالية ومترجمة. اكتشف آلاف العناوين المميزة.";

  const ogImageUrl = new URL(`${siteUrl}/api/og`);
  ogImageUrl.searchParams.set("title", "سينما العرب");
  ogImageUrl.searchParams.set("description", "اكبر منصة عربية للأفلام والمسلسلات والانمي");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: "سينما العرب | مشاهدة وتحميل أفلام ومسلسلات وانمي مترجمة",
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
      title: "سينما العرب | مشاهدة وتحميل أفلام ومسلسلات وانمي مترجمة",
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
        <div className="container mx-auto px-2 sm:px-4">
          {/* Popular Movies Section */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">أحدث الأفلام المترجمة</h2>
            <Suspense fallback={<div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
              {popularMoviesData?.results?.length > 0 ? (
                <MediaGridList
                  title="أفلام جديدة للمشاهدة والتحميل"
                  items={popularMoviesData.results}
                  type="movie"
                  viewMoreLink="/movies"
                  className="mb-10 sm:mb-16 bg-card p-3 sm:p-6 rounded-xl border border-border"
                  initialCount={12}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">لم يتم العثور على أفلام جديدة.</p>
              )}
            </Suspense>
          </section>

          {/* Top Rated Movies Section */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">أفضل الأفلام تقييماً</h2>
            <Suspense fallback={<div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
              {topRatedMoviesData?.results?.length > 0 ? (
                <MediaGridList
                  title="أفلام عالية التقييم للمشاهدة والتحميل"
                  items={topRatedMoviesData.results}
                  type="movie"
                  viewMoreLink="/movies"
                  className="mb-10 sm:mb-16 bg-card p-3 sm:p-6 rounded-xl border border-border"
                  initialCount={12}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">لم يتم العثور على أفلام عالية التقييم.</p>
              )}
            </Suspense>
          </section>

          {/* Popular TV Shows Section */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">مسلسلات مميزة</h2>
            <Suspense fallback={<div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
              {popularTvShowsData?.results?.length > 0 ? (
                <MediaGridList
                  title="مسلسلات جديدة للمشاهدة والتحميل"
                  items={popularTvShowsData.results}
                  type="tv"
                  viewMoreLink="/tv"
                  className="mb-10 sm:mb-16 bg-card p-3 sm:p-6 rounded-xl border border-border"
                  initialCount={12}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">لم يتم العثور على مسلسلات جديدة.</p>
              )}
            </Suspense>
          </section>

          {/* Popular Anime Section */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">انمي بجودة عالية</h2>
            <Suspense fallback={<div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
              {popularAnimeData?.results?.length > 0 ? (
                <MediaGridList
                  title="انمي جديد للمشاهدة والتحميل"
                  items={popularAnimeData.results}
                  type="tv"
                  viewMoreLink="/anime"
                  className="mb-10 sm:mb-16 bg-card p-3 sm:p-6 rounded-xl border border-border"
                  initialCount={12}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">لم يتم العثور على انمي جديد.</p>
              )}
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}