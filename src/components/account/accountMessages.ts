export function accountErrorMessage(
  error: string,
  t: (fr: string, en: string) => string,
): string {
  switch (error) {
    case "ACCOUNT_INVALID_CREDENTIALS":
      return t(
        "E-mail ou mot de passe incorrect.",
        "Incorrect email or password.",
      );
    case "ACCOUNT_EMAIL_UNCONFIRMED":
      return t(
        "Confirmez votre adresse e-mail avant de vous connecter.",
        "Confirm your email address before signing in.",
      );
    case "ACCOUNT_RATE_LIMITED":
      return t(
        "Trop de tentatives. Patientez une minute avant de réessayer.",
        "Too many attempts. Wait a minute before trying again.",
      );
    case "ACCOUNT_PASSWORD_TOO_SHORT":
      return t("Utilisez au moins 8 caractères.", "Use at least 8 characters.");
    case "ACCOUNT_PASSWORD_TOO_WEAK":
      return t(
        "Choisissez un mot de passe plus long et difficile à deviner.",
        "Choose a longer password that is difficult to guess.",
      );
    case "ACCOUNT_PASSWORD_UNCHANGED":
      return t(
        "Choisissez un mot de passe différent du précédent.",
        "Choose a password different from your previous one.",
      );
    case "ACCOUNT_REAUTHENTICATION_REQUIRED":
      return t(
        "Une nouvelle vérification est nécessaire. Demandez un nouveau lien par e-mail.",
        "Another verification is required. Request a new email link.",
      );
    case "ACCOUNT_RECOVERY_INVALID":
      return t(
        "Ce lien est invalide ou expiré. Demandez un nouveau lien.",
        "This link is invalid or expired. Request a new link.",
      );
    case "ACCOUNT_HAS_CONTRIBUTIONS":
      return t(
        "Ce compte est lié à des contributions. La suppression est interrompue pour préserver leur historique. Contactez ToolTrim pour organiser la suite.",
        "This account is linked to contributions. Deletion is paused to preserve their history. Contact ToolTrim to arrange the next step.",
      );
    case "ACCOUNT_DELETION_UNCONFIRMED":
      return t(
        "Votre session s’est terminée et la suppression n’a pas été confirmée. Vous pouvez effacer les données de cet appareil sans confirmer la suppression du compte.",
        "Your session ended and account deletion was not confirmed. You can clear this device without confirming remote account deletion.",
      );
    case "ACCOUNT_SIGN_OUT_FAILED":
      return t(
        "La déconnexion a échoué. Réessayez.",
        "Sign-out failed. Please try again.",
      );
    case "ACCOUNT_SESSION_INVALID":
      return t(
        "Votre session a expiré. Reconnectez-vous.",
        "Your session expired. Sign in again.",
      );
    case "ACCOUNT_AUTH_SESSION_CHANGED":
      return t(
        "Le compte a changé pendant cette action. Réessayez depuis le compte actuel.",
        "The account changed during this action. Try again from the current account.",
      );
    case "ACCOUNT_OAUTH_CANCELLED":
      return t(
        "La connexion a été annulée ou refusée. Vous pouvez réessayer.",
        "Sign-in was cancelled or denied. You can try again.",
      );
    default:
      return t(
        "Cette action est indisponible pour le moment. Réessayez dans un instant.",
        "This action is unavailable right now. Try again shortly.",
      );
  }
}
