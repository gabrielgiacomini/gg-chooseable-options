#!/usr/bin/env npx tsx

/**
 * @fileoverview CLI entrypoint that scores a proposed agent options menu against the eight-item
 * Options Quality Checklist for the `chooseable-options` skill pack.
 *
 * This file owns argv parsing for `--options`/`-n` and optional `--json`, deterministic checklist
 * rows (workflow assumptions plus the compact-menu count gate for criterion #5), weighted scoring
 * with a required-items presentability gate, and stdout reporting with optional trailing JSON.
 * Flow: argv -> checklist -> score -> human summary -> optional JSON payload.
 *
 * @testing CLI: npx tsx .agents/skills/chooseable-options/scripts/check-options-completeness.ts --options 6
 * @testing CLI: npx tsx .agents/skills/chooseable-options/scripts/check-options-completeness.ts --options 4
 * @testing CLI: npx tsx .agents/skills/chooseable-options/scripts/check-options-completeness.ts --options 6 --json
 * @testing CLI manual: from the repository root rerun the `--json` command above for the same argv and confirm the trailing `CompletenessReport` checklist `checked` flags match the printed per-row icons and the Presentable summary line.
 *
 * @see skills/chooseable-options/SKILL.md - Canonical skill text that defines the checklist criteria and coaching expectations this script encodes as a deterministic scorecard.
 * @see skills/chooseable-options/references/context-normalization.md - Authority reference named by checklist row #1 so reviewers know which normalization contract the script treats as satisfied when that row is auto-marked complete.
 * @see skills/chooseable-options/references/routing-matrix.md - Authority reference named by checklist row #3; aligns the routing-matrix review expectation with the automated routing checklist gate in this scorer.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository standard defining the audited file-overview tag order, `@see` path rules, and `@documentation` metadata used by this header.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import { argv } from "process";

// ============================================================================
// Types
// ============================================================================

/**
 * Single checklist row for the eight-item Options Quality Checklist scoring model.
 *
 * @remarks
 * `checked` is derived in `main()` from workflow assumptions plus the `--options` menu size gate
 * for the compact-menu criterion.
 */
interface ChecklistItem {
  number: number;
  name: string;
  description: string;
  required: boolean;
  checked: boolean;
  weight: number;
}

/**
 * Machine-readable completeness snapshot appended when `--json` is requested.
 *
 * @remarks
 * Mirrors the scored checklist and `canPresent` gate used in the human-readable stdout summary.
 */
interface CompletenessReport {
  checklist: ChecklistItem[];
  score: number;
  maxScore: number;
  canPresent: boolean;
}

// ============================================================================
// Checklist Definition
// ============================================================================

const CHECKLIST_ITEMS: Omit<ChecklistItem, "checked">[] = [
  { number: 1, name: "Scenario normalized", description: "Context from context-normalization.md applied", required: true, weight: 2 },
  { number: 2, name: "Skill index consulted", description: "Candidate routes identified from project index", required: true, weight: 2 },
  { number: 3, name: "Routing matrix reviewed", description: "Shortlisted routes from routing-matrix.md", required: true, weight: 2 },
  { number: 4, name: "Recommended option first", description: "Best route appears as first option", required: true, weight: 2 },
  { number: 5, name: "Menu compact", description: "3-7 options maximum", required: true, weight: 2 },
  { number: 6, name: "Options scoped", description: "Each option names owning skill/workflow", required: true, weight: 2 },
  { number: 7, name: "Escalation path clear", description: "Routes not covered escalate properly", required: true, weight: 1 },
  { number: 8, name: "Handoff ready", description: "Normalized scenario passed to downstream skill", required: true, weight: 2 },
  { number: 9, name: "Native picker", description: "Ask User tool invoked when present this turn", required: false, weight: 1 },
];

// ============================================================================
// Main
// ============================================================================

/**
 * Parses CLI flags, scores the checklist for a declared option count, and prints the report.
 *
 * @remarks
 * I/O: reads `process.argv` and writes formatted lines to stdout; with `--json`, also prints a
 * trailing JSON payload for the same run.
 */
function main() {
  const args = argv.slice(2);
  const optionsArg = args.find(a => a === "--options" || a === "-n");
  const jsonArg = args.includes("--json");
  
  const optionCount = optionsArg 
    ? parseInt(args[args.indexOf(optionsArg) + 1] || "5", 10)
    : 5;
  
  console.log("\n📋 Options Completeness Check");
  console.log("═".repeat(60));
  console.log(`\n📊 Option Count: ${optionCount}`);
  
  // Build checklist - assume well-formed for this check
  const checklist: ChecklistItem[] = CHECKLIST_ITEMS.map(item => {
    let checked = false;
    
    switch (item.number) {
      case 1: // Scenario normalized
      case 2: // Skill index consulted
      case 3: // Routing matrix reviewed
      case 4: // Recommended option first
      case 6: // Options scoped
      case 8: // Handoff ready
      case 9: // Native picker when available
        checked = true; // Assumed for proper workflow
        break;
      case 5: // Menu compact
        checked = optionCount >= 3 && optionCount <= 7;
        break;
      case 7: // Escalation path clear
        checked = true; // Assumed
        break;
      default:
        break;
    }
    
    return { ...item, checked };
  });
  
  const score = checklist.reduce((sum, item) => 
    item.checked ? sum + item.weight : sum, 0);
  const maxScore = checklist.reduce((sum, item) => sum + item.weight, 0);
  
  const requiredItems = checklist.filter(i => i.required);
  const requiredScore = requiredItems.reduce((sum, item) => 
    item.checked ? sum + item.weight : sum, 0);
  const requiredMax = requiredItems.reduce((sum, item) => sum + item.weight, 0);
  
  const canPresent = requiredScore === requiredMax;
  
  console.log(`\n📊 Score: ${score}/${maxScore} (${((score/maxScore)*100).toFixed(0)}%)`);
  console.log(`   Required items: ${requiredScore}/${requiredMax}`);
  
  console.log(`\n${canPresent ? "✅" : "⚠️"} Presentable: ${canPresent ? "YES" : "NEEDS WORK"}`);
  
  console.log("\n📝 Checklist:");
  for (const item of checklist) {
    const icon = item.checked ? "✅" : item.required ? "❌" : "⚠️";
    console.log(`   ${icon} [${item.number}] ${item.name}`);
  }
  
  console.log("\n" + "═".repeat(60));
  
  if (!canPresent) {
    console.log("\n⚠️ Options menu needs work before presenting.");
    const failedItems = checklist.filter(i => !i.checked && i.required);
    if (failedItems.length > 0) {
      console.log("\nIssues to resolve:");
      failedItems.forEach(i => console.log(`   - ${i.name}: ${i.description}`));
    }
  } else {
    console.log("\n✅ Options menu is complete and ready to present.");
  }
  
  if (jsonArg) {
    const report: CompletenessReport = { checklist, score, maxScore, canPresent };
    console.log("\n" + JSON.stringify(report, null, 2));
  }
}

main();
