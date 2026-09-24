import { describe, expect, it } from "vitest";

import { isInAppBrowser } from "@/lib/in-app-browser";

describe("isInAppBrowser", () => {
  it("spots the Facebook and Instagram browsers an ad tap opens in", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/498.0.0.52.107;FBBV/712345678;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_GB;FBOP/5]"
      )
    ).toBe(true);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.146 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.44.109;]"
      )
    ).toBe(true);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.29.93 (iPhone15,2; iOS 18_5; en_GB; en-GB; scale=3.00; 1179x2556; 646352817)"
      )
    ).toBe(true);
  });

  it("treats a bare Android WebView as in-app", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.146 Mobile Safari/537.36"
      )
    ).toBe(true);
  });

  it("leaves real browsers alone", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.146 Mobile Safari/537.36"
      )
    ).toBe(false);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
      )
    ).toBe(false);
    expect(isInAppBrowser(undefined)).toBe(false);
    expect(isInAppBrowser("")).toBe(false);
  });
});
