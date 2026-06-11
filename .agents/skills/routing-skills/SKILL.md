---
name: routing-skills
description: Use when working in a skill-rich Codex environment and it is unclear which installed skills apply, what order to use them in, or whether multiple skills should be combined for one task.
---

# Routing Skills

## Overview

Choose the smallest useful set of installed skills for the current request.

This skill is a router. It does not replace the selected skills. It decides:
- which skill should lead
- which supporting skills are actually needed
- what order to use them in

## Do Not Use

Skip this skill when:
- the user explicitly names the skill to use
- one obvious skill already fits with no ambiguity
- you already selected the skill set in this turn

## Hard Rules

1. Never load a large pile of similar skills "just in case".
2. Prefer one process skill and one domain or implementation skill.
3. Process skills come before implementation skills.
4. Domain-specific skills beat generic skills when both fit.
5. Add verification skills before claiming completion.
6. If two skills overlap, choose the narrower one that matches the task.
7. If the session has not yet done skill triage, honor `using-superpowers` before anything else.
8. For Word or DOCX creation, editing, formatting, or template application, prefer `minimax-docx`.
9. Use `documents:documents` only when the user explicitly wants the plugin-driven Word/Google Docs artifact workflow, redlining/comments workflow, or render-and-verify document flow.

## Routing Order

Apply this sequence:

1. Identify the task shape:
   - new feature or behavior change
   - bug, failing test, or unexpected behavior
   - written plan execution
   - review or response to review
   - artifact creation or editing
   - frontend or design work
   - domain-specific migration or workflow

2. Pick the process skill first:
   - `brainstorming` for new builds, behavior changes, or unclear product direction
   - `systematic-debugging` for bugs, failing tests, flaky behavior, build breaks, or regressions
   - `writing-plans` after a design has been approved and implementation planning is needed
   - `subagent-driven-development` when executing an existing implementation plan with mostly independent tasks in the current session
   - `executing-plans` when a written plan should be executed in a separate or more linear flow
   - `dispatching-parallel-agents` when there are 2+ independent problem tracks
   - `planning-with-files` when the task is long, research-heavy, or likely to outgrow the context window

3. Add the domain or implementation skill only if needed.

4. Add the finishing skill near the end:
   - `requesting-code-review` before merge or after major implementation work
   - `receiving-code-review` when acting on review feedback
   - `verification-before-completion` before claiming success
   - `finishing-a-development-branch` when implementation is complete and branch integration choices matter

## Router Table

Use this table to choose the primary skill set.

| Situation | Lead skill | Usually add |
|---|---|---|
| New feature, product change, or behavior change | `brainstorming` | `writing-plans`, then one implementation skill |
| Bug, failing test, flaky behavior, unexpected output | `systematic-debugging` | `test-driven-development`, `verification-before-completion` |
| Existing implementation plan, tasks mostly independent | `subagent-driven-development` | `requesting-code-review`, `verification-before-completion` |
| Existing implementation plan, sequential execution | `executing-plans` | `verification-before-completion` |
| Skill authoring or skill maintenance | `writing-skills` | `skill-creator` |
| CKTS old-to-new migration | `ckts-legacy-migration` | whichever process skill fits the task |
| OpenAI product or API usage | `openai-docs` | `systematic-debugging` if debugging integration issues |
| Existing UI needs polish or redesign | `impeccable` | `redesign-existing-projects` when the request is a broader redesign |
| Net-new frontend or full-stack product surface | `frontend-dev` or `fullstack-dev` | `design-taste-frontend` if design direction is open |
| Need to match a visual reference in code | `image-to-code` | `frontend-dev` |
| Need generated UI directions or mockups | `imagegen-frontend-web` or `imagegen-frontend-mobile` | `design-taste-frontend` |
| Need a general raster image or asset | `imagegen` | none |
| Word or DOCX creation/editing/formatting | `minimax-docx` | `verification-before-completion`; add `documents:documents` only for explicit plugin-driven doc workflows |
| Spreadsheet work | `spreadsheets:Spreadsheets` | `verification-before-completion` |
| Presentation work | `presentations:Presentations` | `verification-before-completion` |
| Android native work | `android-native-dev` | one process skill |
| iOS native work | `ios-application-dev` | one process skill |
| Flutter work | `flutter-dev` | one process skill |
| React Native or Expo work | `react-native-dev` | one process skill |
| GSAP work | matching `gsap-*` skill | one frontend skill |
| NAO context setup, audit, deploy, or rules | matching `setup-context`, `audit-context`, `deploy-context`, `write-context-rules`, or `create-context-tests` | one process skill |

## Similar Skill Tie-Breakers

Use these tie-breakers when several skills look close:

- `impeccable` if improving an existing interface without rebuilding the whole product direction
- `redesign-existing-projects` if the user wants a broader visual overhaul of an existing site or app
- `frontend-dev` if the main work is building or changing the UI itself
- `fullstack-dev` if frontend and backend integration are both central
- `minimax-docx` for `.docx` creation, editing, formatting, or template application
- `documents:documents` only when the request explicitly calls for the plugin-driven Word/Google Docs workflow, redlining/comments management, or render-and-verify artifact flow
- `presentations:Presentations` for slide decks that should be built or edited as real presentation artifacts
- `spreadsheets:Spreadsheets` for workbook creation, edits, or analysis
- `skill-creator` for packaging and structure details of a skill
- `writing-skills` for the actual behavior, trigger, and quality of a skill

## Selection Cap

Default cap: no more than 3 skills for one request unless the task clearly requires a longer chain.

Preferred pattern:
- one process skill
- one domain or implementation skill
- one finishing or verification skill

## Quick Examples

- "I do not know what skill to use for this CKTS migration":
  Use `routing-skills`, then choose `ckts-legacy-migration` plus the right process skill.

- "Fix this flaky React test":
  Use `routing-skills`, then choose `systematic-debugging` and `test-driven-development`.

- "We already have a plan, implement tasks 1 through 4":
  Use `routing-skills`, then choose `subagent-driven-development` if tasks are mostly independent, otherwise `executing-plans`.

- "Create a new skill that helps route other skills":
  Use `routing-skills`, then choose `writing-skills` and `skill-creator`.

- "覆写或修改现有 Word 接口文档":
  Use `routing-skills`, then choose `writing-skills` and `minimax-docx`.

## Final Check

Before proceeding, say which skills you selected and why.

If you cannot justify a selected skill in one sentence, remove it.
