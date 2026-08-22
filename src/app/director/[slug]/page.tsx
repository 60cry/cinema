import {
    getPersonDetails,
    getPersonCombinedCredits,
    getImageUrl,
    POSTER_SIZE,
} from "@/lib/tmdb";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { UserCircle, AlertTriangle } from "lucide-react";
import { slugify, getCleanDescription } from "@/lib/utils";
import { MediaItemCard } from "@/components/media/MediaItemCard";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs";

// Define interfaces to properly type the credits
interface PersonMovieCredit {
  id: number;
  title: string;
  original_title?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  media_type: 'movie';
  job: string;
}

interface PersonTvCredit {
  id: number;
  name: string;
  original_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  media_type: 'tv';
  job: string;
}

// Define the PersonCredits interface locally since we can't import it
interface PersonCredits {
  cast: (PersonMovieCredit | PersonTvCredit)[];
  crew: (PersonMovieCredit | PersonTvCredit)[];
  id: number;
}

// Define props using the standard Next.js structure
type PageProps = {
    params: Promise<{ slug: string }>; // params is now a Promise
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams also a Promise (optional)
};

// --- Helper Functions ---
function extractIdFromSlug(slug: string): number | null {
    const parts = slug?.split('-');
    if (!parts || parts.length < 2) return null;
    const idString = parts[parts.length - 1];
    const id = parseInt(idString, 10);
    return isNaN(id) ? null : id;
}

