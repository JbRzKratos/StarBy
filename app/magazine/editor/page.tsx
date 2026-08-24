'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MagazineEditor } from '@/components/magazine/editor';

function EditorContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'tpl-vogue-editorial';

  return <MagazineEditor templateId={templateId} />;
}

export default function MagazineEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#0A0A0C] flex items-center justify-center text-[#F5F1EA] font-mono text-xs">
          Loading FREGORO Magazine Studio...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
