import { SITE_NAME, SITE_URL } from "@/lib/store";

/** All 36 states plus the FCT — used for structured-data areaServed. */
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

/** Largest cities by population/search volume — used in copy and keywords. */
export const MAJOR_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Benin City", "Enugu",
  "Kaduna", "Onitsha", "Owerri", "Uyo", "Calabar", "Warri", "Abeokuta", "Jos", "Ilorin",
] as const;

const PRODUCT_TERMS = [
  "perfume", "oud perfume", "oil perfume", "perfume oil", "body mist", "body spray",
  "fragrance", "men's perfume", "women's perfume", "unisex perfume", "luxury perfume",
  "affordable perfume", "perfume gift set",
];

export const KEYWORDS = [
  SITE_NAME,
  "Pechies Scents",
  ...PRODUCT_TERMS.map((t) => `${t} Nigeria`),
  "buy perfume online Nigeria",
  "perfume store Nigeria",
  "order perfume on WhatsApp",
  "nationwide perfume delivery Nigeria",
  ...MAJOR_CITIES.slice(0, 8).map((c) => `perfume in ${c}`),
];

export const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  logo: `${SITE_URL}/icon`,
  description:
    "Oud perfumes, oil perfumes, body mists and body sprays with nationwide delivery across Nigeria.",
  currenciesAccepted: "NGN",
  address: { "@type": "PostalAddress", addressCountry: "NG" },
  areaServed: [
    { "@type": "Country", name: "Nigeria" },
    ...NIGERIAN_STATES.map((name) => ({ "@type": "State", name })),
    ...MAJOR_CITIES.map((name) => ({ "@type": "City", name })),
  ],
  ...(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    ? {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}`,
          areaServed: "NG",
        },
      }
    : {}),
};
