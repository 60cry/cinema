import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import BottomNavbar from "@/components/layout/BottomNavbar";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Script from "next/script";
import 'highlight.js/styles/github-dark.css'
import Image from "next/image";

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// Define constants to ensure consistency
const SITE_URL = process.env.CANONICAL_URL || 'https://cinema4arab.online';
const SITE_NAME = 'سينما العرب';
const SITE_DESCRIPTION = 'سينما العرب | موقعك الأول لمشاهدة وتحميل الأفلام والمسلسلات والانمي العربية والأجنبية المترجمة بجودة عالية مع توفر روابط مباشرة وسيرفرات متعددة';

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  keywords: ["أفلام", "مسلسلات", "انمي", "افلام عربية", "مسلسلات عربية", "سينما العرب", "تحميل افلام", "مشاهدة اونلاين", "ترجمة احترافية"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - مشاهدة وتحميل أحدث الأفلام والمسلسلات`,
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: '@cinema4arab',
    site: '@cinema4arab',
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'y90rHeeduMyYYExkshTRomjPyEAM-PoPWvpManDegpw',
  },
  icons: {
    icon: '/logo.svg', // Using logo.svg as the primary icon
    // you can add other icon types like 'apple', 'shortcut' if needed
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
};

// Define the structure for the Organization JSON-LD
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    '@id': `${SITE_URL}/#logo`,
    url: `${SITE_URL}/logo.svg`,
    contentUrl: `${SITE_URL}/logo.svg`,
    caption: `${SITE_NAME} Logo`
  },
  description: SITE_DESCRIPTION,
  sameAs: [
    // "https://www.facebook.com/YourPage",
    // "https://twitter.com/YourHandle",
    // "https://www.instagram.com/YourProfile/",
    // "https://www.youtube.com/YourChannel"
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string',
  },
};