// --- Metadata Generation ---
export async function generateMetadata(
  { params: paramsPromise }: PageProps,
): Promise<Metadata> {
  const params = await paramsPromise;
  const slug = params.slug;
  const personId = extractIdFromSlug(params.slug);
  if (!personId) {
    return { 
        title: 'المخرج غير موجود', 
        description: 'لم نتمكن من العثور على صفحة المخرج المطلوبة.'
    };
  }

  try {
    const person = await getPersonDetails(personId);

    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
    const pageUrl = `${siteUrl}/director/${slug}`;
    const profileImageUrl = person.profile_path ? getImageUrl(person.profile_path, 'w500') : undefined;

    const jobTitle = 'مخرج';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب';

    const ogImageUrl = new URL(`${siteUrl}/api/og`);
    ogImageUrl.searchParams.append('title', `${person.name} - ${jobTitle}`);
    ogImageUrl.searchParams.append('description', person.biography?.substring(0, 100) || jobTitle);
    ogImageUrl.searchParams.append('type', 'person');
    if (profileImageUrl) {
      ogImageUrl.searchParams.append('image', profileImageUrl);
    }

    const rawDescription = `تعرف على السيرة الذاتية للمخرج ${person.name} وأبرز أعماله السينمائية والتلفزيونية التي قام بإخراجها. ${person.biography || ''}`;
    const cleanDescription = getCleanDescription(rawDescription, 160);

    const metadata: Metadata = {
      title: `${person.name} - ${jobTitle} | أعماله وإخراجه`,
      description: cleanDescription,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: `${person.name} (${jobTitle}) | ${siteName}`,
        description: cleanDescription,
        url: pageUrl,
        siteName: siteName,
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: `${person.name} - ${jobTitle}`,
          }
        ],
        type: 'profile',
        locale: 'ar_SA',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${person.name} (${jobTitle}) | ${siteName}`,
        description: `السيرة الذاتية للمخرج ${person.name}. ${person.biography?.substring(0, 100) || ''}`,
        images: [ogImageUrl.toString()],
      },
    };

    return metadata;

  } catch (error) {
    console.error("Error fetching metadata for director:", personId, error);
    const initialParams = await paramsPromise;
    const slugForError = initialParams.slug;
    const pageUrl = `${process.env.CANONICAL_URL || 'https://cinema4arab.online'}/director/${slugForError}`;
    return { 
      title: 'خطأ في تحميل بيانات المخرج', 
      description: 'لم نتمكن من تحميل بيانات المخرج. الرجاء المحاولة مرة أخرى.', 
      alternates: { canonical: pageUrl },
    };
  }
}

export const revalidate = 3600; // 1 hour in seconds
export const runtime = 'edge';

// --- Page Component ---
export default async function DirectorDetailPage({ params: paramsPromise }: PageProps) {
    const params = await paramsPromise;
    const personId = extractIdFromSlug(params.slug);
    if (!personId) {
        notFound(); 
    }

    try {
        const [person, creditsData] = await Promise.all([
            getPersonDetails(personId),
            getPersonCombinedCredits(personId)
        ]);

        const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
        const pageUrl = `${siteUrl}/director/${params.slug}`;
        const profileImageUrl = getImageUrl(person.profile_path, POSTER_SIZE);

        const typedCredits = creditsData as unknown as PersonCredits;
        
        const directedMovieCredits = (typedCredits.crew || [])
          .filter(c => c.media_type === 'movie' && c.job === 'Director')
          .sort((a: PersonMovieCredit | PersonTvCredit, b: PersonMovieCredit | PersonTvCredit) => {
            const dateA = a.media_type === 'movie' && a.release_date ? new Date(a.release_date).getTime() : 0;
            const dateB = b.media_type === 'movie' && b.release_date ? new Date(b.release_date).getTime() : 0;
            return dateB - dateA;
          });
          
        const directedTvCredits = (typedCredits.crew || [])
          .filter(c => c.media_type === 'tv' && c.job === 'Director')
          .sort((a: PersonMovieCredit | PersonTvCredit, b: PersonMovieCredit | PersonTvCredit) => {
            const dateA = a.media_type === 'tv' && a.first_air_date ? new Date(a.first_air_date).getTime() : 0;
            const dateB = b.media_type === 'tv' && b.first_air_date ? new Date(b.first_air_date).getTime() : 0;
            return dateB - dateA;
          });

        const directedWorks = (typedCredits.crew || [])
          .filter((work: PersonMovieCredit | PersonTvCredit) => work.job === 'Director')
          .sort((a: PersonMovieCredit | PersonTvCredit, b: PersonMovieCredit | PersonTvCredit) => 
            ((b.vote_average || 0) - (a.vote_average || 0))
          )
          .slice(0, 5)
          .map((work: PersonMovieCredit | PersonTvCredit) => {
            const workName = work.media_type === 'movie' ? (work as PersonMovieCredit).title : (work as PersonTvCredit).name;
            const workType = work.media_type === 'movie' ? 'Movie' : 'TVSeries';
            const workUrl = work.media_type === 'movie'
              ? `${siteUrl}/movies/${slugify(workName)}-${work.id}`
              : `${siteUrl}/tv/${slugify(workName)}-${work.id}`;
            
            return {
              '@type': workType,
              name: workName,
              url: workUrl
            };
          });

        const personJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': `${pageUrl}#person`,
          name: person.name,
          description: person.biography || `السيرة الذاتية وأعمال المخرج ${person.name}.`,
          url: pageUrl,
          image: profileImageUrl,
          birthDate: person.birthday,
          deathDate: person.deathday,
          birthPlace: person.place_of_birth ? { '@type': 'Place', name: person.place_of_birth } : undefined,
          gender: person.gender === 1 ? 'https://schema.org/Female' : (person.gender === 2 ? 'https://schema.org/Male' : undefined),
          jobTitle: 'مخرج',
          knownForDepartment: 'Directing',
          ...(directedWorks.length > 0 && { knownFor: directedWorks }),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
          }
        };

        const breadcrumbJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: siteUrl },
                { '@type': 'ListItem', position: 2, name: person.name, item: pageUrl }
            ],
        };

        const jsonLdGraph = {
            '@context': 'https://schema.org',
            '@graph': [personJsonLd, breadcrumbJsonLd]
        };

        const jobTitleDisplay = 'مخرج';
        const seoText = `تعرف على السيرة الذاتية وأهم الأعمال التي أخرجها ${person.name} من أفلام ومسلسلات.`;

        const displayBreadcrumbItems: BreadcrumbItem[] = [
            { label: "الرئيسية", href: "/" },
            { label: person.name, href: `/director/${params.slug}`, isCurrent: true }, 
        ];

        return (
            <div className="container mx-auto px-0 sm:px-4 py-8">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
                />
                <div className="mb-4 px-4 sm:px-0">
                     <Breadcrumbs items={displayBreadcrumbItems} />
                </div>

                <div className="mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8">
                    <div className="flex-shrink-0 w-48 h-72 md:w-60 md:h-90 bg-muted rounded-lg overflow-hidden shadow-lg">
                        {profileImageUrl ? (
                            <Image
                                src={profileImageUrl}
                                alt={`${person.name} - ${jobTitleDisplay}`}
                                width={500}
                                height={750}
                                className="object-cover w-full h-full"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                <UserCircle className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow text-center sm:text-right">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{person.name}</h1>
                        <p className="text-lg text-muted-foreground mb-1">{jobTitleDisplay}</p>
                        {person.birthday && (
                            <p className="text-sm text-muted-foreground">
                                تاريخ الميلاد: {new Date(person.birthday).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                {person.place_of_birth && `، ${person.place_of_birth}`}
                            </p>
                        )}
                        {person.deathday && (
                            <p className="text-sm text-muted-foreground">
                                تاريخ الوفاة: {new Date(person.deathday).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">{seoText}</p>
                    </div>
                </div>

                {person.biography && (
                    <section className="mb-10 px-4 sm:px-0">
                        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                            <UserCircle className="w-6 h-6 mr-2 text-primary" /> السيرة الذاتية
                        </h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {person.biography}
                        </p>
                    </section>
                )}

                {directedMovieCredits.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4">أفلام من إخراجه</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {directedMovieCredits.filter(credit => credit.media_type === 'movie').slice(0, 12).map(credit => (
                                <MediaItemCard 
                                    key={`movie-${credit.id}`} 
                                    item={{
                                        id: credit.id,
                                        title: credit.title || '',
                                        poster_path: credit.poster_path || null,
                                        backdrop_path: credit.backdrop_path || null,
                                        release_date: credit.release_date,
                                        vote_average: credit.vote_average || 0,
                                        vote_count: credit.vote_count || 0,
                                        original_title: credit.original_title || '',
                                        popularity: 0,
                                        overview: ''
                                    }} 
                                    type="movie" 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {directedTvCredits.length > 0 && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4">مسلسلات من إخراجه</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {directedTvCredits.filter(credit => credit.media_type === 'tv').slice(0, 12).map(credit => (
                                <MediaItemCard 
                                    key={`tv-${credit.id}`} 
                                    item={{
                                        id: credit.id,
                                        name: credit.name || '',
                                        poster_path: credit.poster_path || null,
                                        backdrop_path: credit.backdrop_path || null,
                                        first_air_date: credit.first_air_date,
                                        vote_average: credit.vote_average || 0,
                                        vote_count: credit.vote_count || 0,
                                        original_name: credit.original_name || '',
                                        popularity: 0,
                                        overview: ''
                                    }} 
                                    type="tv" 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!directedMovieCredits.length && !directedTvCredits.length && (
                     <div className="text-center py-12 px-4 sm:px-0">
                        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                        <h3 className="mt-2 text-xl font-medium text-gray-900 dark:text-gray-100">لا توجد أعمال إخراجية متاحة</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            لم يتم العثور على أفلام أو مسلسلات من إخراج {person.name} في الوقت الحالي.
                        </p>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error("Error fetching director details for page:", personId, error);
        notFound();
    }
} 