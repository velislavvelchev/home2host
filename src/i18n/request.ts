import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// Per-request config consumed by Server Components via next-intl's
// async `getTranslations()` / `useTranslations()`. Resolves the active
// locale from the [locale] route segment and loads the matching JSON
// message bundle.
//
// `requested` is the segment value as Next.js parsed it (or undefined
// when the middleware can't infer one — e.g. a bare /sitemap.xml hit
// that's been excluded from the middleware matcher anyway). Falling
// back to the default locale keeps server-only rendering paths safe
// even if a malformed URL slips through.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
