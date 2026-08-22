'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Person, getImageUrl } from '@/lib/tmdb';
import { slugify } from '@/lib/utils';
import { UserCircle } from 'lucide-react';

interface PersonCardProps {
    person: Person;
    className?: string;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, className }) => {
    const imageUrl = getImageUrl(person.profile_path, 'w185'); // Use a smaller size for cards
    const personSlug = slugify(person.name);
    const personUrl = `/person/${personSlug}-${person.id}`;

    return (
        <div className={`overflow-hidden flex flex-col rounded-xl shadow border bg-white dark:bg-gray-900 ${className || ''}`}>
            <Link href={personUrl} className="aspect-[2/3] relative block bg-muted">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={person.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                        className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <UserCircle className="w-12 h-12" />
                    </div>
                )}
            </Link>
            <div className="p-3 flex-grow flex flex-col items-start justify-end">
                 <Link href={personUrl} className="hover:underline">
                     <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                         {person.name}
                     </h3>
                 </Link>
                 {/* Optionally add known_for_department */}
                 {person.known_for_department && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {person.known_for_department}
                    </p>
                 )}
            </div>
        </div>
    );
}; 