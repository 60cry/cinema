import { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { WatchlistDisplay } from '@/components/watchlist/WatchlistDisplay';

export const revalidate = 0; // Disable ISR
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'قائمة المشاهدة | سينما العرب',
  description: 'عرض قائمة الأفلام والمسلسلات والأنمي المحفوظة للمشاهدة لاحقاً',
  robots: {
    index: false,
    follow: false,
    nocache: true, // Good for private, dynamic content
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function WatchlistPage() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "الرئيسية", href: "/" },
    { label: "قائمة المشاهدة", href: "/watchlist", isCurrent: true },
  ];

  return (
    <Suspense fallback={<div className="h-[60vh] min-h-[400px] w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs items={breadcrumbItems} />
        
        <h1 className="text-3xl font-bold mt-6 mb-8">قائمة المشاهدة</h1>
        
        <div id="watchlist-container">
          <WatchlistDisplay />
        </div>
      </div>
    </Suspense>
  );
} 