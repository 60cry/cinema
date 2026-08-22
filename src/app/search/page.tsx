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

  const title = query ? `نتائج البحث عن "${query}" | ${siteName}` : `بحث في ${siteName}`;
  const description = query 
    ? `استكشف نتائج البحث عن "${query}" في ${siteName}. اعثر على الأفلام والمسلسلات والأنمي والممثلين والمخرجين.`
    : `ابحث في ${siteName} عن أحدث الأفلام والمسلسلات والأنمي والممثلين والمخرجين.`;

  // Dynamic OG image for search results or a generic one
  const ogImageUrl = new URL(`${siteUrl}/api/og`);
  ogImageUrl.searchParams.append('title', query ? `بحث: ${query}`: 'بحث في الموقع');
  ogImageUrl.searchParams.append('type', 'search'); // Custom type for OG image
  // No specific item image for general search page, /api/og will use a default

  const metadataResult: Metadata = {
    title: title,
    description: description.substring(0, 160),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: title,
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
      type: 'website', // Search page is part of a website
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description.substring(0, 160),
      images: [ogImageUrl.toString()],
    },
    // Add robots tag: index if there's a query, noindex if it's an empty search page
    // For now, let's allow indexing of all search pages as they might have unique query content.
    // If empty search pages become an issue, this can be changed:
    // robots: query ? 'index, follow' : 'noindex, follow',
  };

  // JSON-LD Schemas
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

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: siteUrl },
  ];
  if (query) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: `نتائج البحث عن "${query}"`, item: pageUrl });
  } else {
    breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: 'بحث', item: pageUrl });
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  if (!metadataResult.other) {
    metadataResult.other = {};
  }
  metadataResult.other['json-ld'] = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      websiteSchema,
      breadcrumbJsonLd
    ]
  });

  return metadataResult;
}

// The page is now a server component that renders the client component
export default async function SearchPage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise;
    const query = searchParams.q as string || '';
    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "الرئيسية", href: "/" },
    ];

    if (query) {
        breadcrumbItems.push({
            label: `نتائج البحث عن "${query}"`,
            href: `${siteUrl}/search?q=${encodeURIComponent(query)}`,
            isCurrent: true,
        });
    } else {
        breadcrumbItems.push({
            label: "بحث",
            href: `${siteUrl}/search`,
            isCurrent: true,
        });
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
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