// Define the structure for the WebSite JSON-LD
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  publisher: {
    '@id': `${SITE_URL}/#organization`
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  },
  inLanguage: 'ar-SA'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} scroll-smooth dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-950 text-gray-100 flex flex-col min-h-screen w-full" suppressHydrationWarning>
        {/* Promotional Top Navbar with Glow Effect */}
        <div className="relative overflow-hidden bg-[#0a174e]">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" />
            </div>
            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
            <div className="relative z-10 container mx-auto px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-white">
                    {/* Left section - Announcement */}
                    <div className="flex items-center gap-2 animate-bounce-slow">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.343 17.657l-1.414 1.414m12.728 0l-1.414-1.414M6.343 6.343L4.929 4.929" /></svg>
                        <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                            للدعاية والإعلان
                        </span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                    </div>
                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-white to-transparent opacity-50" />
                    {/* Center section - Main message */}
                    <div className="flex items-center gap-2 text-center">
                        <span className="text-xs sm:text-sm font-medium opacity-90">
                            احجز مساحتك الإعلانية الآن
                        </span>
                    </div>
                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-white to-transparent opacity-50" />
                    {/* Right section - Telegram contact */}
                    <a 
                        href="https://t.me/baghdadbytes" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        dir="rtl"
                        className="group flex flex-row-reverse items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                       
                        <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                            @baghdadbytes
                        </span>
                        <span className="text-xs opacity-75">تواصل معنا</span>
                    </a>
                </div>
            </div>
            {/* Bottom border glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent blur-sm" />
        </div>
        {/* Add custom styles for animations */}
        <style>{`
            @keyframes gradient-x {
                0%, 100% {
                    background-size: 200% 200%;
                    background-position: left center;
                }
                50% {
                    background-size: 200% 200%;
                    background-position: right center;
                }
            }
            @keyframes bounce-slow {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-10px);
                }
            }
            @keyframes spin-slow {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
            .animate-gradient-x {
                animation: gradient-x 15s ease infinite;
            }
            .animate-bounce-slow {
                animation: bounce-slow 2s ease-in-out infinite;
            }
            .animate-spin-slow {
                animation: spin-slow 3s linear infinite;
            }
            .animation-delay-2000 {
                animation-delay: 2s;
            }
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ThemeProvider>
          <Suspense fallback={<div className="h-16 sm:h-20 w-full bg-white/95 dark:bg-gray-950/95 border-b border-gray-200 dark:border-gray-800" />}>
            <Header />
          </Suspense>
          <main className="flex-grow w-full pt-16 sm">
            {children}
          </main>
          <BottomNavbar />
          <footer className="mt-auto bg-card border-t border-border px-0 sm:px-0 pt-8">
            <div className="w-full px-4 sm:px-8 max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
                {/* About Section */}
                <div className="flex flex-col items-center md:items-start text-center md:text-right">
                  <Link href="/" className="inline-block mb-4" aria-label="Go to Homepage">
                    <Image 
                        src="/logo.svg" 
                        alt="سينما العرب Logo" 
                        width={384}
                        height={96}
                        className="h-16 w-auto"
                    />
                  </Link>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 max-w-xs">
                    موقعك الأول لمشاهدة وتحميل الأفلام والمسلسلات والانمي بجودة عالية مع ترجمة احترافية
                  </p>
                  <div className="flex gap-3 mt-2">
                    <a href="#" className="bg-blue-500/10 hover:bg-blue-500/20 p-2 rounded-full transition-colors" aria-label="Facebook">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12"/></svg>
                    </a>
                    <a href="#" className="bg-blue-500/10 hover:bg-blue-500/20 p-2 rounded-full transition-colors" aria-label="Twitter">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.59-2.47.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 8.99 4.07 7.13 1.64 4.15c-.37.64-.58 1.39-.58 2.19 0 1.51.77 2.84 1.94 3.62-.72-.02-1.4-.22-1.99-.55v.06c0 2.11 1.5 3.87 3.5 4.27-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.12 2.91 3.99 2.94A8.6 8.6 0 0 1 2 19.54a12.13 12.13 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.39-.01-.58A8.72 8.72 0 0 0 24 4.59a8.48 8.48 0 0 1-2.54.7z"/></svg>
                    </a>
                    <a href="#" className="bg-blue-500/10 hover:bg-blue-500/20 p-2 rounded-full transition-colors" aria-label="Instagram">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 3.5zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm6.25 1.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                    </a>
                  </div>
                </div>
                
                {/* Primary Categories - Improved organization */}
                <div className="flex flex-col items-center md:items-start text-center md:text-right">
                  <h3 className="font-bold text-lg mb-4 text-blue-700 dark:text-blue-400">فئات المحتوى</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">أفلام</h4>
                      <ul className="space-y-1.5">
                        <li><Link href="/movies?genre=28" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">أفلام أكشن</Link></li>
                        <li><Link href="/movies?genre=12" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">أفلام مغامرة</Link></li>
                        <li><Link href="/movies?genre=878" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">خيال علمي</Link></li>
                        <li><Link href="/movies" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">جميع الأفلام</Link></li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">مسلسلات</h4>
                      <ul className="space-y-1.5">
                        <li><Link href="/tv?genre=10759" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">أكشن ومغامرة</Link></li>
                        <li><Link href="/tv?genre=18" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">دراما</Link></li>
                        <li><Link href="/anime" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">انمي</Link></li>
                        <li><Link href="/tv" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">جميع المسلسلات</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* General Links - Now includes more sections */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-center md:text-right">
                  <div className="flex flex-col items-center md:items-start">
                    <h3 className="font-bold text-lg mb-4 text-blue-700 dark:text-blue-400">روابط سريعة</h3>
                    <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                      <li><Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">الرئيسية</Link></li>
                      <li><Link href="/watchlist" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">قائمة المشاهدة</Link></li>
                      
                      <li><Link href="/search" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">البحث</Link></li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col items-center md:items-start">
                    <h3 className="font-bold text-lg mb-4 text-blue-700 dark:text-blue-400">روابط هامة</h3>
                    <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                      <li><Link href="/dmca" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">سياسة DMCA</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Add a site map link in the copyright section */}
              <div className="text-center border-t border-border pt-6 pb-8 text-xs sm:text-sm text-muted-foreground">
                <p className="mb-2">© {currentYear} <Link href="/" className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">سينما العرب</Link>. جميع الحقوق محفوظة.</p>
                <p>
                  <Link href="/sitemap_index.xml" className="hover:underline">خريطة الموقع</Link> • 
                  <Link href="/dmca" className="hover:underline mx-2">سياسة الخصوصية</Link>
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
        {/* Google tag (gtag.js) */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-7QNNF6XJ9V" 
          strategy="afterInteractive" 
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7QNNF6XJ9V');
          `}
        </Script>
      </body>
    </html>
  );
}
