import type { ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PropertiesSection } from "@/components/clients/sections/properties-section";
import { ViewingsSection } from "@/components/clients/sections/viewings-section";
import { ShellProvider } from "@/components/shell/shell-context";
import { messagesFor } from "@/i18n/messages";
import { addViewingAttachment } from "@/lib/actions/buyer";
import {
  addPropertyAttachment,
  deletePropertyAttachment,
} from "@/lib/actions/seller";
import type { ViewingWithAttachments } from "@/lib/data/buyer";
import type { PropertyWithAttachments } from "@/lib/data/seller";
import type { PropertyAttachment } from "@/lib/supabase/types";

const nav = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: nav.refresh, replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/clients",
}));
vi.mock("@/lib/actions/seller", () => ({
  saveProperty: vi.fn().mockResolvedValue({ error: null }),
  deleteProperty: vi.fn().mockResolvedValue({ error: null }),
  addPropertyAttachment: vi.fn().mockResolvedValue({ error: null }),
  deletePropertyAttachment: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/lib/actions/buyer", () => ({
  saveViewing: vi.fn().mockResolvedValue({ error: null }),
  deleteViewing: vi.fn().mockResolvedValue({ error: null }),
  addViewingAttachment: vi.fn().mockResolvedValue({ error: null }),
  deleteViewingAttachment: vi.fn().mockResolvedValue({ error: null }),
}));
const storage = vi.hoisted(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: storage.upload,
        createSignedUrl: storage.createSignedUrl,
      }),
    },
  }),
}));

const AGENT = "5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f";
const CLIENT = "3f2c8b0e-5a1d-4c2b-9e7f-1a2b3c4d5e6f";
const AT = "2026-09-10T08:00:00.000Z";

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messagesFor("en")} timeZone="UTC">
    <ShellProvider timeZone="UTC">{children}</ShellProvider>
  </NextIntlClientProvider>
);

// Radix dialogs reach for browser APIs jsdom does not have.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

beforeEach(() => {
  storage.upload.mockResolvedValue({ error: null });
  storage.createSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://files.test/signed" },
    error: null,
  });
});

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  cleanup();
});

function property(
  id: string,
  attachments: PropertyAttachment[] | null
): PropertyWithAttachments {
  return {
    id,
    client_id: CLIENT,
    agent_id: AGENT,
    price: 2_000_000,
    bedrooms: 4,
    property_type: "villa",
    address: `Villa ${id}`,
    city: "Benahavís",
    notes: null,
    created_at: AT,
    updated_at: AT,
    attachments,
  };
}

function propertyFile(
  id: string,
  propertyId: string,
  name: string,
  kind: PropertyAttachment["kind"]
): PropertyAttachment {
  return {
    id,
    agent_id: AGENT,
    property_id: propertyId,
    storage_path: `${AGENT}/${CLIENT}/properties/${id}-${name}`,
    file_name: name,
    mime_type: kind === "pdf" ? "application/pdf" : "image/jpeg",
    size: 1024,
    kind,
    created_at: AT,
  };
}

/** A row's hidden file input for one picker, as the menu item would open it. */
function picker(row: HTMLElement, accept: "application/pdf" | "image/*") {
  const input = row.querySelector<HTMLInputElement>(`input[type="file"][accept="${accept}"]`);
  if (!input) throw new Error(`No ${accept} picker in this row`);
  return input;
}

function pick(input: HTMLInputElement, files: File[]) {
  fireEvent.change(input, { target: { files } });
}

