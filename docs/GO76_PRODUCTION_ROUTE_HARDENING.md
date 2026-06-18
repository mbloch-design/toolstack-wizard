# GO76 - Durcissement des routes de production

## Problème traité

Plusieurs anciens liens pouvaient encore pointer vers `/diagnostic`, `/audit` ou
une route non localisée. Cela créait des erreurs ou entretenait la coexistence
perçue entre plusieurs diagnostics.

## Décisions

- `/selector`, `/diagnostic` et `/audit` redirigent vers `/fr/selector`.
- `/:lang/diagnostic` et `/:lang/audit` redirigent vers `/:lang/selector`.
- La route canonique du tunnel reste `/:lang/selector`.
- Les anciennes pages de résultats restent disponibles pour ne pas casser les
  liens historiques, mais elles ne sont pas utilisées par le tunnel V2.

## Critère de réussite

Tous les CTA connus conduisent au même diagnostic guidé, en français ou en anglais.
