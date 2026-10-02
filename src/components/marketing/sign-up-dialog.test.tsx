import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignUpDialog } from "@/components/marketing/sign-up-dialog";
import { messagesFor } from "@/i18n/messages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/i18n/actions", () => ({ syncLocaleFromProfile: vi.fn() }));
const trackSiteEvent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/site-events", () => ({ trackSiteEvent }));
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession } }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messagesFor("en")} timeZone="UTC">
    {children}
  </NextIntlClientProvider>
);

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

const session = { data: { session: { access_token: "token" } } };
const noSession = { data: { session: null } };

describe("SignUpDialog", () => {
  it("opens the sign-up form for a visitor without a session", async () => {
    getSession.mockResolvedValue(noSession);
    render(<SignUpDialog>Start for free</SignUpDialog>, { wrapper });
    await vi.waitFor(() => expect(getSession).toHaveBeenCalled());

    expect(screen.queryByRole("link", { name: "Start for free" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start for free" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(trackSiteEvent).toHaveBeenCalledWith("signup_open");
  });

  it("is a link into the app for an agent who is already signed in", async () => {
    getSession.mockResolvedValue(session);
    render(<SignUpDialog>Start for free</SignUpDialog>, { wrapper });

    const link = await screen.findByRole("link", { name: "Start for free" });
    expect(link.getAttribute("href")).toBe("/home");
    // No dialog trigger is left behind it: the link is the whole button.
    expect(link.getAttribute("aria-haspopup")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("sends a signed-in agent where the button would have landed them", async () => {
    getSession.mockResolvedValue(session);
    render(<SignUpDialog next="/clients/import">Import</SignUpDialog>, { wrapper });

    const link = await screen.findByRole("link", { name: "Import" });
    expect(link.getAttribute("href")).toBe("/clients/import");
  });

  it("keeps the dialog when the session lookup fails", async () => {
    getSession.mockRejectedValue(new Error("storage unavailable"));
    render(<SignUpDialog>Start for free</SignUpDialog>, { wrapper });
    await vi.waitFor(() => expect(getSession).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Start for free" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
