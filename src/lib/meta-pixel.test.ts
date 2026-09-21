import { describe, expect, it } from "vitest";

import { PRODUCTION_META_PIXEL_ID } from "@/lib/site";
import { metaPixelIdFor } from "./meta-pixel";

describe("metaPixelIdFor", () => {
  it("uses the production pixel on the production hosts only", () => {
    expect(metaPixelIdFor("www.leadwing.app")).toBe(PRODUCTION_META_PIXEL_ID);
    expect(metaPixelIdFor("leadwing.app")).toBe(PRODUCTION_META_PIXEL_ID);
    expect(metaPixelIdFor("WWW.LEADWING.APP")).toBe(PRODUCTION_META_PIXEL_ID);
  });

  it("loads nothing on previews, look-alikes and local runs", () => {
    expect(metaPixelIdFor("lena-crm-git-main-lepadatumihails-projects.vercel.app")).toBeNull();
    expect(metaPixelIdFor("localhost")).toBeNull();
    expect(metaPixelIdFor("staging.leadwing.app")).toBeNull();
    expect(metaPixelIdFor("leadwing.app.example.com")).toBeNull();
  });
});
