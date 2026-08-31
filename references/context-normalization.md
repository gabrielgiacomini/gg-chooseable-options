# Context Normalization

Use this reference before building a chooseable-options menu.

## Goal

Turn the current conversation state into one normalized routing scenario so the skill can recommend
the best next action without overloading the user or duplicating deeper workflows.

## Two-Layer Awareness Model

### Layer 1: Inventory Awareness

Always start from the project skill index (the generated index your project-local skill manager
publishes). Use it to identify the current skill inventory, likely candidate routes, and whether
the scenario is workflow-shaped, governance-shaped, or specialist-shaped.

### Layer 2: Targeted Routing Awareness

After shortlisting candidate routes, open only the most relevant `skills/*/SKILL.md` files.
Prioritize these surfaces when present:

1. frontmatter `description`
2. `AUTO_TRIGGER_WHEN`
3. `AUTO_SUGGEST_WHEN`
4. `Cross-Skill Coordination`
5. `HANDOFF_OUTPUTS`
6. chooseable-option or closeout sections

Do not preload the full skill corpus unless the routing matrix or the current evidence is clearly
insufficient.

## Scenario Detection Order

Normalize scenarios in this order:

1. `BLOCKING_DECISION`
2. `EXECUTION_ARTIFACT_READY`
3. `MANUAL_QUEUE_ACTIVE`
4. `SKILL_AUTHORING_GOVERNANCE`
5. `SPECIALIST_SURFACE_KNOWN`
6. `EXPLANATION_SURFACE_REQUIRED`
7. `OPEN_ENDED_NEXT_STEP`

Use `CURRENT_EXTERNAL_FACTS_REQUIRED` as an overlay, not as the first scenario. If current external
facts are decisive, keep the current scenario but elevate a research option.

## Scenario Keys

| `SCENARIO_KEY` | Detect when | Minimum evidence | Recommended first route |
| --- | --- | --- | --- |
| `BLOCKING_DECISION` | unresolved blocker, approval, tradeoff, or ambiguous direction | active plan/study/task section; blocker description; current recommendation | `decisions/SKILL.md` |
| `EXECUTION_ARTIFACT_READY` | a durable artifact already recommends a likely next move | artifact path; recommendation summary; known blockers | usually `plan/SKILL.md`, otherwise the specialist direct target |
| `MANUAL_QUEUE_ACTIVE` | the next work is already an ordered checklist or HITL queue | checklist or queue source; current step; verification method | `step-by-step/SKILL.md` |
| `SKILL_AUTHORING_GOVERNANCE` | creating, updating, validating, or publishing skills or guidance | target skill path; namespace; lifecycle/publish surface | project-local skill manager for the relevant namespace |
| `SPECIALIST_SURFACE_KNOWN` | a concrete domain lane is already obvious | domain signal; target app/system; current artifact | direct specialist skill or relevant expert bridge |
| `EXPLANATION_SURFACE_REQUIRED` | the user needs a lower-cognitive-load explanation before choosing a lane | source artifact or code surface; exact question; intended downstream action | `explain/SKILL.md` |
| `OPEN_ENDED_NEXT_STEP` | the user wants guidance but no strong artifact or lane exists | current request; known repo state; weak evidence summary | keep routing; recommend artifact creation or blocker resolution first |

## Route-Selection Rules

1. Prefer blocker resolution before implementation.
2. Prefer durable artifact creation before ad hoc execution when evidence is weak.
3. Prefer project workflow skills over expert skills when the user still needs workflow ownership,
   sequencing, or repo-specific context.
4. Use expert bridges when the domain is clear but the exact expert skill still needs shortlisting.
5. Do not recommend more than one option that does the same job with different wording.
6. When the current artifact already names the downstream skill, honor that route unless new
   evidence contradicts it.

## Tie-Break Rules

When two routes are plausible:

1. prefer the route that resolves uncertainty sooner,
2. prefer the route that creates or uses a durable artifact,
3. prefer the narrower specialist route only when the specialist surface is already explicit,
4. otherwise prefer the workflow route that keeps optionality open.

## Escalation Rules

Escalate instead of continuing lightweight routing when:

- the option space needs richer tradeoff analysis -> `decisions/SKILL.md`
- the work is already an explicit ordered checklist -> `step-by-step/SKILL.md`
- there is not enough evidence to rank next steps confidently -> `study/SKILL.md`
- current external facts are the missing evidence -> `research-online/SKILL.md`

## Output Assembly Rules

1. State the normalized `Current scenario` first.
2. Explain in one short paragraph why the recommended option is first.
3. Present `CHOOSEABLE_OPTIONS` with the recommended option first as SCREAMING_SNAKE_CASE
   tokens with descriptions.
4. Keep the first pass to 3-7 options.
5. Name the downstream owning skill or workflow in every option.
6. In the same turn, invoke the harness Ask User tool when it is available. Mapping is in
   `ask-user-harness.md`.
7. End with `What happens after selection` so the user knows the consequence of choosing the
   recommended route.
