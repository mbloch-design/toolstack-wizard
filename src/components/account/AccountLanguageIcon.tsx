/** Small local language marks, decorative beside the full language name. */
export default function AccountLanguageIcon({ language }: { language: "fr" | "en" }) {
  return <svg className="ac-language-mark" viewBox="0 0 24 16" aria-hidden="true" focusable="false">
    {language === "fr" ? <><path fill="var(--color-flag-white)" d="M0 0h24v16H0z"/><path fill="var(--color-flag-fr-blue)" d="M0 0h8v16H0z"/><path fill="var(--color-flag-fr-red)" d="M16 0h8v16h-8z"/></> : <><path fill="var(--color-flag-en-blue)" d="M0 0h24v16H0z"/><path stroke="var(--color-flag-white)" strokeWidth="4" d="m0 0 24 16M24 0 0 16"/><path stroke="var(--color-flag-en-red)" strokeWidth="1.5" d="m0 0 24 16M24 0 0 16"/><path stroke="var(--color-flag-white)" strokeWidth="6" d="M12 0v16M0 8h24"/><path stroke="var(--color-flag-en-red)" strokeWidth="3" d="M12 0v16M0 8h24"/></>}
  </svg>;
}
