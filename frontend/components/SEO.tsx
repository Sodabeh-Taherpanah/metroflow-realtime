import { SITE_NAME, SITE_DESCRIPTION } from '@/core';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  url?: string;
}

export default function SEO({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  ogImage = '/og-image.png',
  url = 'https://metroflow.vercel.app',
}: SEOProps) {
  return (
    <>
      <meta name='description' content={description} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:type' content='website' />
      <meta property='og:image' content={ogImage} />
      <meta property='og:url' content={url} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={ogImage} />
    </>
  );
}
