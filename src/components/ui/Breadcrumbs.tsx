import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react'; // Using ChevronLeft for RTL breadcrumbs

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean; // To style the current page differently
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@id': item.href,
        'name': item.label
      }
    }))
  };

  return (
    <nav aria-label="Breadcrumb" className={`mb-6 ${className || ''}`} dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href || item.label} className="flex items-center">
            {index > 0 && (
              <ChevronLeftIcon className="h-4 w-4 mx-1 text-gray-400" />
            )}
            {item.isCurrent ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-primary hover:underline">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 