# GO25 - Branche et preprod

## Objectif

GO25 fixe la regle de livraison : rien ne part en production sans passer par une branche dediee, une CI verte et une preprod verifiee.

## Branche cible

Nom recommande :

```bash
codex/go25-preprod-hardening
```

Dans ce sandbox, la creation de branche Git a echoue avec :

```text
Operation not permitted
```

Action a faire localement avant commit :

```bash
git switch -c codex/go25-preprod-hardening
```

## Flux de livraison

1. Branche `codex/go25-preprod-hardening`.
2. Commit du train GO8-GO25.
3. Push de la branche.
4. Pull request vers `preprod`.
5. CI `Preprod CI` verte.
6. Deploiement preprod.
7. Tests manuels preprod.
8. Pull request ou merge controle de `preprod` vers `main`.
9. Deploiement prod.

## Environnements

### Preprod

- Domaine recommande : `preprod.tooltrim.com`.
- Projet Supabase separe recommande.
- Secrets separes obligatoires.
- Resend en domaine ou sender preprod si possible.

Fichier de reference :

```text
.env.preprod.example
```

### Production

- Domaine : `tooltrim.com`.
- Projet Supabase prod.
- Secrets prod distincts.
- Workers planifies apres validation preprod.

## Gate preprod

La preprod est valide si :

- CI verte ;
- migrations appliquees ;
- back-office accessible avec `BACKOFFICE_ADMIN_KEY` ;
- `send-backoffice-alerts` repond en `dryRun`;
- `process-diagnostic-email-jobs` traite un batch de test ;
- un diagnostic complet cree bien session, snapshot, restitution, email job ;
- Pilotage remonte la session attendue ;
- aucune vue back-office n'est accessible avec la cle anon.

## Gate prod

La prod est autorisee seulement si :

- GO23 repasse sans blocage ;
- GO24 est verifie sur preprod ;
- aucune faille `npm audit` critical/high ;
- validation navigateur mobile + desktop ;
- plan de rollback documente ;
- monitoring J+1/J+7 actif.
