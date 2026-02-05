import { MetadataRoute } from 'next';

const baseUrl = 'https://metroflow.vercel.app';

export default function jsonLd(): MetadataRoute.JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MetroFlow',
    description:
      'Real-time departures, station search, and transit analytics for German public transport',
    url: baseUrl,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '250',
    },
    author: {
      '@type': 'Organization',
      name: 'MetroFlow',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MetroFlow',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };
}
