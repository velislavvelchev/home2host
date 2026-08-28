import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage, type LegalDoc } from "@/components/LegalPage";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// Legal content is co-located here (locale-keyed) rather than in the next-intl
// message bundle: the bundle ships to the client on every page, and this long
// prose would bloat it site-wide. These pages are server-rendered + static, so
// the text never reaches other routes' client bundles.
//
// Company / controller data from the Bulgarian Commercial Register (Търговски
// регистър). This is a thorough GDPR/ЗЗЛД policy shaped like peer BG property-
// management sites — still worth an owner/legal review before relying on it,
// especially the retention statements and third-party list if the stack changes.

const CONTENT: Record<Locale, LegalDoc> = {
  bg: {
    title: "Политика за поверителност",
    updatedLabel: "Последна актуализация:",
    updated: "28 август 2026 г.",
    intro:
      "Настоящата Политика за поверителност обяснява как „ХОУМ ТУ ХОСТ“ ООД събира, използва, съхранява и защитава Вашите лични данни, когато посещавате уебсайта home2host.com или се свързвате с нас. Обработваме данните Ви в съответствие с Общия регламент относно защитата на данните (Регламент (ЕС) 2016/679, „GDPR“) и Закона за защита на личните данни.",
    sections: [
      {
        heading: "1. Администратор на лични данни",
        blocks: [
          {
            type: "controller",
            rows: [
              { label: "Наименование", value: "„ХОУМ ТУ ХОСТ“ ООД (HOME TO HOST)" },
              { label: "ЕИК", value: "208513462" },
              { label: "Правна форма", value: "Дружество с ограничена отговорност" },
              {
                label: "Седалище и адрес",
                value: "гр. Бургас 8000, бул. „Хан Аспарух“ № 70, ет. 1, ап. 2",
              },
              { label: "Телефон", value: "0885 146 191; 0885 777 342" },
              { label: "Имейл", value: "home2hosteu@gmail.com; info@home2host.com" },
              { label: "Уебсайт", value: "home2host.com" },
            ],
          },
          {
            type: "p",
            text: "За всички въпроси, свързани с обработването на личните Ви данни, можете да се свържете с нас на посочените по-горе координати.",
          },
        ],
      },
      {
        heading: "2. Какви лични данни събираме",
        blocks: [
          { type: "p", text: "Събираме само данните, които са необходими за целите, описани по-долу:" },
          {
            type: "list",
            items: [
              "Данни, които ни предоставяте доброволно — при попълване на формата за контакт: име, имейл адрес, телефонен номер (по желание) и съдържанието на съобщението Ви.",
              "Данни, събирани автоматично — при посещение на сайта чрез бисквитки и аналитични инструменти: IP адрес (в анонимизиран вид), тип устройство и браузър, операционна система, посетени страници, приблизително местоположение и източник на трафика. Тези данни се събират само след Вашето съгласие за аналитични бисквитки.",
            ],
          },
          {
            type: "p",
            text: "Не събираме специални категории лични данни (например данни за здраве, етнически произход и др.) и не обработваме съзнателно данни на лица под 16 години.",
          },
        ],
      },
      {
        heading: "3. Цели на обработване",
        blocks: [
          { type: "p", text: "Обработваме личните Ви данни за следните цели:" },
          {
            type: "list",
            items: [
              "Да отговорим на запитванията Ви и да комуникираме с Вас относно нашите услуги;",
              "Да предоставим и администрираме услугите по управление на имоти, за които проявявате интерес;",
              "Да анализираме и подобряваме работата на сайта (само при дадено съгласие за аналитични бисквитки);",
              "Да спазим законовите си задължения.",
            ],
          },
        ],
      },
      {
        heading: "4. Правно основание за обработване",
        blocks: [
          {
            type: "p",
            text: "Обработваме данните Ви на едно или повече от следните правни основания съгласно чл. 6 от GDPR:",
          },
          {
            type: "list",
            items: [
              "Вашето съгласие — например за използване на аналитични бисквитки;",
              "Изпълнение на договор или предприемане на стъпки по Ваше искане преди сключване на договор — при запитване за нашите услуги;",
              "Законово задължение — когато обработването е необходимо за спазване на приложимото законодателство;",
              "Легитимен интерес — за сигурността на сайта и защита срещу злоупотреби, доколкото това не накърнява Вашите права и свободи.",
            ],
          },
        ],
      },
      {
        heading: "5. Получатели и обработващи лични данни",
        blocks: [
          {
            type: "p",
            text: "За анализ на посещаемостта на сайта използваме Google Analytics — услуга на Google (Google Ireland Ltd / Google LLC), която може да обработва данни от наше име. Аналитичните бисквитки се зареждат само след Вашето съгласие.",
          },
          {
            type: "p",
            text: "Освен това ползваме доверени доставчици за хостинг и имейл услуги, които може да обработват данни от наше име въз основа на договор и при подходящи мерки за защита. Не продаваме и не отдаваме под наем Вашите лични данни на трети страни. Можем да разкрием данни на компетентни органи само когато това се изисква по закон.",
          },
        ],
      },
      {
        heading: "6. Предаване на данни извън ЕС/ЕИП",
        blocks: [
          {
            type: "p",
            text: "Google Analytics може да обработва данни извън Европейското икономическо пространство, включително в САЩ. В такива случаи предаването се извършва при подходящи гаранции съгласно GDPR — например стандартни договорни клаузи, одобрени от Европейската комисия.",
          },
        ],
      },
      {
        heading: "7. Срок на съхранение",
        blocks: [
          {
            type: "p",
            text: "Съхраняваме личните Ви данни само толкова дълго, колкото е необходимо за целите, за които са събрани:",
          },
          {
            type: "list",
            items: [
              "Съобщения от формата за контакт — за срока, необходим за обработване на запитването и поддържане на комуникацията с Вас;",
              "Аналитични данни — съгласно правилата за съхранение на Google Analytics;",
              "Данни, за които имаме законово задължение да съхраняваме — за срока, определен от закона.",
            ],
          },
        ],
      },
      {
        heading: "8. Сигурност на данните",
        blocks: [
          {
            type: "p",
            text: "Прилагаме подходящи технически и организационни мерки за защита на личните Ви данни срещу неоторизиран достъп, загуба или злоупотреба, включително криптирана връзка (HTTPS) и защита на инфраструктурата.",
          },
        ],
      },
      {
        heading: "9. Вашите права",
        blocks: [
          {
            type: "p",
            text: "Съгласно GDPR имате следните права по отношение на личните си данни:",
          },
          {
            type: "list",
            items: [
              "Право на достъп до Вашите данни;",
              "Право на коригиране на неточни или непълни данни;",
              "Право на изтриване („правото да бъдеш забравен“);",
              "Право на ограничаване на обработването;",
              "Право на преносимост на данните;",
              "Право на възражение срещу обработването;",
              "Право да оттеглите съгласието си по всяко време, без това да засяга законосъобразността на обработването преди оттеглянето.",
            ],
          },
          {
            type: "p",
            text: "За да упражните някое от тези права, свържете се с нас на home2hosteu@gmail.com. Ще отговорим в срока, предвиден в приложимото законодателство.",
          },
        ],
      },
      {
        heading: "10. Право на жалба до надзорния орган",
        blocks: [
          {
            type: "p",
            text: "Ако смятате, че обработваме данните Ви в нарушение на закона, имате право да подадете жалба до надзорния орган в Република България:",
          },
          {
            type: "controller",
            rows: [
              { label: "Орган", value: "Комисия за защита на личните данни (КЗЛД)" },
              { label: "Адрес", value: "гр. София 1592, бул. „Проф. Цветан Лазаров“ № 2" },
              { label: "Телефон", value: "02 915 3 518" },
              { label: "Имейл", value: "kzld@cpdp.bg" },
              { label: "Уебсайт", value: "www.cpdp.bg" },
            ],
          },
        ],
      },
      {
        heading: "11. Бисквитки",
        blocks: [
          {
            type: "pLink",
            before:
              "Този сайт използва бисквитки. Подробна информация за това какви бисквитки използваме и как да управлявате съгласието си ще намерите в нашата ",
            href: "/cookie-policy/",
            linkText: "Политика за бисквитки",
            after: ".",
          },
        ],
      },
      {
        heading: "12. Промени в политиката",
        blocks: [
          {
            type: "p",
            text: "Можем периодично да актуализираме тази политика. Актуалната версия е винаги достъпна на тази страница, а датата на последна актуализация е посочена в началото.",
          },
        ],
      },
      {
        heading: "13. Контакт",
        blocks: [
          {
            type: "p",
            text: "За въпроси относно тази Политика за поверителност или обработването на личните Ви данни, свържете се с нас на home2hosteu@gmail.com или info@home2host.com, или на телефон 0885 146 191.",
          },
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updatedLabel: "Last updated:",
    updated: "28 August 2026",
    intro:
      "This Privacy Policy explains how HOME TO HOST Ltd collects, uses, stores and protects your personal data when you visit the home2host.com website or contact us. We process your data in accordance with the General Data Protection Regulation (Regulation (EU) 2016/679, “GDPR”) and the Bulgarian Personal Data Protection Act.",
    sections: [
      {
        heading: "1. Data controller",
        blocks: [
          {
            type: "controller",
            rows: [
              { label: "Name", value: "HOME TO HOST Ltd („ХОУМ ТУ ХОСТ“ ООД)" },
              { label: "UIC (ЕИК)", value: "208513462" },
              { label: "Legal form", value: "Limited liability company" },
              {
                label: "Registered address",
                value: "70 Han Asparuh St, floor 1, apt. 2, Burgas 8000, Bulgaria",
              },
              { label: "Phone", value: "+359 885 146 191; +359 885 777 342" },
              { label: "Email", value: "home2hosteu@gmail.com; info@home2host.com" },
              { label: "Website", value: "home2host.com" },
            ],
          },
          {
            type: "p",
            text: "For any questions relating to the processing of your personal data, you can contact us using the details above.",
          },
        ],
      },
      {
        heading: "2. What personal data we collect",
        blocks: [
          { type: "p", text: "We collect only the data necessary for the purposes described below:" },
          {
            type: "list",
            items: [
              "Data you provide voluntarily — when you fill in the contact form: your name, email address, phone number (optional) and the content of your message.",
              "Data collected automatically — when you visit the site, through cookies and analytics tools: IP address (in anonymized form), device and browser type, operating system, pages visited, approximate location and traffic source. This data is collected only after you consent to analytics cookies.",
            ],
          },
          {
            type: "p",
            text: "We do not collect special categories of personal data (such as health or ethnic-origin data) and we do not knowingly process data of persons under 16.",
          },
        ],
      },
      {
        heading: "3. Purposes of processing",
        blocks: [
          { type: "p", text: "We process your personal data for the following purposes:" },
          {
            type: "list",
            items: [
              "To respond to your enquiries and communicate with you about our services;",
              "To provide and administer the property-management services you are interested in;",
              "To analyze and improve how the site works (only where you have consented to analytics cookies);",
              "To comply with our legal obligations.",
            ],
          },
        ],
      },
      {
        heading: "4. Legal basis for processing",
        blocks: [
          {
            type: "p",
            text: "We process your data on one or more of the following legal bases under Article 6 of the GDPR:",
          },
          {
            type: "list",
            items: [
              "Your consent — for example, for the use of analytics cookies;",
              "Performance of a contract, or taking steps at your request prior to entering into a contract — when you enquire about our services;",
              "Legal obligation — where processing is necessary to comply with applicable law;",
              "Legitimate interest — for the security of the site and protection against abuse, insofar as this does not override your rights and freedoms.",
            ],
          },
        ],
      },
      {
        heading: "5. Recipients and data processors",
        blocks: [
          {
            type: "p",
            text: "For site traffic analytics we use Google Analytics — a service provided by Google (Google Ireland Ltd / Google LLC), which may process data on our behalf. Analytics cookies load only after your consent.",
          },
          {
            type: "p",
            text: "We also use trusted providers for hosting and email services, which may process data on our behalf under a contract and with appropriate safeguards. We do not sell or rent your personal data to third parties. We may disclose data to competent authorities only where required by law.",
          },
        ],
      },
      {
        heading: "6. Transfers outside the EU/EEA",
        blocks: [
          {
            type: "p",
            text: "Google Analytics may process data outside the European Economic Area, including in the USA. In such cases, the transfer is carried out with appropriate safeguards under the GDPR — for example, standard contractual clauses approved by the European Commission.",
          },
        ],
      },
      {
        heading: "7. Retention period",
        blocks: [
          {
            type: "p",
            text: "We keep your personal data only for as long as necessary for the purposes for which it was collected:",
          },
          {
            type: "list",
            items: [
              "Contact-form messages — for as long as needed to handle your enquiry and maintain our communication with you;",
              "Analytics data — in accordance with Google Analytics' retention rules;",
              "Data we are legally required to keep — for the period set by law.",
            ],
          },
        ],
      },
      {
        heading: "8. Data security",
        blocks: [
          {
            type: "p",
            text: "We apply appropriate technical and organizational measures to protect your personal data against unauthorized access, loss or misuse, including an encrypted connection (HTTPS) and infrastructure protection.",
          },
        ],
      },
      {
        heading: "9. Your rights",
        blocks: [
          {
            type: "p",
            text: "Under the GDPR you have the following rights regarding your personal data:",
          },
          {
            type: "list",
            items: [
              "The right to access your data;",
              "The right to rectify inaccurate or incomplete data;",
              "The right to erasure (the “right to be forgotten”);",
              "The right to restrict processing;",
              "The right to data portability;",
              "The right to object to processing;",
              "The right to withdraw your consent at any time, without affecting the lawfulness of processing before the withdrawal.",
            ],
          },
          {
            type: "p",
            text: "To exercise any of these rights, contact us at home2hosteu@gmail.com. We will respond within the period provided by applicable law.",
          },
        ],
      },
      {
        heading: "10. Right to lodge a complaint",
        blocks: [
          {
            type: "p",
            text: "If you believe we are processing your data unlawfully, you have the right to lodge a complaint with the supervisory authority in the Republic of Bulgaria:",
          },
          {
            type: "controller",
            rows: [
              { label: "Authority", value: "Commission for Personal Data Protection (CPDP / КЗЛД)" },
              { label: "Address", value: "2 Prof. Tsvetan Lazarov Blvd, Sofia 1592, Bulgaria" },
              { label: "Phone", value: "+359 2 915 3 518" },
              { label: "Email", value: "kzld@cpdp.bg" },
              { label: "Website", value: "www.cpdp.bg" },
            ],
          },
        ],
      },
      {
        heading: "11. Cookies",
        blocks: [
          {
            type: "pLink",
            before:
              "This site uses cookies. Detailed information about which cookies we use and how to manage your consent is available in our ",
            href: "/cookie-policy/",
            linkText: "Cookie Policy",
            after: ".",
          },
        ],
      },
      {
        heading: "12. Changes to this policy",
        blocks: [
          {
            type: "p",
            text: "We may update this policy from time to time. The current version is always available on this page, and the date of the last update is shown at the top.",
          },
        ],
      },
      {
        heading: "13. Contact",
        blocks: [
          {
            type: "p",
            text: "For questions about this Privacy Policy or the processing of your personal data, contact us at home2hosteu@gmail.com or info@home2host.com, or by phone at +359 885 146 191.",
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
    ? "Политика за поверителност | Home2Host"
    : "Privacy Policy | Home2Host";
  const description = isBg
    ? "Как „ХОУМ ТУ ХОСТ“ ООД събира, използва и защитава личните Ви данни и какви права имате съгласно GDPR."
    : "How HOME TO HOST Ltd collects, uses and protects your personal data, and what rights you have under the GDPR.";
  const path = isBg ? "/privacy-policy/" : `/${locale}/privacy-policy/`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = CONTENT[locale as Locale] ?? CONTENT.bg;
  return <LegalPage doc={doc} />;
}
