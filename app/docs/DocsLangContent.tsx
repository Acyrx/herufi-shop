"use client";

import { useLang } from "./LangContext";

interface Props {
  enHtml: string;
  swHtml: string;
  /** Optional extra wrapper className */
  className?: string;
}

/**
 * Renders the correct language HTML instantly when the lang context changes.
 * Receives both strings from the server component (no extra fetch).
 */
export function DocsLangContent({ enHtml, swHtml, className = "" }: Props) {
  const { lang } = useLang();
  return (
    <div
      className={`docs-content ${className}`}
      dangerouslySetInnerHTML={{ __html: lang === "sw" ? swHtml : enHtml }}
    />
  );
}
