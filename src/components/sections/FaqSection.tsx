import { ChevronDown } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";

// Reusable across the home page (embedded after Prices) and the standalone
// /questions/ route. `headingLevel` swaps h1/h2 so the document outline
// stays correct in both contexts — same contract as the other sections.
//
// Implementation: native <details>/<summary> as the accordion primitive.
// Zero JS, full keyboard a11y, server-rendered. Chevron rotation is the
// only animation — native <details> height transition still has patchy
// browser support (`interpolate-size: allow-keywords` not in FF/Safari
// yet), so we accept instant open/close and let the chevron carry the
// visual feedback. Modern minimal.
//
// Content sourced from docs/inventory/text/questions.md. Last answer's
// "BnB Manager" typo (a copy-paste leftover on the live site) is corrected
// to "Home2Host" — flagged in content-inventory-findings memory.

type FaqSectionProps = {
  headingLevel?: "h1" | "h2";
};

type QA = {
  question: string;
  answer: string;
};

const questions: QA[] = [
  {
    question: "Кои апартаменти са подходящи за краткосрочни наеми?",
    answer:
      "Най-добре се отдават имоти в центъра или в близост до ключови забележителности, които привличат туристи. Апартаменти със свеж ремонт и модерна декорация изпъкват пред конкуренцията, без да е нужно скъпо обзавеждане. Важно е имотът да е функционален, безопасен и поддържан, тъй като комфортът на гостите е ключът към високи приходи.",
  },
  {
    question: "Какви са регулациите и данъците?",
    answer:
      "Всеки имот за краткосрочен наем трябва да бъде регистриран в общината като място за настаняване клас В и вписан в Единната система за туристическа информация (ЕСТИ). Собствениците са длъжни да подават данни за туристите и да плащат туристически данък, а в някои случаи и патентен или ДДС. Така се гарантира, че дейността е напълно законна и прозрачна.",
  },
  {
    question:
      "Може ли Home2Host да ми помогне да определя най-добрата цена за моята обява?",
    answer:
      "Ще направим конкурентно проучване на пазара и ще определим каква е най-добрата цена за вашата обява в Airbnb и Booking. Вярваме в динамичното ценообразуване и работим с алгоритми и инструменти, създадени от експерти, с които се изчислява оптималната цена за даден период, взимайки предвид всички фактори.",
  },
  {
    question:
      "Могат ли съседите да ми забранят да отдавам апартамента си краткосрочно?",
    answer:
      "Не, съседите не могат да ви забранят да отдавате апартамента си краткосрочно. Регистрацията на имота като място за настаняване клас B, съгласно Закона за туризма, не изисква съгласие от съседите. Въпреки това, общото събрание на етажната собственост има право да определи входна такса, която може да бъде от 3 до 5 пъти по-висока за апартамент, отдаван краткосрочно и регистриран за тази дейност.",
  },
  {
    question: "Как се изчислява комисионната на Home2Host?",
    answer:
      "Комисионната за управление от Home2Host е 25% от нетния приход, който сте получили от платформата, след като се приспадне таксата за почистване. Тя се изчислява след приспадане на комисионната на съответната платформа — Airbnb, Booking.com или друга. Това означава, че плащате комисионната единствено върху реално постъпилите средства, като осигуряваме максимална прозрачност и яснота в изчисленията.",
  },
  {
    question: "Какви разходи има по време на отдаването?",
    answer:
      "Разходите за собственика по време на отдаването включват всички битови сметки като ток, вода и интернет, както и входните такси съгласно ЗУЕС. Освен това собственикът е отговорен за плащането на всички данъци, свързани с отдаването под наем — туристически данък, патентен данък и други, както и данъците, възникващи вследствие на получаването на доход.",
  },
  {
    question: "Ще има ли щети по имота ми?",
    answer:
      // "BnB Manager" in the live site copy is a leftover from another
      // template — corrected to "Home2Host" here.
      "Щети и амортизация могат да възникнат при всякакъв вид отдаване. При краткосрочно отдаване те се отстраняват незабавно, за да бъде имотът готов за следващите гости. Home2Host осигурява професионално и своевременно отстраняване на щетите и съдействие за обезщетение чрез Aircover застраховката на Airbnb, ако е приложимо.",
  },
];

export function FaqSection({ headingLevel = "h2" }: FaqSectionProps) {
  const Heading = headingLevel;

  return (
    <section
      id="questions"
      aria-labelledby="questions-heading"
      className="bg-brand-800"
    >
      {/*
        All text colors below are locked (no dark: variants) because the
        section bg is locked to brand-800 in both light AND dark mode. The
        foreground / foreground-muted tokens swap by OS preference and would
        either be invisible (light mode: foreground = dark) or wrong-tone
        against the indigo bg, so we use explicit on-dark colors throughout.
      */}
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900">
          <span className="size-1.5 rounded-full bg-brand-700" />
          Въпроси
        </span>

        <Heading
          id="questions-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          Често задавани въпроси
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-brand-100">
          Отговорите на най-честите въпроси, които получаваме от собственици
          на имоти. Не намирате своя? Свържете се с нас.
        </p>

        <ul className="mt-12 max-w-3xl divide-y divide-white/15">
          {questions.map((qa, index) => (
            <RevealOnScroll key={qa.question} delayIndex={index}>
              <li>
                <details className="group py-5">
                  {/*
                    Hide the native disclosure marker (the default triangle)
                    in both WebKit and standards browsers. The Lucide chevron
                    on the right replaces it; rotates 180° on open via
                    `group-open:rotate-180`.
                  */}
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-lg font-medium leading-snug text-white sm:text-xl">
                      {qa.question}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      strokeWidth={2}
                      className="size-5 shrink-0 text-brand-200 transition-transform duration-300 ease-out group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-4 text-base leading-relaxed text-brand-100">
                    {qa.answer}
                  </p>
                </details>
              </li>
            </RevealOnScroll>
          ))}
        </ul>
      </div>
    </section>
  );
}
