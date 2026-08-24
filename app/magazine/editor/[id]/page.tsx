'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MagazineEditor } from '@/components/magazine/editor';
import type { MagazineDocument } from '@/types/magazine';

export default function MagazineEditorByIdPage() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<MagazineDocument | null>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem(`fregoro_mag_${id}`);
      if (saved) {
        setDoc(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [id]);

  return <MagazineEditor initialDocument={doc || undefined} templateId="tpl-vogue-editorial" />;
}
