import { useState } from "react";
import { useLang } from "@/hooks/useLang";

const ContactPage = () => {
  const { t } = useLang();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="py-20 text-center">
        <div className="container mx-auto max-w-md">
          <p className="text-4xl">✉️</p>
          <h1 className="mt-4 font-heading text-2xl font-bold">{t("Message envoyé !", "Message sent!")}</h1>
          <p className="mt-2 text-muted-foreground">{t("Nous vous répondrons dans les plus brefs délais.", "We'll get back to you as soon as possible.")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-md">
        <h1 className="font-heading text-3xl font-bold">Contact</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">{t("Nom", "Name")}</label>
            <input type="text" required className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" required className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("Sujet", "Subject")}</label>
            <input type="text" required className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea required rows={4} className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90">
            {t("Envoyer", "Send")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
