# Usage module structure

User requests implementation of a full state/layout revision; standing instruction is to work through verification and push. Preserve fixed outer height, blue/peach identity, accessible radios, immediate local save and explicit advance.

## Design decision
Use one aligned, bounded inner column (max 640px), with header, scrollable scene and persistent footer. Group price with tool identity. Five ascending rounded meter bars share a baseline and equal whole-column hit areas. Peach means unselected; the selected bar/label are blue with a check, lower selected-range bars light blue. Pictograms move to the reserved interactive feedback area. User explicitly rejected icon tiles and the question headline; keep the module label Vos usages. Preserve humorous captions and reduced-motion support. Avoid a slider (discrete named answers) and giant option tiles (height contract).

Question header shows tool position, not answered count. Summary shows recorded answer count. Left footer is pause/summary; right is a fixed previous control plus advance or skip. Previous is disabled at the first tool without removing its slot. Unanswered questions use Skip as the right action; saved answers use Next/Finish. Summary/history use a single right primary action and left secondary actions. Summary/history/empty states retain the same alignment and envelope. Summary must list each tool and answer/missing value with direct correction, not just congratulate.

## Implementation
1. Add failing component regressions: question position independent of answers, permanent previous slot, pause available before answer, coherent summary action hierarchy. Retain existing persistence/keyboard tests.
2. Refactor StackUsageReview markup/navigation slots and mu-* CSS in index.css. Do not modify money/account state or pair decisions.
3. Extend actual account route tests with radio surface/marker geometry, bounded group, identity-price grouping and stable footer anchors across states. Run FR/EN phone/tablet/desktop/short viewport, long content, doubled text, history, account/save regressions. Inspect actual screenshots.
4. Update DESIGN_SYSTEM, active usage acceptance and CHANGELOG_AI. Run app types, tests, design validation, production build; independent review then scoped commit/push. Verify deployment separately.

## Review focus
- 5 answers recorded while reviewing first tool must not read as step5/5.
- Missing prior answers remain missing when finishing; pause never fabricates or cancels saved answers.
- 320px and doubled text: no overlapping footer, scene scrolls without outer resize.
- Selected marker remains distinct from hover, keyboard focus and peach decoration.
- Empty, partial, complete and history have one primary destination, no equal-weight button wall.
