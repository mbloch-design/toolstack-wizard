import { Bookmark, Check, Layers, ArrowUpRight } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";

/** Product context shared by the sign-up page and dialog; no external media. */
export default function AccountWelcome() {
  const { t } = useLang();
  return <aside className="ac-welcome">
    <span className="ac-welcome-brand"><Layers size={21} aria-hidden />ToolTrim</span>
    <div className="ac-welcome-copy">
      <span className="ac-eyebrow">{t("Moins d’outils. Plus de clarté.", "Fewer tools. More clarity.")}</span>
      <h2>{t("Vos outils.", "Your tools.")}<br />{t("Votre stack.", "Your stack.")}<br /><span>{t("Tout simplement.", "Simply together.")}</span></h2>
      <p>{t("Gardez vos choix à portée de main et faites évoluer votre stack, à votre rythme.", "Keep your choices close and build your stack at your own pace.")}</p>
    </div>
    <div className="ac-welcome-stack" aria-hidden>
      <div><span className="ac-welcome-stack-icon"><Bookmark size={20} /></span><strong>{t("Ma stack", "My stack")}</strong><ArrowUpRight size={18} /></div>
      <span className="ac-welcome-line"><i /><i /><i /></span>
      <span className="ac-welcome-saved"><Check size={15} />{t("Vos choix, réunis.", "Your choices, together.")}</span>
    </div>
    <ul className="ac-welcome-benefits">
      <li><Check size={16} aria-hidden />{t("Une stack personnelle", "One personal stack")}</li>
      <li><Check size={16} aria-hidden />{t("Retrouvez-la sur vos appareils", "Access it across your devices")}</li>
      <li><Check size={16} aria-hidden />{t("Vos données sous votre contrôle", "Your data under your control")}</li>
    </ul>
  </aside>;
}
