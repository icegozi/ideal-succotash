---
trigger: always_on
description: "Mandatory project workflow: read persistent project memory before planning or coding, preserve user corrections and coding conventions, inspect existing architecture before changes, verify implementation, and update memory with reusable knowledge."
---

# Project Memory & Coding Workflow

You are working inside an existing software project.

Your primary responsibility is not only to complete the current task, but also to preserve project consistency across future tasks.

The project uses `MEMORY.md` as persistent project memory.

---

# 1. MEMORY MUST BE READ FIRST

## Critical Rule

Before doing ANY of the following:

- creating an implementation plan;
- proposing an architecture;
- modifying code;
- creating a new file;
- refactoring existing code;
- fixing a bug;
- implementing a feature;
- changing database structure;
- changing API behavior;
- changing UI behavior;
- suggesting a technical solution that depends on the current project;

you MUST first read:

`MEMORY.md`

Do not create an implementation plan before reading the memory file.

Do not start coding before reading the memory file.

If `MEMORY.md` does not exist:

1. Inspect the project structure.
2. Create `MEMORY.md`.
3. Add only confirmed project information.
4. Continue the normal workflow.

Never invent project conventions merely to populate the memory file.

---

# 2. MEMORY IS PERSISTENT PROJECT KNOWLEDGE

`MEMORY.md` exists to preserve information that future agents/tasks should know.

Memory should contain durable project-specific knowledge such as:

- architecture decisions;
- coding conventions;
- naming conventions;
- folder structure decisions;
- database conventions;
- API conventions;
- frontend conventions;
- business rules;
- important implementation constraints;
- non-obvious technical decisions;
- recurring bugs and their root causes;
- user preferences related to code;
- patterns that must be reused;
- patterns that must NOT be used;
- compatibility requirements;
- lessons learned from previous implementations.

Memory is NOT a task log.

Do not fill memory with temporary implementation details that will never matter again.

---

# 3. USER CORRECTIONS MUST BE SAVED

This is a mandatory rule.

Whenever the user corrects, reminds, rejects, or explicitly requests a particular implementation style, determine whether that correction can affect future development.

Examples:

- "Không code theo kiểu này."
- "Project này không dùng repository pattern."
- "Dùng Service thay vì viết logic trong Controller."
- "Không dùng raw SQL."
- "Tên biến phải theo snake_case."
- "Không tạo component mới nếu component hiện tại có thể tái sử dụng."
- "Phải giữ coding style giống code cũ."
- "Không sửa file generated."
- "Không tự ý thay đổi database schema."
- "API response phải theo format hiện tại."
- "Không dùng any trong TypeScript."
- "Phải dùng Form Request để validate."
- "Không query trong vòng lặp."
- "Logic này phải đặt ở domain/service layer."

When this happens:

1. Apply the correction immediately to the current task.
2. Check whether the correction is reusable in future tasks.
3. If reusable, update `MEMORY.md`.
4. Record the rule clearly and concisely.
5. Avoid saving the same rule multiple times.

A user correction has higher priority than an older conflicting memory entry.

If a correction invalidates an existing memory rule, update the old rule instead of appending contradictory information.

---

# 4. MEMORY UPDATE FORMAT

When adding an important rule or lesson, prefer this format:

```md
## Coding Conventions

### Controllers
- Keep controllers thin.
- Business logic belongs in Services.
- Validation must use Form Request classes.

### Database
- Do not introduce raw SQL unless existing ORM/query-builder approaches cannot solve the requirement.
- Preserve existing naming conventions.

### Frontend
- Reuse existing components before creating new components.

## User Corrections

### 2026-10-04 — Controller architecture
- User explicitly requested that business logic must not be placed directly in controllers.
- Use Service classes following the existing project architecture.
```

Keep entries short.

Store the decision, not the entire conversation.

---

# 5. NEVER STORE SECRETS IN MEMORY

Never write any of the following into `MEMORY.md`:

- passwords;
- API keys;
- access tokens;
- refresh tokens;
- private keys;
- secret keys;
- authentication cookies;
- `.env` values;
- production credentials;
- database passwords;
- personally sensitive credentials.

If a task exposes a secret, do not preserve it in project memory.

You may record non-sensitive structural information such as:

```md
- Authentication configuration is stored in `.env`.
```

But never copy the actual value.

---

# 6. CURRENT CODE IS THE SOURCE OF IMPLEMENTATION TRUTH

Memory provides context, but it may become outdated.

Before changing code:

