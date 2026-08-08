import { LOCALES, type Locale } from '@peace/shared';
import { SITE_URL, url } from '@/lib/site';

interface Props {
  locale: Locale;
  name: string;
  tagline: string;
  foundation: string;
}

/**
 * Structured data, so a search engine understands what this is rather than
 * guessing — and *only* what is true today.
 *
 * An earlier version of this file declared `@type: "NGO"` with
 * `nonprofitStatus: "NonprofitANBI"`. Both were wrong. ANBI is a Dutch tax
 * designation that nobody here has applied for, and §14.2 of the specification
 * lists the legal entity and jurisdiction as an open question — undecided. A
 * platform whose whole worth is that it can be trusted must not publish a legal
 * status it does not hold, least of all in a format built for machines to
 * believe without checking.
 *
 * `Organization` claims no registration and no charitable status: it says only
 * that some people publish this site together. When the Foundation is actually
 * registered, this can become `NGO` and gain `legalName`, `taxID` and
 * `foundingDate` — once there are real values to put in them.
 *
 * Also absent, and deliberately: `location`, `areaServed` and `memberOf`. Each
 * would be a claim about where this belongs and whose side it is on (§3.1). A
 * platform whose premise is that the whole world is one country should not tell
 * a crawler which part of it this serves.
 */
export function FoundationSchema({ locale, name, tagline, foundation }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: foundation,
        alternateName: name,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: tagline,
        knowsLanguage: [...LOCALES],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: url(locale),
        name,
        description: tagline,
        inLanguage: locale,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Serialised by us from our own translations, never from user content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}
