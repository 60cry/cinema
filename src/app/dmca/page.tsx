import React from 'react';
import Link from 'next/link';

export const revalidate = 3600; // 1 hour in seconds

const DMCAPage = () => {
  const siteName = "سينما العرب";
  const siteDomain = "cinema4arab.online";
  // const dmcaEmail = "dmca@cinema4arab.online"; // IMPORTANT: Replace with your actual DMCA email - Removed as unused

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-screen">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-4xl font-bold text-center text-purple-400">DMCA</h1>
      </header>

      <article className="prose prose-lg prose-invert max-w-3xl mx-auto text-right" dir="rtl">
        <p>
          موقع {siteName} لا يستضيف أي محتوي علي السيرفر الخاص به , موقع {siteName} يضع روابط وتضمين لمحتوي مرفوع علي سيرفرات خارجية.
        </p>
        <p>
          موقع {siteName} غير مسئول عن اي محتوي تم تحميله علي سيرفرات ومواقع خارجية &quot;مواقع طرف 3&quot; , وبهذا فان موقع {siteName} لا ينتهك حقوق الطبع والنشر و قانون الألفية للملكية الرقمية DMCA.
        </p>
        <p>
          اذا كان لديك شكوي خاصة بالروابط والتضامين الخارجية رجاء التواصل مع ادارة هذه السيرفرات والمواقع الخارجية .
        </p>

        <hr className="my-6 sm:my-8 border-border" />

        <div className="text-left" dir="ltr">
          <p>
            {siteDomain} doesn&apos;t host any content on it own server and just linking to or embedding content that was uploaded to popular Online Video hosting.
          </p>
          <p>
            All trademarks, Videos, trade names, service marks, copyrighted work, logos referenced herein belong to their respective owners/companies. {siteDomain} is not responsible for what other people upload to 3rd party sites.
          </p>
          <p>
            We urge all copyright owners, to recognize that the links contained within this site are located somewhere else on the web or video embedded are from other various site like included above!. If you have any legal issues please contact appropriate media file owners / hosters.
          </p>
        </div>

        <p className="mt-8 text-center" dir="rtl">
          مع تحيات إدارة موقع {siteName}
        </p>

      </article>

      <footer className="text-center mt-12 py-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Return to <Link href="/" className="text-purple-400 hover:underline">Homepage</Link>
        </p>
      </footer>
    </div>
  );
};

export default DMCAPage;

const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
const pageUrl = `${siteUrl}/dmca`;
const siteName = 'سينما العرب';
const pageTitle = 'سياسة حقوق النشر (DMCA) - سينما العرب';
const pageDescription = 'إشعار انتهاك حقوق الطبع والنشر بموجب قانون الألفية الجديدة لحقوق طبع ونشر المواد الرقمية لموقع سينما العرب. اقرأ سياستنا وكيفية الإبلاغ.';

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: siteName,
    images: [
      {
        url: `${siteUrl}/og-image.png`, // Use a general site OG image
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
    type: 'article', // Policy pages can be treated as articles
    locale: 'ar_SA',
    publishedTime: new Date().toISOString(), // Or a fixed date of last policy update
    modifiedTime: new Date().toISOString(), // Or a fixed date of last policy update
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: [`${siteUrl}/og-image.png`],
  },
  other: {
    ['json-ld']: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage', // Or 'AboutPage' or 'Article' if more appropriate
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: pageTitle,
          description: pageDescription,
          isPartOf: {
            '@id': `${siteUrl}/#website`,
          },
          breadcrumb: {
            '@id': `${pageUrl}#breadcrumb`,
          },
          // datePublished: "2023-01-01T12:00:00+00:00", // Example if it's an article with publish date
          // dateModified: "2024-01-15T10:00:00+00:00", // Example
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'سياسة حقوق النشر (DMCA)', item: pageUrl },
          ],
        },
      ],
    }),
  },
}; 