/**
 * Browsers embedded in other apps: Facebook, Instagram, Messenger, TikTok,
 * LinkedIn, LINE, WeChat and bare Android WebViews. Google refuses to sign
 * anyone in from these ("403: disallowed_useragent"), and a tap on a Facebook
 * or Instagram ad opens in exactly one of them, so the sign-in form offers
 * the email code alone when this is true.
 */
const IN_APP =
  /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|LinkedInApp|BytedanceWebview|musical_ly|Line\/|MicroMessenger|; wv\)/i;

export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  return !!userAgent && IN_APP.test(userAgent);
}
