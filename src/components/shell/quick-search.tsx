"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  Building2,
  Calculator,
  CalendarDays,
  CalendarPlus,
  CornerDownLeft,
  CreditCard,
  FileText,
  Gift,
  Home,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { searchIndex, type SearchClient } from "@/lib/actions/search";
import { sideLabel, stageLabel } from "@/i18n/labels";
import { clientsPath } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Item = {
  id: string;
  href: string;
  label: string;
  hint?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  client?: SearchClient;
};

type Group = { key: string; label: string; items: Item[] };

const RECENT_LIMIT = 5;
const MATCH_LIMIT = 8;

/**
 * ⌘K search: the agent's clients plus every page and the "new…" shortcuts,
 * filtered as you type, arrow keys to move, Enter to go. Opening it fetches
 * the client index once; typing never waits on the network.
 */
export function QuickSearch() {
  const t = useTranslations("nav.quickSearch");
  const tNav = useTranslations("nav");
  const tCrm = useTranslations("crm");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<SearchClient[] | null>(null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // A shortcut so frequent it must not animate: the dialog opens without a fade.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load the index on first open; results land asynchronously.
  useEffect(() => {
    if (!open || clients !== null) return;
    let cancelled = false;
    searchIndex()
      .then((rows) => {
        if (!cancelled) setClients(rows);
      })
      .catch(() => {
        if (!cancelled) setClients([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clients]);

  const pages: Item[] = useMemo(
    () => [
      { id: "home", href: "/home", label: tNav("home"), icon: Home },
      { id: "buyers", href: clientsPath("buyer"), label: tNav("buyers"), icon: Users },
      { id: "sellers", href: clientsPath("seller"), label: tNav("sellers"), icon: Building2 },
      { id: "calendar", href: "/calendar", label: tNav("calendar"), icon: CalendarDays },
      { id: "templates", href: "/templates", label: tNav("templates"), icon: FileText },
      { id: "calculator", href: "/calculator", label: tNav("calculator"), icon: Calculator },
      { id: "notifications", href: "/notifications", label: tNav("notifications"), icon: Bell },
      { id: "referrals", href: "/referrals", label: tNav("referrals"), icon: Gift },
      { id: "billing", href: "/billing", label: tNav("billing"), icon: CreditCard },
      { id: "settings", href: "/settings", label: tNav("settings"), icon: Settings },
    ],
    [tNav]
  );
  const actions: Item[] = useMemo(
    () => [
      { id: "new-buyer", href: "/clients/new?side=buyer", label: t("newBuyer"), icon: Plus },
      { id: "new-seller", href: "/clients/new?side=seller", label: t("newSeller"), icon: Plus },
      { id: "new-appointment", href: "/calendar", label: t("newAppointment"), icon: CalendarPlus },
    ],
    [t]
  );

  const q = query.trim().toLowerCase();
  const groups: Group[] = useMemo(() => {
    const matches = (label: string) => !q || label.toLowerCase().includes(q);
    const clientItems: Item[] = (clients ?? [])
      .filter((c) =>
        !q ||
        [c.name, c.email, c.phone, c.agency]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, q ? MATCH_LIMIT : RECENT_LIMIT)
      .map((c) => ({
        id: `client:${c.id}`,
        href: `/clients/${c.id}`,
        label: c.name,
        hint: [sideLabel(tCrm, c.side), stageLabel(tCrm, c.stage), c.agency]
          .filter(Boolean)
          .join(" · "),
        client: c,
      }));
    return [
      { key: "clients", label: q ? t("clients") : t("recent"), items: clientItems },
      { key: "pages", label: t("pages"), items: pages.filter((p) => matches(p.label)) },
      { key: "actions", label: t("actions"), items: actions.filter((a) => matches(a.label)) },
    ].filter((g) => g.items.length > 0);
  }, [clients, q, pages, actions, t, tCrm]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const activeIndex = flat.length === 0 ? -1 : Math.min(active, flat.length - 1);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  }

  function select(item: Item) {
    handleOpenChange(false);
    router.push(item.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (flat.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % flat.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + flat.length) % flat.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flat[activeIndex];
      if (item) select(item);
    }
  }

  const loading = open && clients === null;
  let runningIndex = -1;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("shortcut")}
        title={t("shortcut")}
        onClick={() => handleOpenChange(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Search />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none sm:max-w-xl"
        >
          <DialogTitle className="sr-only">{tNav("search")}</DialogTitle>
          <DialogDescription className="sr-only">{t("placeholder")}</DialogDescription>

          <div className="flex items-center gap-2.5 border-b px-4">
            <Search className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t("placeholder")}
              aria-label={tNav("search")}
              className="placeholder:text-muted-foreground h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <kbd className="bg-muted text-muted-foreground hidden rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium sm:block">
              esc
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
            {flat.length === 0 && !loading ? (
              <p className="text-muted-foreground py-10 text-center text-sm">{t("empty")}</p>
            ) : null}
            {groups.map((group) => (
              <div key={group.key} className="pb-1">
                <p className="label-caps text-muted-foreground px-2 pt-2 pb-1.5">{group.label}</p>
                {group.items.map((item) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const isActive = index === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-active={isActive}
                      onMouseMove={() => setActive(index)}
                      onClick={() => select(item)}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-sm outline-none",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      {item.client ? (
                        <ClientAvatar name={item.client.name} side={item.client.side} size="sm" />
                      ) : Icon ? (
                        <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md">
                          <Icon className="size-3.5" strokeWidth={1.75} />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.hint ? (
                        <span className="text-muted-foreground hidden truncate text-xs sm:block">{item.hint}</span>
                      ) : null}
                      <CornerDownLeft
                        className={cn("text-muted-foreground size-3.5 shrink-0", !isActive && "invisible")}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
            {loading ? (
              <p className="text-muted-foreground px-2 py-3 text-xs">{t("loading")}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
