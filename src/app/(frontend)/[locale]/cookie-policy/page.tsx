import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage, type LegalDoc } from "@/components/LegalPage";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// See the note in privacy-policy/page.tsx on why this prose is co-located here
// rather than in the next-intl bundle. Thorough BG/EN cookie policy shaped like
// peer property-management sites — DRAFT for owner/legal review; keep the cookie
// table in sync with what the site actually sets.

const CONTENT: Record<Locale, LegalDoc> = {
  bg: {
    title: "Политика за бисквитки",
    updatedLabel: "Последна актуализация:",
    updated: "28 август 2026 г.",
    intro:
      "Тази Политика за бисквитки обяснява какво представляват бисквитките, какви бисквитки използва уебсайтът home2host.com, с каква цел и как можете да управлявате съгласието си. Политиката е част от нашата Политика за поверителност.",
    sections: [
      {
        heading: "1. Какво представляват бисквитките",
        blocks: [
          {
            type: "p",
            text: "Бисквитките са малки текстови файлове, които се запазват в браузъра или устройството Ви, когато посещавате уебсайт. Те позволяват на сайта да запомни Вашите действия и предпочитания (например избраната тема) за определен период, както и да събира анонимна статистика за използването на сайта.",
          },
        ],
      },
      {
        heading: "2. Защо използваме бисквитки",
        blocks: [
          { type: "p", text: "Използваме бисквитки, за да:" },
          {
            type: "list",
            items: [
              "осигурим правилното функциониране на сайта и да запомним предпочитанията Ви;",
              "анализираме как посетителите използват сайта, за да го подобряваме (само при Ваше съгласие).",
            ],
          },
        ],
      },
      {
        heading: "3. Какви бисквитки използваме",
        blocks: [
          {
            type: "p",
            text: "По-долу са изброени бисквитките, които използваме, разделени по категория:",
          },
          {
            type: "cookieTable",
            headers: ["Бисквитка", "Доставчик", "Цел", "Срок", "Категория"],
            rows: [
              [
                "theme",
                "Home2Host",
                "Запомня избраната светла или тъмна тема.",
                "1 година",
                "Функционална (не изисква съгласие)",
              ],
              [
                "cookie-consent",
                "Home2Host",
                "Запаметява избора Ви дали приемате аналитични бисквитки.",
                "1 година",
                "Необходима (не изисква съгласие)",
              ],
              [
                "_ga, _ga_*",
                "Google Analytics",
                "Различава посетителите и измерва посещаемостта на сайта.",
                "до 2 години",
                "Аналитична (изисква съгласие)",
              ],
            ],
          },
        ],
      },
      {
        heading: "4. Google Analytics",
        blocks: [
          {
            type: "pLink",
            before:
              "За анализ на посещаемостта използваме Google Analytics — услуга на Google. Тя поставя бисквитки, които събират анонимизирана информация за начина, по който използвате сайта, и се зареждат само след като дадете съгласие. Повече за начина, по който Google обработва данни, можете да намерите в ",
            href: "https://policies.google.com/privacy",
            linkText: "политиката за поверителност на Google",
            after: ".",
            external: true,
          },
        ],
      },
      {
        heading: "5. Правно основание и съгласие",
        blocks: [
          {
            type: "p",
            text: "Необходимите и функционалните бисквитки осигуряват правилното функциониране на сайта и не изискват съгласие. Аналитичните бисквитки се използват само въз основа на Вашето изрично съгласие, което давате чрез банера за бисквитки при първото си посещение.",
          },
        ],
      },
      {
        heading: "6. Как да управлявате бисквитките",
        blocks: [
          { type: "p", text: "Можете да управлявате съгласието си за бисквитки по няколко начина:" },
          {
            type: "list",
            items: [
              "Чрез банера за бисквитки — при първото посещение можете да приемете или откажете аналитичните бисквитки;",
              "Чрез връзката „Управление на бисквитки“ в долната част на сайта — по всяко време можете да промените избора си;",
              "Чрез настройките на браузъра си — можете да изтриете или блокирате бисквитките. Имайте предвид, че блокирането на някои бисквитки може да повлияе на функционалността на сайта.",
            ],
          },
        ],
      },
      {
        heading: "7. Промени в политиката",
        blocks: [
          {
            type: "p",
            text: "Можем периодично да актуализираме тази Политика за бисквитки. Актуалната версия е винаги достъпна на тази страница, а датата на последна актуализация е посочена в началото.",
          },
        ],
      },
      {
        heading: "8. Контакт",
        blocks: [
          {
            type: "pLink",
            before:
              "За въпроси относно използването на бисквитки или обработването на личните Ви данни вижте нашата ",
            href: "/privacy-policy/",
            linkText: "Политика за поверителност",
            after: " или се свържете с нас на home2hosteu@gmail.com.",
          },
        ],
      },
    ],
  },
  en: {
    title: "Cookie Policy",
    updatedLabel: "Last updated:",
    updated: "28 August 2026",
    intro:
      "This Cookie Policy explains what cookies are, which cookies the home2host.com website uses, for what purpose, and how you can manage your consent. This policy forms part of our Privacy Policy.",
    sections: [
      {
        heading: "1. What are cookies",
        blocks: [
          {
            type: "p",
            text: "Cookies are small text files stored in your browser or device when you visit a website. They let the site remember your actions and preferences (such as your chosen theme) for a period of time, and collect anonymous statistics about how the site is used.",
          },
        ],
      },
      {
        heading: "2. Why we use cookies",
        blocks: [
          { type: "p", text: "We use cookies to:" },
          {
            type: "list",
            items: [
              "ensure the site works correctly and remember your preferences;",
              "analyze how visitors use the site so we can improve it (only with your consent).",
            ],
          },
        ],
      },
      {
        heading: "3. Cookies we use",
        blocks: [
          {
            type: "p",
            text: "The cookies we use are listed below, grouped by category:",
          },
          {
            type: "cookieTable",
            headers: ["Cookie", "Provider", "Purpose", "Duration", "Category"],
            rows: [
              [
                "theme",
                "Home2Host",
                "Remembers your chosen light or dark theme.",
                "1 year",
                "Functional (no consent required)",
              ],
              [
                "cookie-consent",
                "Home2Host",
                "Stores your choice of whether to accept analytics cookies.",
                "1 year",
                "Necessary (no consent required)",
              ],
              [
                "_ga, _ga_*",
                "Google Analytics",
                "Distinguishes visitors and measures site traffic.",
                "up to 2 years",
                "Analytics (consent required)",
              ],
            ],
          },
        ],
      },
      {
        heading: "4. Google Analytics",
        blocks: [
          {
            type: "pLink",
            before:
              "For traffic analytics we use Google Analytics, a service provided by Google. It sets cookies that collect anonymized information about how you use the site, and they load only after you give consent. You can find more about how Google processes data in the ",
            href: "https://policies.google.com/privacy",
            linkText: "Google Privacy Policy",
            after: ".",
            external: true,
          },
        ],
      },
      {
        heading: "5. Legal basis and consent",
        blocks: [
          {
            type: "p",
            text: "Necessary and functional cookies ensure the site works correctly and do not require consent. Analytics cookies are used only on the basis of your explicit consent, which you give through the cookie banner on your first visit.",
          },
        ],
      },
      {
        heading: "6. How to manage cookies",
        blocks: [
          { type: "p", text: "You can manage your cookie consent in several ways:" },
          {
            type: "list",
            items: [
              "Through the cookie banner — on your first visit you can accept or reject analytics cookies;",
              "Through the “Manage cookies” link at the bottom of the site — you can change your choice at any time;",
              "Through your browser settings — you can delete or block cookies. Note that blocking some cookies may affect how the site works.",
            ],
          },
        ],
      },
      {
        heading: "7. Changes to this policy",
        blocks: [
          {
            type: "p",
            text: "We may update this Cookie Policy from time to time. The current version is always available on this page, and the date of the last update is shown at the top.",
          },
        ],
      },
      {
        heading: "8. Contact",
        blocks: [
          {
            type: "pLink",
            before:
              "For questions about the use of cookies or the processing of your personal data, see our ",
            href: "/privacy-policy/",
            linkText: "Privacy Policy",
            after: " or contact us at home2hosteu@gmail.com.",
          },
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isBg = locale === "bg";
  const title = isBg
    ? "Политика за бисквитки | Home2Host"
    : "Cookie Policy | Home2Host";
  const description = isBg
    ? "Какви бисквитки използва home2host.com, с каква цел и как да управлявате съгласието си."
    : "Which cookies home2host.com uses, for what purpose, and how to manage your consent.";
  const path = isBg ? "/cookie-policy/" : `/${locale}/cookie-policy/`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description },
  };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = CONTENT[locale as Locale] ?? CONTENT.bg;
  return <LegalPage doc={doc} />;
}