1. Read `MEMORY.md`.
2. Inspect the relevant source files.
3. Inspect nearby implementations of similar functionality.
4. Inspect related models, services, controllers, components, tests, migrations, schemas, routes, or configuration.
5. Compare memory against the actual codebase.

Never blindly implement something solely because it appears in memory.

If memory conflicts with the current code:

- investigate the reason;
- prefer confirmed current project behavior unless the user explicitly instructs otherwise;
- update stale memory after the correct behavior is established.

---

# 7. DO NOT PLAN FROM ASSUMPTIONS

Before writing an implementation plan, inspect enough code to understand:

- where the change belongs;
- existing architecture;
- dependency direction;
- reusable classes/components/functions;
- naming patterns;
- data flow;
- business rules;
- validation;
- error handling;
- test strategy;
- possible side effects.

A plan based only on filenames or assumptions is not acceptable.

---

# 8. SEARCH FOR EXISTING IMPLEMENTATIONS FIRST

Before creating something new, search the codebase for similar functionality.

Examples:

Before creating:

- a Service → search existing Services;
- a Controller → inspect similar Controllers;
- a Form Request → inspect existing validation patterns;
- a Vue/React component → search reusable components;
- an API endpoint → inspect existing endpoints;
- a migration → inspect related schema conventions;
- a helper → search existing utilities;
- a repository → check whether the project actually uses repositories;
- a new dependency → verify whether an existing dependency already solves the problem.

Prefer consistency over unnecessary abstraction.

Prefer reuse over duplication.

---

# 9. MINIMIZE UNNECESSARY CHANGES

Implement the smallest safe change that fully solves the requested problem.

Do not:

- refactor unrelated code;
- rename unrelated variables;
- reformat unrelated files;
- change architecture unnecessarily;
- introduce new libraries without need;
- replace working implementations merely because another approach looks cleaner;
- modify generated files unless explicitly required;
- change public behavior outside the requested scope.

Preserve backwards compatibility unless the task explicitly requires breaking behavior.

---

# 10. RESPECT EXISTING CODE STYLE

Before writing code, inspect nearby files and follow their style.

Match:

- naming;
- formatting;
- method organization;
- class organization;
- error-handling patterns;
- validation patterns;
- return types;
- dependency injection style;
- comments;
- test style;
- folder structure.

Do not impose a generic coding style over an established project convention.

If the user explicitly defines a style, follow the user-defined style and record durable rules in memory.

---

# 11. DO NOT OVERENGINEER

Avoid introducing:

- unnecessary design patterns;
- unnecessary interfaces;
- unnecessary abstraction layers;
- premature generic solutions;
- unnecessary dependencies;
- excessive helper classes;
- unnecessary configuration;
- speculative functionality.

Implement for the actual requirement and the existing architecture.

Only introduce an abstraction when it solves a real architectural or maintainability problem.

---

# 12. PRESERVE BUSINESS RULES

Before modifying business logic, identify existing business rules.

Never silently remove, weaken, or reinterpret an existing rule.

When the requested change appears to conflict with an existing business rule:

1. inspect related code;
2. inspect memory;
3. identify the conflict;
4. follow the latest explicit user requirement;
5. update memory if the business rule has intentionally changed.

---

# 13. DATABASE CHANGES REQUIRE EXTRA CARE

Before making database changes:

- inspect existing migrations;
- inspect models/entities;
- inspect indexes;
- inspect foreign keys;
- inspect nullable/default behavior;
- inspect existing production-compatible patterns.

Do not casually:

- drop columns;
- rename columns;
- change column types;
- remove indexes;
- remove constraints;
- modify historical migrations already used in deployed environments.

Prefer backward-compatible migrations.

---

# 14. DO NOT MODIFY PUBLIC CONTRACTS ACCIDENTALLY

Treat the following as contracts:

- API response structures;
- API request structures;
- database schemas used externally;
- event payloads;
- queue payloads;
- command arguments;
- exported types;
- component props/events;
- configuration keys;
- environment variable names.

Do not change them unless the requirement explicitly calls for it.

---

# 15. VERIFY AFTER IMPLEMENTATION

Coding is not complete when the code has merely been written.

After implementation, perform the relevant verification available in the project.

Examples:

```text
lint
type-check
unit tests
feature tests
integration tests
build
framework validation
static analysis
migration validation
```

When practical, also inspect the final diff.

Check specifically for:

- accidental unrelated changes;
- missing imports;
- dead code;
- duplicated logic;
- inconsistent naming;
- incorrect nullable handling;
- unhandled edge cases;
- broken types;
- incorrect validation;
- regressions.

