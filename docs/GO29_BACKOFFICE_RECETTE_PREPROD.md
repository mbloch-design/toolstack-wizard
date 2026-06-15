# GO29 - Back-office de recette preprod

## Objectif

GO29 rend la preprod exploitable sans terminal : le back-office affiche un verdict de recette, la derniere session completee, les preuves de capture et les anomalies a corriger.

## URL de reference

```text
https://preprod.tooltrim.com/fr/selector
```

## Vue back-office

Ouvrir :

```text
https://preprod.tooltrim.com/fr/back-office
```

L'onglet **Preprod** est affiche en premier. Il controle :

- session complete recente ;
- parcours et evenements jusqu'au step final ;
- donnees diagnostic capturees ;
- restitution dashboard creee ;
- job email present quand un email existe.

## Verdict attendu

GO29 est valide si l'onglet **Preprod** affiche :

- `Preprod validee` ;
- aucun echec dans la checklist ;
- une derniere session avec restitution dashboard ;
- aucune anomalie critique sur la nouvelle session de recette.

Les anciennes sessions creees avant correction peuvent rester en anomalie. Elles servent de trace d'incident et ne bloquent pas la validation si la derniere session completee est saine.

## Verification terminal

```bash
npm run validate:preprod-write
npm run validate:go28
```

Le verdict attendu :

```text
GO28 diagnostic write path verdict: PASS
GO28 e2e verdict: PASS
```
