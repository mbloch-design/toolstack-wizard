# GO30 - Session admin back-office

## Objectif

GO30 remplace la cle brute dans le back-office par un login classique email + mot de passe avec Supabase Auth.

## Fonctionnement

1. L'admin saisit son email et son mot de passe.
2. Supabase Auth cree une session utilisateur.
3. Le back-office appelle l'Edge Function avec le JWT Supabase.
4. L'Edge Function verifie que l'email est present dans `BACKOFFICE_ADMIN_EMAILS`.
5. Les appels back-office suivants utilisent la session Supabase.

Les scripts de validation continuent d'accepter `x-admin-key` pour ne pas casser GO26/GO28.

## Secrets et variables

Option guidee :

```bash
npm run setup:go30-admin-auth
```

La commande complete `.env.preprod`, ajoute l'email dans `BACKOFFICE_ADMIN_EMAILS`, puis cree l'utilisateur admin Supabase si le projet accepte la creation via la service role key.

Pour changer le mot de passe admin plus tard :

```bash
npm run rotate:go30-admin-password
```

Option manuelle :

1. Aller dans Supabase > Authentication > Users.
2. Cliquer sur Add user / Create user.
3. Renseigner l'email admin et un mot de passe fort.
4. Confirmer l'email si Supabase le propose.

Edge Function :

```text
BACKOFFICE_ADMIN_EMAILS=admin@example.com,ops@example.com
```

Validation locale :

```text
GO30_ADMIN_EMAIL=admin@example.com
GO30_ADMIN_PASSWORD=<mot-de-passe-admin>
```

`BACKOFFICE_ADMIN_KEY` reste necessaire pour les scripts techniques GO26/GO28, mais il n'est plus demande dans l'interface back-office.

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

Le login doit afficher email + mot de passe. Apres connexion, le header affiche l'email connecte.
