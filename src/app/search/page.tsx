import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchResults } from '@/components/search/SearchResults';
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs";

export const revalidate = 3600; // 1 hour in seconds
export const runtime = 'edge';

// Define props using the standard Next.js structure
interface PageProps {
    params: Promise<Record<string, never>>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata based on the query
export async function generateMetadata({ searchParams: searchParamsPromise }: PageProps): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const query = searchParams?.q as string || '';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';
  const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
  const pageUrl = query ? `${siteUrl}/search?q=${encodeURIComponent(query)}` : `${siteUrl}/search`;

  const title = query ? `نتائج البحث عن "${query}"` : 'البحث';
  const description = query 
    ? `استكشف نتائج البحث عن "${query}" في ${siteName}. اعثر على الأفلام والمسلسلات والأنمي والممثلين والمخرجين.`
    : `ابحث في ${siteName} عن أحدث الأفلام والمسلسلات والأنمي والممثلين والمخرجين.`;

  const ogImageUrl = new URL(`${siteUrl}/api/og`);
  ogImageUrl.searchParams.append('title', query ? `بحث: ${query}`: 'بحث في الموقع');
  ogImageUrl.searchParams.append('type', 'search');

  return {
    title: title,
    description: description.substring(0, 160),
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} | ${siteName}`,
      description: description.substring(0, 160),
      url: pageUrl,
      siteName: siteName,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      type: 'website',
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description: description.substring(0, 160),
      images: [ogImageUrl.toString()],
    },
  };
}

// The page is now a server component that renders the client component
export default async function SearchPage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise;
    const query = searchParams.q as string || '';
    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';
    const pageUrl = query ? `${siteUrl}/search?q=${encodeURIComponent(query)}` : `${siteUrl}/search`;

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "الرئيسية", href: "/" },
    ];

    if (query) {
        breadcrumbItems.push({
            label: `نتائج البحث عن "${query}"`,
            href: `/search?q=${encodeURIComponent(query)}`,
            isCurrent: true,
        });
    } else {
        breadcrumbItems.push({
            label: "بحث",
            href: `/search`,
            isCurrent: true,
        });
    }

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: siteUrl,
      name: siteName,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: query ? `نتائج البحث عن "${query}"` : 'بحث', item: pageUrl }
      ],
    };

    const jsonLdGraph = {
      '@context': 'https://schema.org',
      '@graph': [websiteSchema, breadcrumbSchema]
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
            />
            <Breadcrumbs items={breadcrumbItems} className="mb-4 sm:mb-6" />
            <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">جاري تحميل البحث...</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-[240px] sm:h-[270px] w-full rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
              ))}
            </div>
          </div>
        }>
            <SearchResults initialQuery={query} />
        </Suspense>
    </div>
    );
} 