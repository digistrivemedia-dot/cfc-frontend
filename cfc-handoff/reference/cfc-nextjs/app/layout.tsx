import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://cityfamilycare.in'),
  title: 'CityFamilyCare — book a verified pro for anything your home needs',
  description:
    'Cleaning, plumbing, electrical, appliances and 40 more home services. Fixed prices, background-checked professionals and a 30-day warranty on every job.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'CityFamilyCare',
    title: 'Book a verified pro for anything your home needs',
    description:
      'Fixed prices before you book, background-checked professionals and a 30-day warranty on every job. Live in 11 cities across South India.',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
};

const schema = "{\n  \"@context\": \"https://schema.org\",\n  \"@graph\": [\n    {\n      \"@type\": \"Organization\",\n      \"@id\": \"https://cityfamilycare.in/#org\",\n      \"name\": \"CityFamilyCare\",\n      \"alternateName\": \"CFC\",\n      \"url\": \"https://cityfamilycare.in/\",\n      \"description\": \"At-home services across South India: cleaning, plumbing, electrical, appliance repair, pest control and salon, delivered by verified professionals at fixed prices.\",\n      \"areaServed\": [\n        \"Bengaluru\", \"Chennai\", \"Hyderabad\", \"Coimbatore\", \"Madurai\",\n        \"Kochi\", \"Mysuru\", \"Trichy\", \"Salem\", \"Vijayawada\", \"Mangaluru\"\n      ],\n      \"contactPoint\": {\n        \"@type\": \"ContactPoint\",\n        \"telephone\": \"+91-1800-000-4567\",\n        \"contactType\": \"customer support\",\n        \"availableLanguage\": [\"English\", \"Tamil\", \"Kannada\", \"Telugu\", \"Hindi\"]\n      }\n    },\n    {\n      \"@type\": \"WebSite\",\n      \"@id\": \"https://cityfamilycare.in/#site\",\n      \"url\": \"https://cityfamilycare.in/\",\n      \"name\": \"CityFamilyCare\",\n      \"publisher\": { \"@id\": \"https://cityfamilycare.in/#org\" },\n      \"potentialAction\": {\n        \"@type\": \"SearchAction\",\n        \"target\": {\n          \"@type\": \"EntryPoint\",\n          \"urlTemplate\": \"https://cityfamilycare.in/search?q={search_term_string}\"\n        },\n        \"query-input\": \"required name=search_term_string\"\n      }\n    },\n    {\n      \"@type\": \"FAQPage\",\n      \"mainEntity\": [\n        {\n          \"@type\": \"Question\",\n          \"name\": \"How do you check the people you send to my home?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Every professional goes through Aadhaar verification, a police background check and an in-person skill test before their first CFC job. You get their name, photo and rating in the app before they arrive, and they carry a CFC ID card in uniform.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Is the price on the app the final price?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Yes, for the work you booked. There is no visiting charge and no separate labour fee. Spare parts are charged at MRP with the bill shown to you before fitting, and any extra work is approved by you in the app before it starts.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"What if the problem comes back after a few days?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Every job carries a 30-day warranty. If the same issue returns within a month, message support and we send a professional again at no cost.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Can I reschedule or cancel a CFC booking?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Reschedule free up to two hours before your slot. Cancelling more than two hours ahead is free; inside two hours there is a small fee because a professional has already blocked the slot.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"What happens if something is damaged during the job?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Every booking is insured up to 10,000 rupees. Report it within 48 hours with a photo and CFC repairs or replaces the item directly.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"Do you work on Sundays and holidays?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Yes, seven days a week from 7 AM to 9 PM including most public holidays, at the same price as a weekday.\"\n          }\n        }\n      ]\n    }\n  ]\n}";

export const viewport: Viewport = {
  themeColor: '#0fb3a6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schema }}
        />
        {children}
      </body>
    </html>
  );
}
