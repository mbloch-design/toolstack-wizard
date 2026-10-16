# ToolTrim — Guide Claude

Lire et appliquer [AGENTS.md](AGENTS.md), référence commune à Codex et Claude pour la stack, les conventions et le workflow. Ne pas recopier ici ces règles : elles doivent rester cohérentes entre les deux agents.

## Reprise du travail

- Lire le suivi actif de [docs/ROADMAP.md](docs/ROADMAP.md), puis la roadmap du chantier concerné.
- Ma Stack et Explorer : [docs/MA_STACK_ROADMAP.md](docs/MA_STACK_ROADMAP.md).
- Diagnostic adaptatif : [ROADMAP_DIAGNOSTIC.md](ROADMAP_DIAGNOSTIC.md) ; `AI_HANDOFF.md` en conserve l'historique technique, sans définir les priorités globales.
- Catalogue : consulter les briefs adaptés dans `docs/`, notamment `CLOUD_RESEARCH_BRIEF.md`, avant une recherche ou un enrichissement.
- Consulter [docs/TODO.md](docs/TODO.md) pour les tâches transverses et [docs/CHANGELOG_AI.md](docs/CHANGELOG_AI.md) pour les livraisons passées. Vérifier les états historiques avant de les présenter comme actuels.

## Hygiène du dépôt

- Mettre à jour le document actif plutôt que créer une copie numérotée ou un nouveau handoff de session.
- Conserver les preuves catalogue et les travaux en cours tant que leur remplacement n'est pas vérifié.
- Retirer les fichiers de travail obsolètes déjà versionnés lorsque leurs références ont été traitées ; Git conserve leur historique.
- Ne jamais embarquer les modifications d'un autre chantier dans un commit de nettoyage.
