import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignInForm } from "@/components/auth/sign-in-form";
import { messagesFor } from "@/i18n/messages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/i18n/actions", () => ({ syncLocaleFromProfile: vi.fn() }));
vi.mock("@/lib/site-events", () => ({ trackSiteEvent: vi.fn() }));
const signInWithOAuth = vi.hoisted(() => vi.fn());
const signInWithOtp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth, signInWithOtp } }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messagesFor("en")} timeZone="UTC">
    {children}
  </NextIntlClientProvider>
);

const Title = (props: { children?: ReactNode }) => <h2 {...props} />;
const Description = (props: { children?: ReactNode }) => <p {...props} />;

function setReferrer(value: string) {
  Object.defineProperty(document, "referrer", { value, configurable: true });
}

beforeEach(() => {
  // A visitor ChatGPT sent to the client tracker, arriving from Perplexity's
  // page this time: the tag and the referrer can disagree, and both are kept.
  window.history.pushState({}, "", "/tools/client-spreadsheet?utm_source=chatgpt.com");
  setReferrer("https://www.perplexity.ai/search/abc?q=client+tracker");
  signInWithOAuth.mockResolvedValue({ error: null });
  signInWithOtp.mockResolvedValue({ error: null });
});

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
  setReferrer("");
  window.history.pushState({}, "", "/");
});

describe("SignInForm", () => {
  it("sends Google's return trip to the page's next, with the tags and the referring site", async () => {
    render(<SignInForm next="/clients/import" Title={Title} Description={Description} track />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await vi.waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());

    const callback = new URL(signInWithOAuth.mock.calls[0][0].options.redirectTo);
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/clients/import");
    expect(JSON.parse(callback.searchParams.get("src") ?? "null")).toEqual({
      utm_source: "chatgpt.com",
      landing: "/tools/client-spreadsheet",
      referrer: "perplexity.ai",
    });
  });

  it("puts the referring site in an email sign-up's metadata", async () => {
    render(<SignInForm Title={Title} Description={Description} />, { wrapper });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "agent@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    await vi.waitFor(() => expect(signInWithOtp).toHaveBeenCalled());

    expect(signInWithOtp.mock.calls[0][0].options.data.signup_source).toEqual({
      utm_source: "chatgpt.com",
      landing: "/tools/client-spreadsheet",
      referrer: "perplexity.ai",
    });
  });

  it("records no referrer for a visitor who came from our own pages", async () => {
    setReferrer(`${window.location.origin}/tools`);
    render(<SignInForm Title={Title} Description={Description} />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await vi.waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());

    const callback = new URL(signInWithOAuth.mock.calls[0][0].options.redirectTo);
    expect(callback.searchParams.get("next")).toBe("/home");
    expect(JSON.parse(callback.searchParams.get("src") ?? "null")).not.toHaveProperty("referrer");
  });
});
