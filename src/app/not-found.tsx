import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export const metadata = {
  title: 'الصفحة غير موجودة | سينما العرب',
  description: 'عذراً، الصفحة التي تبحث عنها غير موجودة.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-muted/30 p-6 rounded-full mb-6">
        <FileQuestion className="w-16 h-16 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold mb-4">404 - الصفحة غير موجودة</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد تكون تم حذفها أو نقلها أو أن الرابط غير صحيح.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

