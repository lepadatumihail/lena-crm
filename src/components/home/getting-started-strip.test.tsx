import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GettingStartedStrip,
  IfOnboardingExpected,
} from "@/components/home/getting-started-strip";
import { ShellProvider } from "@/components/shell/shell-context";
import { messagesFor } from "@/i18n/messages";
import type { OnboardingInput } from "@/lib/home";

const nav = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: nav.refresh, push: nav.push }),
  usePathname: () => "/home",
}));
const toast = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messagesFor("en")} timeZone="UTC">
    {children}
  </NextIntlClientProvider>
);

function clearCookie() {
  document.cookie = "home_onboarding=; path=/; max-age=0";
}

beforeEach(clearCookie);

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
  clearCookie();
});

const young: OnboardingInput = {
  hasName: true,
  clientCount: 2,
  appointmentCount: 0,
  templateCount: 0,
  referralCount: 0,
};

describe("GettingStartedStrip", () => {
  it("shows the required steps done and links the next one", () => {
    render(<GettingStartedStrip onboarding={young} />, { wrapper });
    expect(screen.getByText("2 of 4")).toBeTruthy();
    const next = screen.getByRole("link", { name: /Next: Book a viewing/ });
    expect(next.getAttribute("href")).toBe("/calendar?new=1");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe(
      "2 of 4 steps done"
    );
  });

  it("opens the whole checklist inline, the invite marked optional and locked", () => {
    render(<GettingStartedStrip onboarding={young} />, { wrapper });
    const toggle = screen.getByRole("button", { name: "Show steps" });
    expect(screen.queryByRole("list")).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    // Done steps are not links; open ones are.
    expect(within(items[0]).queryByRole("link")).toBeNull();
    expect(within(items[0]).getByText("Done:")).toBeTruthy();
    expect(within(items[2]).getByRole("link").getAttribute("href")).toBe("/calendar?new=1");
    // The invite waits for three clients and never holds the checklist open.
    expect(within(items[4]).queryByRole("link")).toBeNull();
    expect(within(items[4]).getByText("Optional")).toBeTruthy();
    expect(within(items[4]).getByText("Unlocks after 3 clients.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hide steps" }));
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("hides itself with a cookie and says where to bring it back", () => {
    render(<GettingStartedStrip onboarding={young} />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Hide getting started" }));
    expect(screen.queryByRole("region")).toBeNull();
    expect(document.cookie).toContain("home_onboarding=hidden");
    expect(toast).toHaveBeenCalledWith(
      "Getting started is hidden. Your account menu brings it back."
    );
    expect(nav.refresh).toHaveBeenCalled();
  });
});

describe("IfOnboardingExpected", () => {
  it("holds the strip's place until this device closed or finished it", () => {
    const placeholder = (
      <IfOnboardingExpected>
        <p>strip</p>
      </IfOnboardingExpected>
    );
    render(placeholder);
    expect(screen.getByText("strip")).toBeTruthy();

    cleanup();
    document.cookie = "home_onboarding=done; path=/";
    render(placeholder);
    expect(screen.queryByText("strip")).toBeNull();
  });

  it("ignores what another account left on a shared device", () => {
    document.cookie = "home_onboarding=done.someone-else; path=/";
    const asMe = (
      <ShellProvider agentId="me">
        <IfOnboardingExpected>
          <p>strip</p>
        </IfOnboardingExpected>
      </ShellProvider>
    );
    render(asMe);
    expect(screen.getByText("strip")).toBeTruthy();

    cleanup();
    document.cookie = "home_onboarding=done.me; path=/";
    render(asMe);
    expect(screen.queryByText("strip")).toBeNull();
  });
});
