/**
 * Upload a browser-generated magazine print PDF.
 *
 * Print-ready magazines are frequently larger than Vercel's 4.5 MB request
 * body limit, so the fast path asks the server for a presigned R2 PUT. Small
 * files fall back to the multipart proxy if direct R2 access is blocked by
 * CORS or an ad blocker.
 */
export async function uploadMagazinePrintPdf(
  pdfBlob: Blob,
  filename: string,
): Promise<string | null> {
  const fileName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    const presignRes = await fetch('/api/magazine/upload-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileType: 'application/pdf',
        fileSize: pdfBlob.size,
      }),
    });

    if (presignRes.ok) {
      const presign = await presignRes.json();
      if (presign.success && presign.uploadUrl && presign.publicUrl) {
        const putRes = await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: pdfBlob,
        });
        if (putRes.ok) return presign.publicUrl as string;
      }
    }
  } catch (error) {
    console.warn('Presigned magazine PDF upload failed:', error);
  }

  if (pdfBlob.size <= 4 * 1024 * 1024) {
    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      const proxyRes = await fetch('/api/magazine/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      if (proxyRes.ok) {
        const proxy = await proxyRes.json();
        if (proxy.success && proxy.publicUrl) return proxy.publicUrl as string;
      }
    } catch (error) {
      console.warn('Proxy magazine PDF upload failed:', error);
    }
  }

  return null;
}
