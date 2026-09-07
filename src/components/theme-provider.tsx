"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Light / dark via the `.dark` class the design tokens already key off.
 * Light by default; the agent's choice lives in localStorage and is applied
 * before first paint, so there is no flash on reload.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
