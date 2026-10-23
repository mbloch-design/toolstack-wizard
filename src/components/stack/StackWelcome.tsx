import { Bookmark, LayoutGrid, Wallet, Copy, ArrowRight } from "@/lib/icons";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";

export default function StackWelcome() {
  const { t } = useLang();
  const account = useStackAccount();
  const experience = useAccountExperience();
  const expired = account.syncStatus === "session-expired";
  const benefits = [
    { Icon: LayoutGrid, tone: "organize", title: t("Gardez ce qui vous sert.", "Keep what works for you."), copy: t("Rassemblez vos outils par usage pour voir ce qu’ils vous apportent vraiment.", "Bring your tools together by use to see what each one brings to your work.") },
    { Icon: Wallet, tone: "budget", title: t("Sachez où va votre budget.", "Know where your budget goes."), copy: t("Retrouvez le coût mensuel estimé de votre stack et les abonnements que vous payez.", "See your stack’s estimated monthly cost and the subscriptions you pay for.") },
    { Icon: Copy, tone: "overlap", title: t("Ajoutez avec une bonne raison.", "Make every addition count."), copy: t("Repérez les recoupements et comparez les options avant de choisir un nouvel outil.", "Spot overlaps and compare your options before choosing a new tool.") },
  ];
  return <div className="ms-page ms-welcome">
    <Breadcrumb items={[{label:t("Ma stack", "My stack")}]} includeSchema={false} />
    <section className="ms-welcome-layout" aria-labelledby="ms-welcome-title">
      <div className="ms-welcome-copy">
        <h1 id="ms-welcome-title">{t("Les bons outils.\nJuste l’essentiel.", "The right tools.\nJust the essentials.")}</h1>
        <p className="ms-welcome-lead">{t("Décidez quels logiciels garder, remplacer ou ajouter. Votre stack vous aide à faire les bons choix, sans empiler les abonnements.", "Decide which software to keep, replace or add. Your stack helps you make better choices without piling up subscriptions.")}</p>
        <ul className="ms-welcome-benefits">{benefits.map(({Icon,tone,title,copy})=><li key={tone}>
          <span className={`ms-welcome-icon ms-welcome-icon--${tone}`}><Icon size={22} aria-hidden /></span>
          <div><h2>{title}</h2><p>{copy}</p></div>
        </li>)}</ul>
        <div className="ms-welcome-start">
          <p>{expired ? t("Votre session a expiré. Reconnectez-vous pour retrouver votre stack.", "Your session expired. Sign in again to access your stack.") : t("Votre stack commence avec un compte gratuit. Retrouvez-la ensuite sur tous vos appareils.", "Your stack starts with a free account. Pick up where you left off on any device.")}</p>
          <button type="button" className="ac-button ac-button--primary" disabled={!account.authInitialized} onClick={()=>experience.openAuth(expired?"signin":"signup")}>
            {expired?t("Me reconnecter", "Sign in again"):t("Créer ma stack", "Create my stack")}<ArrowRight size={18} aria-hidden />
          </button>
          {!expired && <button type="button" className="ac-text-button" disabled={!account.authInitialized} onClick={()=>experience.openAuth("signin")}>{t("J’ai déjà un compte", "I already have an account")}</button>}
        </div>
      </div>
      <div className="ms-welcome-preview" aria-hidden="true">
        <span className="ms-welcome-preview-mark"><Bookmark size={26} /></span>
        <div className="ms-welcome-map">{benefits.map(({Icon,tone})=><div className="ms-welcome-map-row" key={tone}><span className={`ms-welcome-icon ms-welcome-icon--${tone}`}><Icon size={20} /></span><span className="ms-welcome-preview-lines"><i /><i /></span></div>)}</div>
        <p className="ms-welcome-preview-note">{t("Votre future stack", "Your future stack")}</p>
      </div>
    </section>
  </div>;
}
