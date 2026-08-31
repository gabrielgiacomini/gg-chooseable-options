# Native Ask-User Presentation

`SKILL.md` owns when to present options. This file owns **how** to map `CHOOSEABLE_OPTIONS` onto the current harness's Ask User tool.

Always print the SCREAMING_SNAKE_CASE list in chat. Also call the native picker **in the same turn** when a matching tool is in this turn's tool list. If no matching tool is present, the printed list is the complete path — do not invent a tool.

## Detect the tool this turn

Inspect the tools available in **this** turn. Use the first match:

| Tool name (any of these) | Typical harness | Call it |
| --- | --- | --- |
| `AskUserQuestion` | Claude Code, Kimi Code CLI | yes |
| `ask_user_question` | Grok Build TUI, Codex CLI (when the TUI exposes it) | yes |
| `AskQuestion` | Cursor Agent / Plan mode when present | yes |
| `AskUser` / `Question` | other TUIs that expose a structured choice tool | yes |

If none of those names appear, skip the picker.

Do not call the picker in non-interactive / print / CI / `--yolo` auto-answer sessions when the harness would auto-select or hide the tool. Printed tokens remain valid there.

## Shared mapping (every harness)

Build the picker from the same option set as the printed list.

- **Question text:** one sentence, end with `?`. Example: `What should we do next?`
- **Recommended first.** Append `(Recommended)` to that option's **label**.
- **Label:** 1–5 words, human-readable. Do not put the raw token as the only label.
- **Description:** start with the exact token, then the same description as the printed list. Example: `IMPLEMENT_FULL_PLAN — Apply the documented file changes via plan.`
- **Mutually exclusive next steps:** `multiSelect` / `multi_select` = false.
- **Do not add an Other/custom row.** Most harnesses inject it.
- **Map the answer back** to the token from the description (or from the label if the user picked Other and typed a token).

If the harness caps options below the printed menu size, put the recommended option plus the next most important options into the picker and keep the **full** 3–7 list in chat.

## Harness call shapes

Use the live tool schema when it differs. These are the common shapes.

### Claude Code — `AskUserQuestion`

1–4 questions. 2–4 options per question. `header` max 12 characters. `multiSelect` boolean.

```json
{
  "questions": [
    {
      "question": "What should we do next?",
      "header": "Next step",
      "options": [
        { "label": "Implement plan (Recommended)", "description": "IMPLEMENT_FULL_PLAN — Apply the documented file changes via plan." },
        { "label": "Resolve decisions", "description": "RESOLVE_DECISIONS_FIRST — Route blockers through decisions." },
        { "label": "Explain visually", "description": "EXPLAIN_PLAN_VISUALLY — Produce an HTML explanation via explain." }
      ],
      "multiSelect": false
    }
  ]
}
```

Optional `preview` on an option only when the harness asks for it.

### Kimi Code CLI — `AskUserQuestion`

Same family as Claude. Field is `multi_select` (snake_case). `header` max 12 characters. 1–4 questions, 2–4 options. Other is automatic.

```json
{
  "questions": [
    {
      "question": "What should we do next?",
      "header": "Next step",
      "options": [
        { "label": "Implement plan (Recommended)", "description": "IMPLEMENT_FULL_PLAN — Apply the documented file changes via plan." },
        { "label": "Deepen study", "description": "DEEPEN_STUDY_FINDINGS — Bounded deepening via study." }
      ],
      "multi_select": false
    }
  ]
}
```

Kimi Web shows a dialog that replaces the input box; multiple questions become tabs.

### Grok Build TUI — `ask_user_question`

No `header`. Options have `label`, `description`, optional `preview`. `multi_select` on the question. Other is automatic.

```json
{
  "questions": [
    {
      "question": "What should we do next?",
      "options": [
        { "label": "Implement plan (Recommended)", "description": "IMPLEMENT_FULL_PLAN — Apply the documented file changes via plan." },
        { "label": "Explain visually", "description": "EXPLAIN_PLAN_VISUALLY — Produce an HTML explanation via explain." }
      ],
      "multi_select": false
    }
  ]
}
```

### Codex CLI — `ask_user_question` when listed

Recent Codex TUI adds `ask_user_question` with a tabbed prompt (one tab per question plus Submit). Options are constrained choices; a custom option may exist. If the tool is **not** in this turn's list, print tokens only.

### Cursor — `AskQuestion` when listed

Plan mode commonly has it; Agent mode is inconsistent. If `AskQuestion` is in the tool list, call it with the same question + options mapping. If it is absent, print tokens only.

### Pi, Crush, Goose, OpenCode, Qwen, dsh, and others

No first-party picker unless this turn's tool list includes one of the names above (or an MCP equivalent such as `ask_user`). Default to the printed list.

## Common use cases

Call the picker (and print the list) in these situations. One question unless the user must answer two independent choices.

| Situation | Question | Typical tokens in the picker |
| --- | --- | --- |
| Study just written | `What should we do after this study?` | `WRITE_IMPLEMENTATION_PLAN`, `DECIDE_OPEN_QUESTIONS`, `DEEPEN_STUDY_FINDINGS`, `RESEARCH_ONLINE_BEST_PRACTICES`, `EXPLAIN_FINDINGS_VISUALLY` |
| Plan closeout | `How should we continue this plan?` | `IMPLEMENT_FULL_PLAN`, `RESOLVE_DECISIONS_FIRST`, `EXPLAIN_PLAN_VISUALLY`, `DEEPEN_PLAN_FIRST` |
| Spec set complete | `What should we generate from these specs?` | `GENERATE_IMPLEMENTATION_PLAN`, `GENERATE_DEEP_DIVE_STUDY`, `GENERATE_ONLINE_RESEARCH`, `GENERATE_SPEC_COMPARISON` |
| Open-ended "what next?" | `What should we do next?` | recommended route first, then 2–4 alternatives from the routing matrix |
| Explain HTML delivered | `What should we do with this explanation?` | `PREPARE_IMPLEMENTATION_PLAN`, `RESOLVE_COMPETING_APPROACHES`, `DEEPEN_RESEARCH_WITH_ONLINE_STUDY` |
| Research session done | `What should we do with these findings?` | `PREPARE_IMPLEMENTATION_PLAN`, `DEEPEN_RESEARCH_WITH_ONLINE_STUDY`, `RESOLVE_COMPETING_APPROACHES` |
| Skill / guidance work | `What skill work should we do next?` | authoring, review, or publish tokens from the project skill manager |
| Two independent choices | two questions in one call (only if both must be answered) | example: next workflow **and** whether to publish artifacts |

If the choice is a blocking tradeoff with behavioral diffs, do **not** stretch this picker — escalate to `decisions/SKILL.md`.
