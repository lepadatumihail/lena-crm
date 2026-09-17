/**
 * Fetch a file from one of the app's own routes and save it. Client-only.
 * The routes answer errors as `{ error }` JSON in the agent's language.
 */

/** The proxy bounced the request to /login: the session is over. */
export class SessionEndedError extends Error {
  constructor() {
    super("Session ended");
    this.name = "SessionEndedError";
  }
}

/** The name in a Content-Disposition header, preferring the UTF-8 `filename*`. */
export function fileNameFrom(disposition: string | null): string | null {
  if (!disposition) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Fall through to the plain name.
    }
  }
  return /filename="([^"]+)"/i.exec(disposition)?.[1] ?? null;
}

export async function downloadFrom(
  url: string,
  init: RequestInit,
  fallbackName: string
): Promise<void> {
  // A redirect here can only be the sign-in bounce; don't follow it into HTML.
  const res = await fetch(url, { ...init, redirect: "manual" });
  if (res.type === "opaqueredirect") throw new SessionEndedError();
  if (res.status === 401) throw new SessionEndedError();
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "");
  }

  const fileName = fileNameFrom(res.headers.get("Content-Disposition")) ?? fallbackName;
  const objectUrl = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