Never claim a test passed unless it was actually executed successfully.

---

# 16. MEMORY MUST BE UPDATED AFTER IMPORTANT DISCOVERIES

After implementation, determine whether something was learned that would help future work.

Update `MEMORY.md` when you discover:

- an undocumented architectural convention;
- an important business rule;
- a surprising dependency;
- a recurring pitfall;
- a non-obvious root cause;
- a project-specific workaround;
- an important compatibility constraint;
- a user correction;
- a coding convention that should remain consistent.

Do not update memory merely because files changed.

Memory captures reusable knowledge, not implementation history.

---

# 17. DO NOT DUPLICATE MEMORY

Before adding a memory item:

1. Search the existing `MEMORY.md`.
2. Check whether the same idea already exists.
3. Update or extend the existing entry if necessary.
4. Add a new entry only when it adds new knowledge.

Avoid multiple contradictory descriptions of the same rule.

---

# 18. MEMORY CONFLICT RESOLUTION

When instructions conflict, use this decision order:

Current explicit user requirement
↓
Applicable Antigravity project/directory rules
↓
Confirmed current project architecture and behavior
↓
Project `MEMORY.md`
↓
General coding best practices

A newer explicit user correction overrides an older project-memory preference.

Do not allow stale memory to override the current requirement.

---

# 19. IMPLEMENTATION WORKFLOW

For every coding task, follow this lifecycle:

```text
READ MEMORY
      ↓
UNDERSTAND USER REQUIREMENT
      ↓
INSPECT RELEVANT CODE
      ↓
SEARCH EXISTING IMPLEMENTATIONS
      ↓
IDENTIFY BUSINESS / ARCHITECTURE CONSTRAINTS
      ↓
CREATE IMPLEMENTATION PLAN
      ↓
IMPLEMENT MINIMAL SAFE CHANGE
      ↓
RUN RELEVANT VERIFICATION
      ↓
REVIEW DIFF / SIDE EFFECTS
      ↓
UPDATE MEMORY IF REUSABLE KNOWLEDGE WAS LEARNED
      ↓
REPORT RESULT
```

Do not skip directly from the user request to implementation when repository inspection is required.

---

# 20. PLAN REQUIREMENTS

Implementation plans must reference actual project structure discovered during inspection.

A good plan should identify:

```text
files/modules affected
existing implementation to reuse
changes required
database/API impact
edge cases
verification strategy
```

Do not produce generic plans such as:

```text
1. Create backend.
2. Create frontend.
3. Test.
```

Plans must reflect the real repository.

---

# 21. STOP REPEATING PREVIOUS MISTAKES

If the user previously corrected an implementation mistake and that correction is recorded in memory, you must actively check for that mistake before completing similar future tasks.

Example:

If memory contains:

```md
- Do not put business logic directly inside controllers.
```

then every future controller-related task must actively verify that the new code respects this rule.

Memory is not merely documentation.

Memory must influence implementation decisions.

---

# 22. COMMENTS AND DOCUMENTATION

Do not add comments that merely restate obvious code.

Add comments only when they explain:

- why a non-obvious solution exists;
- business constraints;
- compatibility requirements;
- unusual implementation decisions;
- workarounds.

Prefer readable code over excessive comments.

---

# 23. WHEN REQUIREMENTS ARE AMBIGUOUS

First inspect:

- memory;
- existing implementation;
- related tests;
- analogous functionality.

Infer behavior from established project patterns when reasonably safe.

Do not invent business requirements.

When ambiguity materially changes business behavior or could cause destructive changes, explicitly surface the uncertainty before making an irreversible decision.

---

# 24. DESTRUCTIVE OPERATIONS

Never perform destructive operations casually.

Examples:

```text
DROP TABLE
DELETE without a safe condition
force push
reset --hard
removing production data
deleting migrations
rewriting large areas of working code
```

Confirm intent when the requested operation is destructive and the expected outcome is not already explicit.

Always prefer reversible changes.

---

# 25. FINAL RESPONSE AFTER CODING

When reporting completed coding work, keep the report concise but include:

```text
What changed
Important implementation decisions
Files affected
Verification performed
Anything not verified
Memory updated, when applicable
```

Do not describe work as complete if critical verification failed.

---

# CORE PRINCIPLE

The project should become easier to maintain after every task, not harder.

Always:

**remember before planning, inspect before coding, reuse before creating, verify before declaring completion, and preserve important lessons for future tasks.**
