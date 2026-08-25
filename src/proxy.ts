import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all app routes; skip Next internals, /api, and static files.
  // With a single locale and localePrefix "as-needed", URLs stay unprefixed (e.g. /log).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
