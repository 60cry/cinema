import {
    getPersonDetails,
    getPersonCombinedCredits,
    getImageUrl,
    POSTER_SIZE,
    // Movie, // Unused
    // TvShow, // Unused
    PersonMovieCredit,
    PersonTvCredit,
    PersonMovieCrewCredit,
    PersonTvCrewCredit,
    PersonCombinedCredits,
    // slugify // Import slugify - Error: Not exported from tmdb
} from "@/lib/tmdb";
import { slugify } from "@/lib/utils";
import { notFound } from 'next/navigation';
import type { Metadata/*, ResolvingMetadata*/ } from 'next'; // Comment out unused ResolvingMetadata
import Image from 'next/image';

import { PersonTimeline, YearCredits, CategorizedCredits } from "@/components/people/PersonTimeline";
import { UserCircle } from "lucide-react";
import { AlertTriangle } from 'lucide-react'; // Import an icon
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs"; // Corrected Import Breadcrumbs component

type PageProps = {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// --- Helper Functions ---
function extractIdFromSlug(slug: string): number | null {
    const match = slug.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

// --- Metadata Generation ---
export async function generateMetadata(
  { params: paramsPromise }: PageProps,
  // parent: ResolvingMetadata // Unused
): Promise<Metadata> {
  const params = await paramsPromise;
  const slug = params.slug;
  const personId = extractIdFromSlug(params.slug);
  if (!personId) {
    return { title: 'Person Not Found' };
  }

  try {
    const person = await getPersonDetails(personId);

    const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
    const pageUrl = `${siteUrl}/person/${slug}`;
    const profileImageUrl = person.profile_path ? getImageUrl(person.profile_path, 'w500') : undefined; // Higher res for social

    const jobTitle = person.known_for_department === 'Acting' ? (person.gender === 1 ? 'ممثلة' : 'ممثل') 
                   : person.known_for_department === 'Directing' ? 'مخرج' 
                   : person.known_for_department; // Fallback

    // Create dynamic OG image URL
    const ogImageUrl = new URL(`${siteUrl}/api/og`);
    ogImageUrl.searchParams.append('title', person.name);
    ogImageUrl.searchParams.append('description', person.biography?.substring(0, 100) || jobTitle || 'Artist');
    ogImageUrl.searchParams.append('type', 'person'); // Type for OG image generation
    if (profileImageUrl) {
      ogImageUrl.searchParams.append('image', profileImageUrl);
    }
    // Fallback handled by /api/og

    const metadata: Metadata = {
      title: `${person.name} - ${jobTitle || 'فنان'} | السيرة الذاتية والأعمال`,
      description: `تعرف على السيرة الذاتية لـ ${jobTitle || 'الفنان'} ${person.name} وأهم أعماله الفنية من أفلام ومسلسلات. ${person.biography?.substring(0, 120) || ''}`,
      keywords: [person.name, jobTitle, 'السيرة الذاتية', 'أعمال', 'أفلام', 'مسلسلات', person.known_for_department].filter(Boolean) as string[],
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: `${person.name} (${jobTitle || 'Artist'}) | ${process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب'}`,
        description: `السيرة الذاتية لـ ${jobTitle || 'الفنان'} ${person.name}. ${person.biography?.substring(0, 100) || ''}`,
        url: pageUrl,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب',
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: person.name,
          }
        ],
        type: 'profile',
        locale: 'ar_SA',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${person.name} (${jobTitle || 'Artist'}) | ${process.env.NEXT_PUBLIC_SITE_NAME || 'سينما العرب'}`,
        description: `السيرة الذاتية لـ ${jobTitle || 'الفنان'} ${person.name}. ${person.biography?.substring(0, 100) || ''}`,
        images: [ogImageUrl.toString()],
      },
    };

    return metadata;

  } catch (error) {
    console.error("Error fetching metadata for person:", personId, error);
    const initialParams = await paramsPromise;
    const slugForError = initialParams.slug;
    const pageUrl = `${process.env.CANONICAL_URL || 'https://cinema4arab.online'}/person/${slugForError}`;
    return { 
      title: 'خطأ في تحميل بيانات الشخص', 
      description: 'لم نتمكن من تحميل بيانات هذا الشخص. الرجاء المحاولة مرة أخرى.', 
      alternates: { canonical: pageUrl },
    };
  }
}

export const revalidate = 3600; // 1 hour in seconds
export const runtime = 'edge';

// --- Page Component ---
export default async function PersonDetailPage({ params: paramsPromise }: PageProps) {
    const params = await paramsPromise;
    const personId = extractIdFromSlug(params.slug);
    if (!personId) {
        notFound(); 
    }

    try {
        const [person, credits] = await Promise.all([
            getPersonDetails(personId),
            getPersonCombinedCredits(personId)
        ]);

        const siteUrl = process.env.CANONICAL_URL || 'https://cinema4arab.online';
        const pageUrl = `${siteUrl}/person/${params.slug}`;
        const profileImageUrl = getImageUrl(person.profile_path, POSTER_SIZE);

        const personGender = person.gender === 1 ? 'الممثلة' : (person.gender === 2 ? 'الممثل' : 'الشخصية');
        const jobTitle = person.known_for_department === 'Acting' ? (person.gender === 1 ? 'ممثلة' : 'ممثل') 
                       : person.known_for_department === 'Directing' ? 'مخرج' 
                       : person.known_for_department;
        const seoText = `تعرف على السيرة الذاتية وأهم أعمال ${personGender} ${person.name} من أفلام ومسلسلات.`;

        const displayBreadcrumbItems: BreadcrumbItem[] = [
            { label: "الرئيسية", href: "/" },
            { label: person.name, href: `/person/${params.slug}`, isCurrent: true }, 
        ];

        const knownForWorks = credits.cast
          .filter(work => work.vote_count && work.vote_count > 100)
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          .slice(0, 5)
          .map(work => {
            const workName = (work as PersonMovieCredit).title || (work as PersonTvCredit).name;
            const workType = work.media_type === 'movie' ? 'Movie' : 'TVSeries';
            const workUrl = work.media_type === 'movie' 
                ? `${siteUrl}/movies/${slugify(workName || '')}-${work.id}` 
                : `${siteUrl}/tv/${slugify(workName || '')}-${work.id}`;
            return {
              '@type': workType,
              name: workName,
              url: workUrl,
            };
          });

        const personJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': `${pageUrl}#person`,
          name: person.name,
          description: person.biography || `السيرة الذاتية وأعمال ${jobTitle || 'الفنان'} ${person.name}.`,
          url: pageUrl,
          image: profileImageUrl,
          birthDate: person.birthday,
          deathDate: person.deathday, 
          birthPlace: person.place_of_birth ? { '@type': 'Place', name: person.place_of_birth } : undefined,
          gender: person.gender === 1 ? 'https://schema.org/Female' : (person.gender === 2 ? 'https://schema.org/Male' : undefined),
          jobTitle: jobTitle || person.known_for_department,
          knownForDepartment: person.known_for_department,
          ...(knownForWorks.length > 0 && { knownFor: knownForWorks }),
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

        type Credit = PersonMovieCredit | PersonTvCredit | PersonMovieCrewCredit | PersonTvCrewCredit;

        const birthYear = person.birthday ? new Date(person.birthday).getFullYear() : null;

        function processCredits(credits: PersonCombinedCredits): YearCredits {
            const yearCredits: YearCredits = {};

            const addToYear = (item: Credit, category: keyof CategorizedCredits) => {
                const yearString = (item as PersonMovieCredit).release_date?.substring(0, 4) || (item as PersonTvCredit).first_air_date?.substring(0, 4);
                if (!yearString) return;

                const workYear = parseInt(yearString, 10);
                if (birthYear && workYear < birthYear) {
                    return;
                }

                if (!yearCredits[yearString]) {
                    yearCredits[yearString] = { acting: [], directing: [], writing: [], production: [] };
                }
                yearCredits[yearString][category].push(item);
            };

            credits.cast.forEach(item => addToYear(item, 'acting'));

            if (credits.crew) {
                credits.crew.forEach(item => {
                    if (item.department === 'Directing') {
                        addToYear(item, 'directing');
                    } else if (item.department === 'Writing') {
                        addToYear(item, 'writing');
                    } else if (item.department === 'Production') {
                        addToYear(item, 'production');
                    }
                });
            }

            return yearCredits;
        }

        const timelineCredits = processCredits(credits);

        return (
            <div className="container mx-auto px-0 sm:px-4 py-8">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
                />
                {/* Breadcrumbs Display */}
                <div className="mb-4 px-4 sm:px-0">
                     <Breadcrumbs items={displayBreadcrumbItems} />
                </div>

                {/* Person Header */}
                <div className="mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8">
                    <div className="flex-shrink-0 w-48 h-72 md:w-60 md:h-90 relative bg-muted rounded-lg overflow-hidden shadow-md">
                        {profileImageUrl ? (
                            <Image 
                                src={profileImageUrl}
                                alt={`Photo of ${person.name}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 640px) 192px, 240px"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <UserCircle className="w-20 h-20"/>
                            </div>
                        )}
                    </div>
                    <div className="flex-grow text-center sm:text-right">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{person.name}</h1>
                        {person.known_for_department && (
                             <p className="text-muted-foreground mb-1">Known For: {person.known_for_department}</p>
                        )}
                        {person.birthday && (
                            <p className="text-muted-foreground mb-1">Born: {person.birthday}{person.place_of_birth ? ` in ${person.place_of_birth}` : ''}</p>
                        )}
                        {person.deathday && (
                             <p className="text-muted-foreground mb-1">Died: {person.deathday}</p>
                        )}
                        {person.biography && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-1">Biography</h3>
                                <p className="text-sm leading-relaxed max-h-48 overflow-y-auto"> {/* Limit height and allow scroll */}
                                    {person.biography}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dynamic SEO Text Block */}
                <p className="text-lg text-primary font-semibold mb-8 text-center sm:text-right">
                    {seoText}
                </p>

                <PersonTimeline credits={timelineCredits} />
            </div>
        );
    } catch (error) {
        console.error("Error fetching person details for page:", personId, error);
        // Instead of notFound(), return an error message component
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="my-8 border border-red-300 bg-red-50 text-red-800 rounded-lg p-4 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div>
                        حدث خطأ أثناء تحميل بيانات الشخص. قد تكون المشكلة مؤقتة، الرجاء المحاولة مرة أخرى لاحقاً.
                    </div>
                </div>
            </div>
        );
        // notFound(); // We handle the error case above now
    }
} 