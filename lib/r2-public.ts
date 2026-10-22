/**
 * Browser-safe Cloudflare R2 URL helpers.
 *
 * Keep this module free of the AWS SDK/server credentials. Client components
 * import from here so the R2 SDK is never pulled into a browser bundle.
 */

export function getR2PublicUrl(objectKey: string): string {
  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    (process.env.R2_ACCOUNT_ID
      ? `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`
      : 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev');
  const cleanKey = objectKey.replace(/^\/+/, '');
  return `${base}/${cleanKey}`;
}

export function getR2AssetUrl(assetPath: string): string {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev';
  const cleanPath = assetPath.replace(/^\/+/, '');
  return `${base.replace(/\/+$/, '')}/${cleanPath}`;
}
