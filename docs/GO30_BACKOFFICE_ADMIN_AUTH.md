# GO30 - Session admin back-office

## Objectif

GO30 remplace l'usage permanent de la cle brute dans le back-office par une session admin temporaire.

## Fonctionnement

1. L'admin saisit `BACKOFFICE_ADMIN_KEY` une seule fois.
2. L'Edge Function `backoffice-diagnostic` verifie la cle.
3. Elle renvoie un jeton admin signe, valable 8 heures.
4. Le navigateur conserve uniquement ce jeton temporaire.
5. Les appels back-office suivants utilisent `x-admin-session`.

Les scripts de validation continuent d'accepter `x-admin-key` pour ne pas casser GO26/GO28.

## Verification

Apres deploiement de l'Edge Function :

```bash
npm run validate:go30
```

Verdict attendu :

```text
GO30 admin auth verdict: PASS
```

## Validation UI

Ouvrir :

```text
https://preprod.tooltrim.com/fr/back-office
```

Le login doit indiquer que la cle brute n'est pas conservee dans le navigateur. Apres connexion, le header affiche l'expiration de la session admin.
