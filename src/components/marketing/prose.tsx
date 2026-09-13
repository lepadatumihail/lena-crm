import { cn } from "@/lib/utils";

/**
 * Typographic defaults for the plain HTML a content module emits, so a page
 * can be written as headings, paragraphs and lists with no per-element
 * classes. The selectors start from the legal pages' article (which keeps
 * its own copy — the two are free to drift) and add what long-form writing
 * needs: quotes, rules, code, figures and scroll-safe headings.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "text-[15px] leading-relaxed sm:text-base",
        "[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary [&_a]:transition-colors",
        "[&_blockquote]:text-muted-foreground [&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]",
        "[&_dd]:mt-0.5 [&_dl]:mt-4 [&_dl]:grid [&_dl]:gap-x-6 [&_dl]:gap-y-2 [&_dl]:sm:grid-cols-[10rem_1fr] [&_dt]:font-medium",
        "[&_figcaption]:text-muted-foreground [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figure]:mt-6",
        "[&_h2]:mt-12 [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight",
        "[&_h3]:mt-8 [&_h3]:scroll-mt-20 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_hr]:my-10",
        "[&_li]:pl-1",
        "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_p]:mt-4",
        "[&_pre]:bg-muted/40 [&_pre]:mt-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:p-4 [&_pre]:text-sm",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_strong]:text-foreground [&_strong]:font-semibold",
        "[&_table]:mt-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_td]:border-b [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top",
        "[&_th]:border-b [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold",
        "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
        className
      )}
    >
      {children}
    </article>
  );
}
