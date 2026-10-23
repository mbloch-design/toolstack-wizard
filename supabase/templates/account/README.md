# E-mails de compte ToolTrim

Deux modèles pour les parcours actifs : confirmation d’inscription et récupération du mot de passe. Contenu français et anglais dans un même message, sans dépendre d’une métadonnée de langue absente des comptes existants. Un seul bouton, aucun pixel, image distante, lien marketing ou donnée personnelle ajoutée.

| Modèle Supabase | Fichier | Objet |
| --- | --- | --- |
| Confirm sign up | `confirmation.html` | ToolTrim — Confirmez votre e-mail / Confirm your email |
| Reset password | `recovery.html` | ToolTrim — Nouveau mot de passe / Reset your password |

Dans Authentication → Emails → Templates, sauvegarder les modèles et objets existants avant de remplacer uniquement ces deux contenus. Conserver littéralement `{{ .ConfirmationURL }}` : Supabase reste responsable du jeton, du type d’action et du retour autorisé. Ne pas fabriquer de lien à partir de Site URL ou d’un jeton reçu par chat.

Cette configuration est commune au projet Supabase ; elle n’est pas isolée par branche Vercel. La présence de ces fichiers dans Git ne met pas à jour les modèles hébergés. Aucune modification SMTP, quota ou domaine d’expédition n’est incluse.

Après installation, recevoir chaque message sur une adresse de recette autorisée, vérifier le lien, le retour vers la Preview et le changement de mot de passe. Les liens ne doivent pas apparaître dans les captures, rapports ou journaux publiables. Restaurer les deux anciens objets/contenus sauvegardés en cas d’échec.

État au 23 octobre 2026 : fichiers préparés ; installation distante non effectuée, le compte Dashboard actif n’a pas accès au projet ToolTrim.