describe("PropertiesSection attachments", () => {
  it("lists a property's files and opens one through a short-lived link", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <PropertiesSection
        clientId={CLIENT}
        agentId={AGENT}
        properties={[
          property("p1", [
            propertyFile("f1", "p1", "brochure.pdf", "pdf"),
            propertyFile("f2", "p1", "terrace.jpg", "image"),
          ]),
        ]}
      />,
      { wrapper }
    );

    expect(screen.getByRole("button", { name: "terrace.jpg" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "brochure.pdf" }));

    await waitFor(() =>
      expect(open).toHaveBeenCalledWith(
        "https://files.test/signed",
        "_blank",
        "noopener,noreferrer"
      )
    );
    expect(storage.createSignedUrl).toHaveBeenCalledWith(
      `${AGENT}/${CLIENT}/properties/f1-brochure.pdf`,
      60
    );
  });

  it("files picked PDFs and photos under the property, in its own folder", async () => {
    render(
      <PropertiesSection clientId={CLIENT} agentId={AGENT} properties={[property("p1", [])]} />,
      { wrapper }
    );
    const row = screen.getByRole("listitem");
    const pdfs = picker(row, "application/pdf");
    expect(pdfs.multiple).toBe(true);

    pick(pdfs, [
      new File(["%PDF"], "brochure.pdf", { type: "application/pdf" }),
      new File(["%PDF"], "nota simple.pdf", { type: "application/pdf" }),
    ]);
    await waitFor(() => expect(addPropertyAttachment).toHaveBeenCalledTimes(2));
    expect(addPropertyAttachment).toHaveBeenCalledWith(
      CLIENT,
      "p1",
      expect.objectContaining({
        kind: "pdf",
        file_name: "nota simple.pdf",
        mime_type: "application/pdf",
        storage_path: expect.stringMatching(
          new RegExp(`^${AGENT}/${CLIENT}/properties/.+-nota_simple\\.pdf$`)
        ),
      })
    );

    pick(picker(row, "image/*"), [new File(["jpg"], "terrace.jpg", { type: "image/jpeg" })]);
    await waitFor(() =>
      expect(addPropertyAttachment).toHaveBeenLastCalledWith(
        CLIENT,
        "p1",
        expect.objectContaining({ kind: "image", file_name: "terrace.jpg" })
      )
    );
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("removes a file only after the agent confirms", async () => {
    render(
      <PropertiesSection
        clientId={CLIENT}
        agentId={AGENT}
        properties={[property("p1", [propertyFile("f1", "p1", "brochure.pdf", "pdf")])]}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove attachment" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("“brochure.pdf” will be removed from this property.")
    ).toBeTruthy();
    expect(deletePropertyAttachment).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(deletePropertyAttachment).toHaveBeenCalledWith(CLIENT, "f1"));
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  });

  it("offers the attach menu only once the attachments table exists", () => {
    render(
      <PropertiesSection
        clientId={CLIENT}
        agentId={AGENT}
        properties={[property("p1", []), property("p2", null)]}
      />,
      { wrapper }
    );
    const [ready, notReady] = screen.getAllByRole("listitem");

    expect(within(ready).getByRole("button", { name: "Attach a file" })).toBeTruthy();
    expect(within(notReady).queryByRole("button", { name: "Attach a file" })).toBeNull();
  });
});

describe("ViewingsSection attachments", () => {
  const viewing: ViewingWithAttachments = {
    id: "v1",
    client_id: CLIENT,
    agent_id: AGENT,
    title: "3-bed apartment, Nueva Andalucía",
    description: null,
    had_offer: false,
    offer_price: null,
    property_price: 650_000,
    scheduled_at: null,
    reminder_minutes: null,
    created_at: AT,
    updated_at: AT,
    attachments: [],
  };

  it("still records a picked PDF as the viewing's window card", async () => {
    render(<ViewingsSection clientId={CLIENT} agentId={AGENT} viewings={[viewing]} />, {
      wrapper,
    });
    const row = screen.getByRole("listitem");
    const card = picker(row, "application/pdf");
    expect(card.multiple).toBe(false);

    pick(card, [new File(["%PDF"], "card.pdf", { type: "application/pdf" })]);
    await waitFor(() =>
      expect(addViewingAttachment).toHaveBeenCalledWith(
        CLIENT,
        "v1",
        expect.objectContaining({
          kind: "window_card",
          file_name: "card.pdf",
          storage_path: expect.stringMatching(new RegExp(`^${AGENT}/${CLIENT}/viewings/`)),
        })
      )
    );
  });
});
