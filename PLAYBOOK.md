# The Loopy Implementation Playbook

**A Practical Guide for Companies Adopting Loopy OSS and loopythinking.ai**

Version 1.0 — May 2026

Maintained by Loopy Thinking. Distributed under Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0). Feel free to copy, adapt, and republish — please attribute and keep derivatives open.

---

## How to Read This Playbook

This Playbook is written for the executive who has to decide *whether* to bring Loopy into their organization, and the cross-functional team that has to make it work *after* the decision has been made. It is opinionated. It assumes you are a serious operator who would rather hear "this is the wrong week to start" than "everything is possible."

It is structured in eleven Parts. Parts I and II are strategic — read them first if you are still deciding. Parts III through VII are operational — read them when you are committed and want to plan. Parts VIII through X are reference material — read them when you are building, measuring, or troubleshooting. Part XI is the toolkit — copy the templates, adapt them to your organization, and reuse them.

You do not have to read it linearly. Each Part stands on its own, with its own checklists and worksheets. We have written it so that an HR director can read Parts III, V, and VII without needing the technical chapters, and so that a CTO can read Parts III, V, and VIII without needing the change-management chapters. There is some intentional repetition between Parts so that each can be lifted independently.

Where you see the symbol **▶**, that is a checklist or action you should be ready to execute. Where you see **❖**, that is a template you can copy. Where you see **⚠**, that is a known pitfall you should plan against. Where you see a **CASE STUDY** callout, that is a composite from real Loopy deployments — names changed, patterns preserved.

If you are short on time, read the **Executive Summary** below and skip directly to the **Pre-Flight Checklist** at the end of Part III.

---

## Executive Summary

**Situation.** Every organization is now feeling the pull of agentic AI. Pilots are everywhere; production deployments are rare. The companies that are getting real leverage are not the ones with the most models or the most automations. They are the ones who have figured out how to make AI-driven work *legible* — visible, governed, measured, and connected to outcomes.

**Complication.** Most AI deployments fail not because the technology is bad, but because the organization cannot see what the AI is doing, cannot audit its decisions, cannot quantify its contribution, and cannot adapt human roles around it. The result is a stack of disconnected agents, a leadership team that does not trust the output, and a workforce that quietly fears displacement. None of those problems are solved by buying more models.

**Question.** What does it take to deploy AI agents in a way that is auditable, governable, and trusted by the people whose work they are augmenting — and to do it without becoming locked into a single vendor's stack?

**Answer.** You make work *loop-shaped*. You instrument every meaningful unit of work — perception, interpretation, decision, action, reflection — as a Loop with a clear owner, signals, and a confidence score. You let agents and humans contribute to the same Loops, side by side, with the same evidence trail. You measure the AI's contribution in hours liberated (the Productivity Liberation Index, or IPL), not in tokens consumed. And you do it on infrastructure you can self-host, under a license that protects the commons (AGPL v3), with bring-your-own-key access to whichever model you trust on whichever day.

This Playbook tells you how. It is opinionated about what to do in the first 90 days, what to do before you write a single line of code, who needs to be in the room, what to tell the workforce, what to measure, and what to retire. It is designed to be useful to operators in companies of 50 to 50,000 people. It is designed to be forked.

The five things you will get right if you follow it:

1. You will start with **fewer Loops than you think you need** — three to five — and prove value before scaling.
2. You will build a **Loopy Council** of seven roles before you install anything, because governance is not a phase, it is a precondition.
3. You will publish an **AI Contribution Charter** to your workforce in the first 30 days, so people understand what is being amplified and what is being protected.
4. You will instrument the **IPL** and the **Confidence Index** from Loop one, because metrics you bolt on later are metrics you do not trust.
5. You will plan the **role evolution** for at least three job families before the first agent ships, because the change-management failure mode is not resistance — it is silence followed by attrition.

The rest of this document is the *how*.

---

## Table of Contents

- [Part I — Foundations & Concepts](#part-i--foundations--concepts)
- [Part II — Strategic Readiness](#part-ii--strategic-readiness)
- [Part III — Pre-Implementation: Days -90 to 0](#part-iii--pre-implementation-days--90-to-0)
- [Part IV — Phased Rollout](#part-iv--phased-rollout)
- [Part V — Role-by-Role Guides](#part-v--role-by-role-guides)
- [Part VI — Operations & Governance](#part-vi--operations--governance)
- [Part VII — People & Culture](#part-vii--people--culture)
- [Part VIII — Technical Deep-Dive](#part-viii--technical-deep-dive)
- [Part IX — Measuring Success](#part-ix--measuring-success)
- [Part X — Risks, Pitfalls & Anti-Patterns](#part-x--risks-pitfalls--anti-patterns)
- [Part XI — Templates & Appendices](#part-xi--templates--appendices)

---

# Part I — Foundations & Concepts

## 1.1 The Thesis: From Automation to Amplification

Most AI strategy decks start from a single hidden assumption — that the goal of agentic AI is to *replace* tasks. That assumption produces a predictable failure pattern: the organization buys a tool, automates a few clear tasks, declares victory, then loses the gains within a year because the surrounding human work erodes around the automation, edge cases pile up, audit trails fragment, and the people who used to own the work no longer understand it.

Loopy starts from a different assumption. The goal is **amplification**, not replacement. The unit of value is not a task automated — it is an *hour of human cognition liberated and redirected to higher-leverage work*. Loopy measures this directly with the **Productivity Liberation Index (IPL)** — every Loop reports how many hours of human work the AI executed against a baseline of 180 hours per month per knowledge worker.

This framing changes every downstream decision:

- You design Loops around *cognitive work*, not tasks.
- You measure success in *hours liberated and redirected*, not tasks completed.
- You preserve human judgment at the points where it is most valuable, and amplify human throughput everywhere else.
- You explicitly plan for the redeployment of liberated hours, instead of pretending the gains will magically convert into headcount savings.

If you do not adopt this framing, the rest of the Playbook will not work. It is not decoration; it is the foundation.

## 1.2 What Loopy Is, Concretely

Loopy is two things in one product family.

**loopythinking.ai** is the managed cloud product. It provides multi-tenant hosting, integrated identity, the Team Loopy governance agents (Nova, Atlas, Vega, Echo, Orion), pre-built integrations to the major business systems (Slack, Microsoft 365, Google Workspace, common CRMs, common ticketing tools), and a shared marketplace of skills and connectors.

**Loopy OSS** is the open-source core. It is released under AGPL v3 from `github.com/LoopyThinking/loopy-oss`. It contains the Loop protocol, the agent SDK, the database schema, the API, the web app, the Cowork plugin, and the skills library. It is designed to be self-hosted on infrastructure you control, with bring-your-own-key (BYOK) access to whichever LLM provider you choose. It is suitable for organizations that need data residency, sovereignty, or an air-gapped deployment.

The same protocol runs both. A Loop created in a self-hosted Loopy OSS instance is structurally identical to a Loop created in loopythinking.ai. Skills and agents are portable between them. This means you can pilot in the cloud and migrate to self-hosted without rewriting your work, or vice versa.

This Playbook is *agnostic* about which version you choose. The strategic, organizational, HR, and governance work is identical. The technical and security work differs only in Part VIII.

## 1.3 The Five Cognitive Layers

All Loops are mapped to one of five cognitive layers. These layers are deliberately borrowed from cognitive science because they describe what humans actually do at work — and because once you map work this way, it becomes obvious where to amplify and where to keep humans firmly in control.

**Perception.** Sensing what is happening. *"Is anything new in the inbox? Did a customer churn? Did the build break? What did our competitor announce?"* Perception Loops are mostly amplifiable. AI agents are excellent at noticing things at scale, in parallel, and without fatigue.

**Interpretation.** Making sense of what was perceived. *"Is this an emergency or a routine update? Does this anomaly matter? What does this metric mean?"* Interpretation Loops are partially amplifiable. AI is good at proposing interpretations; humans should still validate the ones that lead to consequential action.

**Decision.** Choosing a course of action. *"Do we ship this? Do we hire this candidate? Do we approve this discount?"* Decision Loops are usually human-led, AI-supported. The agent prepares the option set, surfaces the evidence, flags the trade-offs. The human still chooses — and the choice is logged with its reasoning so the next Loop can learn from it.

**Action.** Executing the decision. *"Send the email. Update the CRM. File the ticket. Schedule the meeting."* Action Loops are highly amplifiable. The risk profile depends on reversibility — undoable actions can be fully delegated; irreversible ones (transfers, terminations, public announcements) should be queued for human confirmation.

**Reflection.** Learning from the outcome. *"Did the campaign work? Was the hire successful? Did the decision pay off?"* Reflection Loops are partially amplifiable. AI is excellent at structured retrospectives across many Loops in parallel; humans add context the agent cannot see.

The discipline is to *name the layer* before you build the Loop. A Loop without a layer is a wish list. A Loop with a layer has clear expectations about where the human stays in the seat and where the agent takes the wheel.

## 1.4 Loops, Work Signals, and the Anatomy of a Loop

A **Loop** is the atomic unit of operational work in Loopy. Concretely, a Loop is a record with:

- A **name** and a **description**.
- A **cognitive layer** (one of the five above).
- An **owner** (a human, an agent, or a team).
- A **scope** (personal, team, organizational).
- A **set of inputs** — data sources, triggers, integrations.
- A **set of outputs** — what the Loop produces and where it goes.
- A **stream of Work Signals** — the time-series of activity within the Loop.
- A **confidence score** (the Confidence Index, see §1.6).
- An **IPL contribution** — the hours of human work this Loop has liberated.
- A **status** — active, paused, retired.

A **Work Signal** is a single event inside a Loop — *"the agent generated a draft," "the human approved the draft," "a new record arrived from the CRM," "the customer responded."* Work Signals are the audit trail. Every action by every actor — human or agent — produces a signal. This is what makes Loopy *legible*: there is no opaque step, no hidden hand-off, no "the agent did something, we are not sure what."

The discipline of defining Loops well is the most underrated skill in a Loopy implementation. Most failed implementations have Loops that are too big ("Customer Success") or too small ("Send daily report"). The right size is a unit of work that has a single clear owner, a single clear outcome, and a meaningful number of repetitions per month — typically between five and five hundred.

## 1.5 The IPL — Productivity Liberation Index

The IPL is the principal outcome metric for Loopy. It answers a single question: *"How many hours of human work did the AI execute on my behalf this month?"*

The mechanics are simple. The baseline is 180 hours per month per knowledge worker. Every Loop reports the AI's contribution as hours liberated. A Loop where the agent drafts five customer emails per day, each saving the human ten minutes, contributes roughly 16.7 hours per month. A Loop where the agent triages incoming tickets 24/7, each saving two minutes of human dispatch, can contribute hundreds of hours per month at scale.

The IPL is reported at three levels:

- **Personal IPL** — hours liberated for an individual.
- **Team IPL** — hours liberated for a team or department.
- **Organizational IPL** — hours liberated across the company.

Typical mature Loopy deployments target a personal IPL of 30–60 hours per month within the first year — meaning the agent is running roughly 17–33% of the knowledge worker's work. Best-in-class deployments at 18–24 months reach 80–110 hours, at which point the human role has substantially evolved (see Part VII).

The IPL is *not* a headcount-savings metric. We are explicit about this in Part VII. Treating IPL as a layoff metric is the fastest way to destroy trust in the implementation.

## 1.6 The Confidence Index

The Confidence Index is a 0–100 score assigned to every Loop based on the *quality* of its operation. It is composed of:

- **Coverage** — does the Loop have all its expected inputs? (Are connectors healthy? Are signals arriving on schedule?)
- **Cadence** — is the Loop running at its expected frequency?
- **Completion** — are signals being closed (e.g., are draft outputs being approved or rejected, not stranded)?
- **Outcome** — when measurable, is the Loop producing the intended result (close rates, response times, error rates)?
- **Hygiene** — is the Loop's metadata up to date, owner present, scope clear?

A Loop above 80 is "trusted" — leaders can rely on its outputs without daily inspection. A Loop between 50 and 80 is "monitored" — useful, but worth a weekly review. A Loop below 50 is "at risk" — it should be repaired or retired.

The Confidence Index is the lever you give to leaders who would otherwise be tempted to "audit everything." It lets you delegate trust selectively, with evidence, and revoke it when the evidence stops supporting it.

## 1.7 Team Loopy: The Governance Agents

Loopy ships with five built-in agents, collectively called Team Loopy. They are not optional decoration — they are the governance layer. Together they implement the operating system of the deployment.

**Nova** is the loop-mapper. Nova translates messy human work — a Slack thread, a meeting decision, a recurring task — into a structured Loop candidate. Nova runs the pipeline *Work Signal → Loop Candidate → Loop Instance*. In practice, when an executive says "we should be tracking that," Nova is the agent who turns "that" into a Loop.

**Atlas** is the orchestrator. Atlas coordinates Loops across the organization, surfaces conflicts (two Loops claiming the same input, two owners disagreeing), and proposes consolidation when the Loop catalog grows fragmented.

**Vega** is the analyst. Vega computes IPL, Confidence Index, ROI, adoption, and stuck-Loop reports. Vega is the agent your CFO and COO will spend the most time with.

**Echo** is the collaboration bridge. Echo coordinates work between humans and other agents — escalation, transfer, request-for-input, A2A (agent-to-agent) messaging.

**Orion** is the registry. Orion knows which agents are deployed, which skills are installed, who has access to what, and what version of the protocol each is running. Orion is the agent your IT and security teams will spend the most time with.

You should expect to *delegate to* Team Loopy. Most early implementations make the mistake of building custom governance dashboards. Use Team Loopy. The dashboards age badly; Team Loopy improves with the platform.

## 1.8 The Open Core Model

Loopy is distributed as Open Core. This is a deliberate strategic choice, and it has implications for the buyer.

The **core protocol, SDK, schema, API, web app, Cowork plugin, and skills library** are open source under AGPL v3. AGPL v3 means: you can self-host, modify, fork, and run Loopy in any context, including commercial — *but* if you offer it as a network-accessible service, you must publish your modifications under the same license. This is intentional. It protects against SaaS copycats who would otherwise rebrand the OSS as their own paid service without contributing back.

The **managed cloud (loopythinking.ai)**, the **enterprise integrations and connectors**, the **advanced analytics templates**, and the **commercial support** are proprietary. They run on the same protocol but are licensed commercially.

For most organizations the practical choice looks like this:

- **You should self-host (Loopy OSS)** if you have data residency requirements, an air-gapped environment, a strong platform team, regulatory constraints that prohibit cloud-based AI, or strategic preference for open infrastructure.
- **You should use the cloud (loopythinking.ai)** if you want a faster start, do not have a platform team to spare, are comfortable with standard SaaS data handling, or want access to the managed integrations marketplace.
- **You should use both** if you have a regulated business unit (use OSS) and a faster-moving non-regulated unit (use cloud), or if you want to pilot in the cloud and migrate to self-hosted at scale.

We will return to this decision in Part II with a concrete decision tree.

## 1.9 What Loopy Is Not

To make the above concrete, here is what Loopy is *not*, in case the rest of the Playbook leaves any of this implicit.

Loopy is **not a chatbot**. There is a chat surface — the Cowork plugin and the web app — but the primary unit of value is the Loop, not the conversation.

Loopy is **not a workflow tool**. Workflow tools assume the steps are known in advance. Loops assume the steps are known *enough* to instrument, but the agent is allowed to adapt within the layer.

Loopy is **not an LLM**. Loopy is BYOK — you bring Anthropic, OpenAI, Google, or any OpenAI-compatible provider. Loopy chooses no model on your behalf. You can switch models per Loop, per agent, per workload.

Loopy is **not an automation platform**. Automation platforms (Zapier, n8n, Make) connect APIs. Loopy instruments cognition. The two are complementary; many Loops will end up calling automation platforms as their action layer.

Loopy is **not RPA**. RPA replays clicks. Loopy reasons over signals. Most RPA-shaped problems are better solved with the action layer of a Loop than with screen-scraping bots.

Loopy is **not a headcount-reduction tool**. We will say this many times. Treating it as such is the dominant failure mode of enterprise AI deployments and the fastest way to lose your workforce's trust.

---

# Part II — Strategic Readiness

Before any technical work, before any change-management plan, before any kickoff meeting, you should answer four strategic questions honestly. Most failed implementations skipped at least two of them.

## 2.1 The Four Readiness Questions

**Question 1 — Is the work we want to amplify *legible*?** Loopy makes work visible. If your operations are mostly informal — decisions made over lunch, escalations made by tap on the shoulder, knowledge held in the heads of a few senior people — Loopy will not solve that on its own. You will need to invest in a *legibility phase* (Part III, §3.4) before instrumentation. Companies that skip this step end up instrumenting the wrong work, build Loops with no clear owner, and conclude that "AI does not work for us." It was not the AI.

**Question 2 — Do we have the leadership bandwidth for a 12-month change effort?** Loopy is not a tool deployment. It is an operating-model evolution. The first three months will require the active sponsorship of the CEO or COO. The first twelve months will require a full-time executive owner, a cross-functional council, and budget. If the answer is "we will fit this into someone's spare 20%," do not start. The half-built version will discredit the full version.

**Question 3 — Do we have a workforce that will engage honestly with the rollout?** Trust in leadership is the single largest predictor of implementation success. If there has been a recent layoff, a contentious labor relations event, or a high-profile failed transformation, you have a *trust deficit*. Address that *before* you announce Loopy, or the announcement itself will trigger an attrition wave. The time to surface the IPL framing is *before* it has to defend itself against suspicion.

**Question 4 — Are we willing to retire work, not just amplify it?** If a Loop reveals that a process is unnecessary, will you stop doing it? If a Loop reveals that a meeting is redundant, will you cancel it? Loopy does not just amplify — it exposes. Organizations that cannot retire work will end up doubling it: humans still doing the old steps, agents now also doing them. This is worse than not deploying at all.

If you cannot answer "yes" to all four, do the prep work first. The Playbook will still be here.

## 2.2 The Loopy Maturity Model

Use this maturity model to set a realistic target for the first 12 months. Most organizations should aim for Level 2 in the first year and Level 3 in the second.

**Level 0 — Pre-Loopy.** Work is not instrumented. AI usage is shadow IT. There is no canonical record of what is being done with AI, by whom, or to what effect.

**Level 1 — Instrumented Pilot.** A small number of Loops (3–10) are running in a single department. The Confidence Index is being tracked. The IPL is reported monthly. A Loopy Council is meeting biweekly. Most of the workforce has not yet interacted with Loopy.

**Level 2 — Cross-Functional Adoption.** 30–100 Loops are running across multiple departments. Onboarding is repeatable. The Cowork plugin is deployed to a meaningful share of knowledge workers. Quarterly business reviews include IPL by department. Role evolution has begun in at least three job families.

**Level 3 — Operating-Model Integration.** Loops are how work is described. Org charts are augmented with Loop ownership. New hire onboarding includes Loopy training in week one. Compensation reviews acknowledge Loop ownership and IPL contribution. The Loopy Council is a standing executive forum, not a project team.

**Level 4 — Loop-Native Organization.** Strategy is set in Loops. Every initiative ships with its instrumentation. The IPL is reported alongside revenue and headcount in board materials. The company can credibly claim that AI has not displaced its workforce — it has elevated it.

The maturity model is not a marketing artifact. It is a planning tool. Each Level has its own Loopy Council cadence (Part VI), training curriculum (Part VII), and KPI set (Part IX). Do not try to leapfrog. Level 4 organizations got there by spending real time at Level 2.

## 2.3 The Business Case

The business case for Loopy is built on three pillars: hours liberated (IPL), risk reduction (Confidence Index), and optionality (Open Core). Resist the temptation to lead with cost savings — it is the weakest of the three and creates the wrong incentives.

### Pillar 1 — Hours Liberated (IPL)

Compute IPL value as follows:

```
Annual IPL Value = (Liberated Hours / Month) × 12 × (Fully Loaded Hourly Cost)
                                                  × (Redirection Factor)
```

Where:

- **Liberated Hours / Month** is the IPL — for a target deployment of 200 knowledge workers averaging 40 hours/month liberated, that is 8,000 hours/month.
- **Fully Loaded Hourly Cost** is salary plus benefits plus overhead, divided by 1,800 productive hours per year. For a $120,000-loaded role, this is roughly $67/hour.
- **Redirection Factor** is the share of liberated hours actually redirected to higher-leverage work. Be conservative — 0.5 is realistic for the first year, 0.7 for mature deployments.

For the example: 8,000 × 12 × 67 × 0.5 = **$3.2M/year**.

This is the figure your CFO will challenge. The defense is that it is a *capacity* metric, not a *cash* metric. You are buying the capacity to grow without growing headcount, to absorb new work without burning out staff, and to run experiments you previously could not afford.

### Pillar 2 — Risk Reduction (Confidence Index)

This is the metric your COO and audit team care about. Today, most knowledge work is uninstrumented — you do not know which decisions were rushed, which ones lacked context, which ones depended on a single person's memory. Loopy gives you an audit trail per Loop and a Confidence Index per Loop.

Quantify this against:

- The estimated cost of one major decision-quality incident in your industry (a botched customer escalation, a missed compliance deadline, a hiring decision based on incomplete data). For mid-market companies this is typically $100k–$1M per incident.
- The number of incidents per year you currently absorb.
- The expected reduction. Conservative deployments target a 30% reduction in the first year, 60% by year two.

The risk-reduction case is often *larger* than the IPL case but harder to defend in the boardroom because the avoided incidents are counterfactual. Pair it with explicit Confidence Index targets so it lands as a measurement program, not a promise.

### Pillar 3 — Optionality (Open Core)

The third pillar is qualitative but matters in regulated industries and in companies with a long horizon. It has three parts:

- **Vendor independence.** BYOK lets you switch model providers without re-engineering Loops. The protocol is open; if Loopy disappears tomorrow, your Loops are still defined in a schema you can read.
- **Data residency.** Self-hosted Loopy puts your data on your infrastructure. For EU, healthcare, financial-services, and government deployments, this is often the deciding factor.
- **Forkability.** AGPL v3 means you can fork the project if your needs diverge from the upstream roadmap. You do not have to fork — most organizations never will — but the right to do so is itself a form of strategic protection.

Optionality is hard to put a dollar value on. Quantify it as risk avoided: *if our preferred AI vendor doubles prices, deprecates a model, or is acquired, what does our migration cost?* For most enterprises that number is in the seven figures. Loopy reduces it materially.

## 2.4 The Self-Hosted vs Cloud Decision Tree

Use this tree. It is intentionally restrictive — it is easy to talk yourself into self-hosting because it sounds enterprise-grade, but self-hosted is *more* work and only worth it under specific conditions.

```
START
│
├── Q1: Are you in a regulated industry where customer data
│        cannot leave your infrastructure?
│        (Healthcare, finance with PCI/PII concerns, defense,
│         government, certain EU jurisdictions)
│        ├── YES → Self-hosted (Loopy OSS).
│        └── NO  → Continue to Q2.
│
├── Q2: Do you have a platform/DevOps team able to run a
│        Postgres + Node service in production with on-call?
│        ├── NO  → Cloud (loopythinking.ai).
│        └── YES → Continue to Q3.
│
├── Q3: Is there an explicit board-level mandate for
│        sovereign / open-source-only infrastructure?
│        ├── YES → Self-hosted.
│        └── NO  → Continue to Q4.
│
├── Q4: Do you need to integrate with internal systems
│        that cannot be exposed externally?
│        ├── YES → Self-hosted.
│        └── NO  → Cloud (recommended default).
│
└── Q5: Do you have a hybrid case (one regulated unit,
         one fast-moving unit)?
         ├── YES → Both. Self-hosted for the regulated unit,
                   cloud for the rest. This is supported.
         └── NO  → Pick the answer from Q1–Q4 and stop.
```

Most organizations end up at "Cloud." Most organizations end up there because that is the right answer. Do not let "we might want to self-host someday" delay your start — the protocol is portable, you can migrate.

## 2.5 Governance Foundations

Governance is the single most underbuilt component of typical AI implementations. It is also the one that determines whether the deployment scales past Pilot. Build it before you install anything.

### The Loopy Council

The Loopy Council is a cross-functional standing forum. It meets weekly during Pilot, biweekly at scale. It owns:

- The Loop catalog (what Loops exist, who owns them, their status).
- The AI Contribution Charter (the public-facing policy, see §7.5).
- The Confidence Index thresholds (when does a Loop get retired?).
- The IPL targets (department by department).
- The escalation path (when does a Loop or agent get paused?).
- The kill-switch policy (who can stop Loopy company-wide, and under what conditions).

The Council has seven members:

1. **Executive sponsor** — the CEO, COO, or a designated SVP. Has the authority to retire work that the Council surfaces as redundant.
2. **Implementation lead** — the full-time owner of the Loopy program. Often a chief of staff, transformation lead, or VP-level operator.
3. **Technology lead** — head of IT, platform, or DevOps. Owns infrastructure, security, identity.
4. **People lead** — head of HR or People Ops. Owns role evolution, training, change communications.
5. **Risk / compliance lead** — head of legal, compliance, or audit. Owns the AI policy, regulatory posture, and incident response.
6. **Business owner #1** — operator from the first pilot domain. Owns the first batch of Loops.
7. **Workforce voice** — a senior individual contributor or middle manager who is *not* an executive. Owns the channel through which the workforce sees the rollout. This seat is non-negotiable. Without it the Council becomes performative.

If you cannot fill all seven seats with named people who have time on their calendar, you are not ready to start.

### The Three Policies

Three policies must exist before the first Loop ships. Each should be one page. Long policies do not get read.

**The AI Contribution Charter** — the public-facing statement to the workforce of what Loopy will and will not do. Includes the no-layoff commitment (or its honest absence), the role-evolution commitment, the data-handling commitment, and the appeal process. (Template in §11.4.)

**The Loop Lifecycle Policy** — how Loops are created, reviewed, retired. Covers ownership, naming conventions, the Confidence Index thresholds, and the retirement criteria. (Template in §11.5.)

**The Incident & Kill-Switch Policy** — what happens when a Loop produces a bad outcome, when an agent behaves unexpectedly, or when a regulator asks a question. Covers the escalation chain, the disclosure protocol, and the conditions under which Loopy is paused company-wide. (Template in §11.6.)

These are governance, not paperwork. They will be tested. Write them as if a regulator, a journalist, and a skeptical employee will all read them — because they will.

---

# Part III — Pre-Implementation: Days -90 to 0

The 90 days before you install Loopy are more important than the 90 days after. Most failures are foreshadowed in this window. Treat this Part as a runbook.

We use a **T-minus** convention: T-90 is 90 days before launch (the day the first Loop goes live), T-0 is launch day, T+1 is the first day of Phase 1. The schedule below assumes a 90-day runway. If you have less, compress; if you skip Weeks T-12 to T-9, expect the rollout to underperform.

## 3.1 Week T-12 to T-9 — Strategic Commitment

**Goal of this phase:** Lock the strategic decision and assemble the executive sponsorship. Do nothing else.

### What happens this phase

The CEO or COO publicly commits to the program at the executive team. Public means: in a meeting, on the record, in writing, with a budget line and a named owner. This is non-negotiable. AI implementations sponsored "off the side of the desk" by an SVP without CEO air cover routinely fail by month four.

The executive sponsor names the **implementation lead** — a full-time, named individual with a 12-month assignment. This is typically a chief of staff, a transformation lead, a VP of operations, or a senior operator with credibility across the leadership team. This person becomes the most important hire of the program. They are not optional, not part-time, not borrowed.

The implementation lead writes a **one-page strategic memo** answering:

- *Why Loopy, why now?*
- *What does success look like in 12 months?*
- *Which two or three departments will pilot?*
- *What is the budget envelope?*
- *Who is the executive sponsor and what does that mean?*
- *Who is the workforce voice on the Council?*

This memo is the founding artifact. It will be referenced for the next 18 months. Spend a week writing it.

### ▶ Checklist — Week T-12 to T-9

- [ ] Executive sponsor publicly committed in an executive team meeting
- [ ] Implementation lead named and assigned full-time for 12 months
- [ ] Strategic memo (one page) written, signed by sponsor, distributed to executive team
- [ ] Budget envelope for Year 1 approved (see §3.7 for benchmarks)
- [ ] Cloud vs self-hosted decision made (per §2.4 decision tree)
- [ ] Pilot domains tentatively identified (two or three, not more)
- [ ] No external announcement yet — internal work only

### ⚠ Pitfalls in this phase

The most common mistake is to *skip the public commitment* and have the sponsor "verbally support" the program. Verbal support evaporates the first time priorities collide. If the sponsor will not put it in writing, you do not have a program.

The second most common mistake is to *appoint a part-time implementation lead*. Loopy implementations are not 0.3 FTE. They will consume the lead's full attention through Pilot and at least 0.5 FTE through Scale. If you cannot afford a full-time lead, you cannot afford the program.

## 3.2 Week T-9 to T-7 — Council Formation

**Goal of this phase:** Stand up the Loopy Council. Do not begin technical work. Do not begin training. Do not select Loops.

### What happens this phase

The implementation lead and the executive sponsor identify the seven Council members (see §2.5). Each member is briefed individually before the first Council meeting. Each commits to a 12-month assignment. Each clears a recurring weekly slot on their calendar.

The Council holds its first meeting. The agenda is:

1. Strategic memo walkthrough (sponsor leads).
2. Read-through of Part I and Part II of this Playbook.
3. Review of the cloud-vs-self-hosted decision and any disagreement surfaced.
4. Initial discussion of the AI Contribution Charter (no decisions yet).
5. Identification of the workforce voice seat (if not yet filled).
6. Decision on cadence (weekly during Pilot, biweekly at Scale).
7. Action items.

The Council also agrees on its **decision rights** — what it can decide on its own, what requires escalation. A typical split:

- **Decided by Council:** Loop creation, Loop retirement, Confidence Index thresholds, training curriculum, internal communications.
- **Decided by Executive Sponsor:** Budget overruns, scope expansion, cross-departmental conflicts, public communications.
- **Decided by Executive Team / Board:** Workforce reductions tied to Loopy (we recommend "never," see §7.6), public-facing AI policy, regulatory disclosures.

### ❖ Template — Council Charter (one page)

```
LOOPY COUNCIL — CHARTER

Purpose. The Loopy Council governs the implementation and ongoing
operation of [Company]'s Loopy program. The Council is responsible for
the integrity of the Loop catalog, the AI Contribution Charter, the
Confidence Index thresholds, and the kill-switch policy.

Members.
- Executive Sponsor: [name, role]
- Implementation Lead: [name, role]
- Technology Lead: [name, role]
- People Lead: [name, role]
- Risk/Compliance Lead: [name, role]
- Business Owner: [name, role]
- Workforce Voice: [name, role]

Cadence. Weekly during Pilot (Months 1–3). Biweekly during Scale
(Months 4–9). Monthly at Embed (Months 10+).

Decision Rights.
- Council decides: Loop creation/retirement, Confidence Index
  thresholds, training curriculum, internal comms.
- Sponsor decides: Budget overruns, scope expansion, public comms.
- Executive Team decides: Workforce-impact decisions tied to Loopy,
  public AI policy, regulatory disclosures.

Quorum. Five of seven. Workforce Voice presence is required for any
decision affecting workforce communications or role evolution.

Documentation. All Council decisions are logged as Reflection-layer
Loops in Loopy itself.

Sunset. The Council reviews its own continued necessity at month 12.
```

### ▶ Checklist — Week T-9 to T-7

- [ ] All seven Council seats filled with named individuals
- [ ] Council Charter written and signed
- [ ] First Council meeting held; minutes distributed
- [ ] Recurring calendar invites placed for the next 12 months
- [ ] Workforce Voice has been briefed and accepts the role
- [ ] Decision-rights matrix agreed and documented

## 3.3 Week T-9 to T-6 (parallel) — Stakeholder Mapping

In parallel with Council formation, the implementation lead conducts a **stakeholder mapping exercise**. The goal is not a political map; it is a clarity map of who needs to know what, when.

Use a 2×2 grid:

```
                  HIGH INFLUENCE
                       │
    Manage closely    │    Engage as partners
    ──────────────────┼──────────────────────  HIGH INTEREST
    Monitor           │    Keep informed
                       │
                  LOW INFLUENCE
```

For each person plotted in **Manage closely** (high influence, low interest) and **Engage as partners** (high influence, high interest), the lead conducts a 30-minute one-on-one. The script is:

> "We are about to launch a program called Loopy that will instrument how cognitive work happens at [Company]. I want to understand three things from you: (1) what work in your domain do you wish was more visible? (2) where would you most resist instrumentation, and why? (3) what would have to be true for you to be a public supporter of this program?"

Document each conversation. The patterns you hear in these interviews will become the FAQ in §11.7 and the messaging foundation for the Charter.

### ⚠ Pitfall — the silent skeptic

The most dangerous stakeholder is not the loud opponent. It is the silent skeptic — typically a senior leader who nods politely in meetings but withholds engagement from their team. They do not need to block you publicly; they only need to fail to amplify the rollout in their org. Identify them in this mapping. Spend disproportionate time with them between T-9 and T-3.

## 3.4 Week T-9 to T-3 (parallel) — The Legibility Phase

**Goal:** Make the work you intend to instrument visible *before* you instrument it.

This phase is the one most often skipped. Companies who skip it instrument the wrong work and conclude that AI does not work. It was not the AI; it was the choice of work.

### What happens this phase

For each pilot domain, the business owner runs three exercises with their team:

**Exercise 1 — Process narration.** Each person on the team narrates a typical workday in writing — a one-page diary of what they actually did, hour by hour. Aggregate these. You will find recurring patterns and surprising gaps.

**Exercise 2 — Decision logging.** For two weeks, every meaningful decision in the pilot domain is logged in a shared sheet: *what was decided, by whom, with what evidence, with what alternatives considered.* You will find that 30–50% of decisions are recurring — same shape, same evidence, same outcome. These are Loop candidates.

**Exercise 3 — Pain point inventory.** Each team member submits their top three operational pain points anonymously. Aggregate. Cluster. The clusters that overlap with the recurring decisions are your highest-value Loop candidates.

The output of the legibility phase is a **Loop Candidate List** — typically 15–30 candidates per pilot domain, ranked by impact and by amplifiability (see §3.6).

### ❖ Template — Loop Candidate Worksheet

```
LOOP CANDIDATE WORKSHEET

Title: [short, action-oriented name]
Domain: [department / team]
Cognitive layer: [Perception / Interpretation / Decision / Action / Reflection]

What is the unit of work?
[One sentence describing what triggers this Loop and what it produces]

How often does it run?
[Times per day, week, or month — be precise]

Who owns it today?
[Name + role]

What inputs does it need?
[Data sources, integrations, triggers]

What outputs does it produce?
[Where the result goes — email, ticket, CRM, dashboard]

What's the human time cost per run, today?
[Minutes — be honest, include task-switching]

What part of this is judgment that should stay with a human?
[Be explicit. If the answer is "all of it," this may not be a good Loop candidate.]

What's the worst-case bad outcome if the agent gets this wrong?
[This drives the irreversibility/reversibility classification]

Estimated IPL contribution per month (hours):
[runs/month × minutes/run × amplification rate ÷ 60]
```

### ▶ Checklist — Legibility Phase

- [ ] Process narration completed for each pilot domain
- [ ] Decision log run for at least two weeks per pilot domain
- [ ] Pain point inventory aggregated and clustered
- [ ] Loop Candidate List produced (15–30 per domain)
- [ ] Each candidate has a worksheet completed
- [ ] Candidates ranked by IPL potential and reversibility

## 3.5 Week T-7 to T-4 — Security, Legal, and Compliance

While the legibility phase runs, the technology lead and risk/compliance lead run a parallel readiness track. This track has five workstreams.

### Workstream 1 — Data classification

For each pilot domain, classify the data the Loops will touch:

- **Public** — already disclosed externally.
- **Internal** — not for external disclosure but not sensitive.
- **Confidential** — competitive, customer, or financial.
- **Restricted** — regulated (PII, PHI, PCI, financial records).

For Restricted data, you should be self-hosted (per §2.4). For Confidential data, you should have a clear contract with your cloud provider on data handling (loopythinking.ai customers receive a DPA). For Internal and Public data, no special handling is required.

### Workstream 2 — Identity and access

Decide:

- How does Loopy authenticate users? (SSO via SAML/OIDC is strongly recommended.)
- How does Loopy authenticate to source systems? (Per-user OAuth where possible; service accounts only with audit logging.)
- How are agent tokens managed? (Loopy issues per-user agent tokens; rotation policy required.)
- Who has admin access? (Minimum two named admins; no shared accounts.)

### Workstream 3 — Model and key management (BYOK)

For each LLM provider you intend to use:

- Procure the API key.
- Store it in your secrets manager (Vault, AWS Secrets Manager, GCP Secret Manager, 1Password Business). Loopy supports encrypted-at-rest configuration via the `LOOPY_ENCRYPTION_KEY`-style environment variables.
- Define which Loops are allowed to use which models. Some Loops should be pinned to specific models for reproducibility; others can be model-agnostic.
- Review the model provider's data-handling terms. *Do not* assume cloud LLM providers will not train on your inputs — read the contract.

### Workstream 4 — Audit and observability

Confirm:

- Every Loop run produces a Work Signal record. (This is built in.)
- Work Signals are exported to your SIEM or audit log (typically via webhook or scheduled SQL pull).
- Retention policy is set (default: 13 months; check your industry requirements).
- Who can read Work Signals is restricted (typically: the Loop owner, the Loopy Council, the audit team).

### Workstream 5 — Regulatory posture

Engage your regulatory function early. Topics to cover:

- **EU AI Act** — categorize each Loop's risk tier. Most internal-operations Loops are minimal risk. HR-related Loops (hiring, termination, performance) are typically high-risk and require additional controls.
- **GDPR / CCPA** — confirm any Loop touching personal data has a lawful basis, a retention policy, and a data subject access response mechanism.
- **Industry-specific** — HIPAA, GLBA, SOX, PCI-DSS, FERPA, etc. — assess per Loop.
- **Sector regulators** — banking, insurance, telecom, energy, public sector all have additional disclosure expectations for AI-driven decisions.

The output of this workstream is a **one-page AI Risk Posture** that the Council reviews and the executive sponsor signs.

### ▶ Checklist — Security/Legal/Compliance

- [ ] Data classification completed per pilot domain
- [ ] SSO integration plan written
- [ ] Agent token rotation policy written
- [ ] BYOK keys procured and stored in secrets manager
- [ ] Model-to-Loop permissioning matrix drafted
- [ ] Work Signal export to SIEM tested
- [ ] AI Risk Posture document signed by sponsor
- [ ] EU AI Act risk-tier categorization completed (if applicable)
- [ ] DPA in place with model provider(s)

## 3.6 Week T-6 to T-3 — Selecting Pilot Loops

From the Loop Candidate List, you will select **three to five Loops** to pilot. Not ten. Not fifteen. Three to five.

### Selection criteria

Score each candidate against the **R-I-V-O matrix**:

- **R**eversibility — how recoverable is a wrong answer? (1 = irreversible; 5 = trivially reversible)
- **I**PL potential — how many hours per month would this liberate? (1 = <5 hours; 5 = >40 hours)
- **V**isibility — how visible is the success of this Loop? (1 = invisible; 5 = leadership sees it weekly)
- **O**wner readiness — does it have a committed, capable owner? (1 = no owner; 5 = enthusiastic owner with bandwidth)

Pick Loops scoring 4+ on at least three of the four dimensions, and at least 3 on all four. **Reject** any Loop scoring below 3 on Owner Readiness, no matter how good the IPL is. A Loop without a strong owner will fail.

### The portfolio

Your three-to-five Loops should span at least:

- **Two cognitive layers** — typically Perception and Action are easiest, Decision is hardest. Have at least one of each so the Council learns the differences.
- **Two domains** — so the Council learns to govern across boundaries.
- **One "leadership-visible" Loop** — something the executive team will see the output of within 30 days.

### ⚠ Pitfall — the seductive pilot

The most seductive pilot Loop is usually a Decision-layer Loop where the AI promises to make a difficult judgment call ("AI will tell us which deals to discount"). Resist. Pilot Decision Loops are where most implementations stumble because the agent's judgment is usually below the human expert's, and the failure is publicly visible. Start with Perception and Action. Earn the right to do Decision Loops in Phase 2 or 3.

## 3.7 Budget Benchmarks

For planning, use these benchmarks. They will vary by industry and geography but are representative for a 200-person knowledge-work company in Year 1.

| Item | Range (Year 1) | Notes |
|---|---|---|
| Implementation Lead (full-time) | $150k–$250k loaded | Most important line item. Do not under-resource. |
| Council members' time | Embedded | ~2 hours/week each — absorbed in role. |
| External implementation partner (optional) | $50k–$200k | Useful for first deployment if your platform team is thin. |
| Loopy OSS hosting (self-host) | $20k–$60k/year | Cloud infra + DevOps share. |
| loopythinking.ai cloud (200 seats) | Tiered — request quote | Scales with seats and usage. |
| LLM API spend (BYOK) | $30k–$120k/year | Highly variable by Loop volume; budget conservatively for Year 1. |
| Training and change management | $30k–$100k | Curriculum design, materials, comms. |
| **Total Year 1 (typical)** | **$280k–$730k** | Larger orgs scale roughly linearly with seats. |

For comparison, the IPL value at the same scale (200 workers, 40 hours/month liberated, 0.5 redirection factor) is approximately **$3.2M/year** of capacity. The ROI is real, but it is *capacity ROI*, not cash savings — see §2.3.

## 3.8 The Pre-Flight Checklist

If you can check every box below, you are ready to launch (T-0). If you cannot, do not launch — fix the gap first.

### ▶ Pre-Flight Checklist (T-0 readiness)

**Strategic**
- [ ] Executive sponsor publicly committed
- [ ] Implementation lead full-time and named
- [ ] Strategic memo signed and distributed
- [ ] Budget approved
- [ ] Cloud vs self-hosted decision made

**Governance**
- [ ] Council Charter signed
- [ ] All seven Council seats filled
- [ ] Workforce Voice in place and active
- [ ] AI Contribution Charter drafted and reviewed
- [ ] Loop Lifecycle Policy drafted and reviewed
- [ ] Incident & Kill-Switch Policy drafted and reviewed

**People**
- [ ] Stakeholder mapping completed
- [ ] Manage-closely interviews completed
- [ ] HR readiness assessment completed (§5.4)
- [ ] Training curriculum drafted (§7.3)
- [ ] First all-hands communication scheduled

**Process**
- [ ] Legibility phase completed for each pilot domain
- [ ] Loop Candidate List produced
- [ ] Three to five pilot Loops selected
- [ ] Each pilot Loop has a worksheet and a named owner
- [ ] R-I-V-O scores documented

**Technology**
- [ ] Hosting decision implemented (cloud account or self-hosted infra ready)
- [ ] SSO integrated and tested
- [ ] BYOK keys procured and stored
- [ ] Model-to-Loop permissioning matrix in place
- [ ] Work Signal export to SIEM tested
- [ ] Cowork plugin packaged for distribution (self-hosted only)

**Risk**
- [ ] Data classification completed
- [ ] AI Risk Posture signed by sponsor
- [ ] DPAs in place with model providers
- [ ] Regulatory categorization completed
- [ ] Incident response runbook tested in tabletop

If all of those are checked, you are ready. Take a breath. The next 90 days are Phase 1.

---

# Part IV — Phased Rollout

The rollout has four phases. Each has a distinct objective, a distinct cadence, and a distinct exit criterion. Do not advance to the next phase until the exit criterion is met.

| Phase | Duration | Objective | Exit Criterion |
|---|---|---|---|
| 1 — Foundation | Weeks 1–4 | Install, configure, validate plumbing | All three pilot Loops emitting Work Signals |
| 2 — Pilot | Weeks 5–12 | Prove value in three to five Loops | IPL ≥ 30h/month/owner; Confidence ≥ 70 |
| 3 — Scale | Months 4–9 | Expand across departments | 30+ Loops live; 50%+ of target users active |
| 4 — Embed | Months 10+ | Make Loopy the default operating model | Loop ownership in role descriptions; IPL in QBRs |

## 4.1 Phase 1 — Foundation (Weeks 1–4)

### Goal

Stand up the platform, integrate identity and core data sources, deploy the Cowork plugin to the Council, instrument the first Loops in **shadow mode** (signals flowing, but no user-visible action). Do not push Loopy to the broader workforce yet.

### Week 1 — Install

**Day 1.** Hosting goes live. Cloud customers have an org provisioned; self-hosted customers have the Docker stack deployed in a staging environment first.

**Day 2.** SSO is wired. The seven Council members log in. Test that authentication, role assignment, and session management work end-to-end.

**Day 3.** Core data sources are connected: typically a chat platform (Slack or Teams), a calendar (Google or Microsoft), and one business system (CRM or ticketing). Other integrations come later.

**Day 4.** BYOK is configured. The Council validates that LLM calls succeed and that costs are visible in the LLM provider's dashboard.

**Day 5.** The Cowork plugin is installed on the seven Council members' machines. Each member completes the *first-run wizard* and registers their personal agent token.

By end of Week 1, each Council member should be able to issue the prompt *"setup loopy"* and receive confirmation that their agent is registered and reachable.

### Week 2 — Configure

**The Loop catalog gets its first entries.** The implementation lead, in collaboration with each pilot Loop owner, creates the Loops in the catalog. At this point Loops are *defined* but not yet *active* — they have a name, a layer, an owner, and a stub for inputs/outputs.

**The Confidence Index thresholds are set.** The Council ratifies:

- Below 50: at risk — repair or retire within 14 days.
- 50–70: monitored — reviewed weekly.
- 70–80: trusted with oversight — reviewed monthly.
- Above 80: fully trusted — included in standard reporting.

**The IPL targets are set.** The Council ratifies a per-pilot-domain IPL target for the end of Phase 2 (typically 20–40 hours/month per pilot owner).

**The Work Signal export to SIEM is verified.** A test signal flows; the audit team confirms ingestion.

### Week 3 — Shadow Mode

Each pilot Loop is activated in *shadow mode*. In shadow mode, the agent runs but its outputs are not delivered to humans or external systems — they are written to the Loop's signal stream for review. This is the safety net.

**The Council reviews shadow outputs daily.** For each pilot Loop, the owner spends 15 minutes a day reviewing what the agent produced, comparing it to what they would have produced, and tagging signals as *match*, *better*, *worse*, or *wrong*.

**Patterns emerge.** Most agents in shadow mode produce 60–75% match rate in week one, climbing to 80–90% by end of week three with prompt and context tuning. If you are below 60% by end of week three, the Loop is wrong — re-scope or replace it.

### Week 4 — Activation

For each pilot Loop where shadow mode reached 80%+ match rate, the Loop is **activated** — the agent's outputs now flow to humans or systems. The Council schedules a *go-live review* for each activation: a 30-minute meeting where the owner walks the Council through the Loop, the shadow data, the activation criteria, and the rollback plan.

For each pilot Loop that did *not* reach 80%, the Council either extends shadow mode by two weeks or retires the Loop. Do not activate a Loop with poor shadow data and hope it improves; it will not.

### ▶ Phase 1 Exit Criteria

- [ ] All three to five pilot Loops created in catalog
- [ ] All Council members onboarded and using the Cowork plugin
- [ ] SSO, BYOK, and SIEM export validated
- [ ] At least three pilot Loops active (graduated from shadow)
- [ ] Confidence Index thresholds ratified
- [ ] IPL targets set for Phase 2
- [ ] First Council retrospective held; lessons logged

### ⚠ Phase 1 Pitfalls

**Skipping shadow mode.** Tempting because shadow feels slow. Don't. The first week of activation is where reputational damage happens; shadow mode prevents it.

**Onboarding the wider workforce in Week 4.** Every implementation we have seen that did this regretted it. The wider workforce should not even know Loopy is live until Phase 2.

**Counting IPL in Phase 1.** The IPL number you compute in Phase 1 is noise. Wait for Phase 2 baselines.

## 4.2 Phase 2 — Pilot (Weeks 5–12)

### Goal

Prove value in the three to five pilot Loops. Run them long enough to compute trustworthy IPL and Confidence Index. Onboard the first cohort of regular users (the pilot owners' teams). Refine the playbook based on what you learn.

### Pilot Cohort

In Phase 2 you onboard the **pilot cohort** — the immediate teams of the pilot Loop owners, typically 20–60 people. The all-hands announcement happens at the start of Phase 2 (see §7.4 for the script). Onboarding is structured:

- **Week 5:** All-hands announcement; FAQ published; pilot cohort identified and notified.
- **Week 6:** Pilot cohort completes a 90-minute live training (curriculum in §7.3).
- **Week 7:** Pilot cohort installs the Cowork plugin and runs `setup loopy`.
- **Week 8:** First pilot cohort office hours (weekly thereafter).
- **Weeks 9–12:** Steady-state operation; weekly Council reviews.

### What good looks like at end of Phase 2

By the end of Week 12, you should see:

- Three to five Loops live, each with Confidence Index ≥ 70.
- IPL of 30–50 hours/month per pilot Loop owner.
- 80%+ adoption in the pilot cohort (people using the Cowork plugin at least weekly).
- Two to three new Loop candidates surfaced organically by pilot users.
- A working Council cadence with documented decisions.
- At least one *retired* Loop or *retired process* — evidence that Loopy is exposing redundant work.

If you do not see these patterns, do not advance to Phase 3. Extend Phase 2 by four weeks and diagnose. Common diagnoses:

- *IPL is below target* → Loops are too small or owners are not redirecting their freed time. Address with workload reviews.
- *Confidence is below target* → data sources are unreliable or the Loop is poorly scoped. Address with data-quality work or scope re-cuts.
- *Adoption is low* → training did not stick or the Cowork plugin is too friction-heavy. Address with refresher training and friction audits.
- *No new Loops surfacing* → users do not feel safe proposing them. Address by having Council members publicly propose Loops in their own domains.

### ▶ Phase 2 Exit Criteria

- [ ] All pilot Loops at Confidence Index ≥ 70
- [ ] Pilot domain IPL meeting target
- [ ] Pilot cohort adoption ≥ 80%
- [ ] At least two organically-surfaced new Loop candidates
- [ ] First QBR-style report produced and reviewed by executive team
- [ ] Phase 2 retrospective completed; lessons logged
- [ ] At least one Loop retired or one process retired

### ⚠ Phase 2 Pitfalls

**Premature scaling.** The biggest mistake in Phase 2 is to start onboarding new departments before the pilot is stable. Do not do this even if leaders ask. The pilot cohort's experience is your reference for everything that comes next; if it is messy, every later cohort will be messier.

**Vanity IPL.** It is possible to produce a high IPL number by counting things that were not actually liberated — for example, by counting Loops that automate work nobody was actually doing. The Confidence Index is the check: high IPL with low Confidence is a vanity number.

**Council fatigue.** Weekly Council meetings are intense. By Week 8 some members will start sending delegates. The implementation lead should resist this. The Council is the governance; substitution dilutes it.

## 4.3 Phase 3 — Scale (Months 4–9)

### Goal

Expand from one to two pilot domains to the rest of the organization. Move from 5 Loops to 30+. Move from a 60-person pilot cohort to organization-wide rollout. Move the Council cadence from weekly to biweekly. Establish steady-state operations.

### The Wave Rollout

Do not roll out to everyone at once. Use a **wave rollout** — three to four waves of departments, each separated by 4–6 weeks. The cadence allows you to learn from each wave before the next.

A typical wave plan for a 1,000-person organization:

- **Wave 1 (Month 4):** Two pilot departments (already onboarded) + one new department adjacent to the pilot.
- **Wave 2 (Month 5–6):** Two to three new departments.
- **Wave 3 (Month 7):** Remaining knowledge-work departments.
- **Wave 4 (Month 8–9):** Frontline, customer-facing, or specialized teams that need tailored Loops.

For each wave the pattern is the same: identify the wave's owners, run a legibility phase (compressed to two weeks), select two to four Loops per department, run shadow mode for two weeks, activate, then onboard the wider department.

### The Loop Catalog at Scale

By end of Phase 3 the Loop catalog typically has 30–80 Loops. This is the point at which Loop hygiene becomes a real discipline. Atlas (the orchestrator agent) becomes important — it surfaces:

- Duplicate Loops (two teams instrumenting the same work).
- Stuck Loops (Confidence Index dropping over time).
- Orphan Loops (owner left the company; no successor).
- Over-scoped Loops (one Loop trying to do too much).

The Council reviews Atlas's report at every meeting and *acts on it*. If you do not act, the catalog becomes a graveyard.

### Org-Wide Communication

Phase 3 includes the **second all-hands** — a milestone communication where the executive sponsor reports IPL and Confidence Index for the whole organization, names the next wave, and reaffirms the AI Contribution Charter. Use the script in §7.4.

### Role Evolution Begins in Phase 3

Phase 3 is also when **role evolution** becomes visible. By Month 6 some pilot owners are spending 20–30% less time on the work they used to do; that time is being redirected. The People Lead leads role-conversation cycles in each pilot department: *what is the new shape of this role? what should we rewrite in the job description? what should we add to the career ladder?*

This is sensitive work. It is also the work that distinguishes a successful implementation from a failed one. See Part VII §7.6 for detailed guidance.

### ▶ Phase 3 Exit Criteria

- [ ] 30+ Loops live across at least 5 departments
- [ ] Average Confidence Index across active Loops ≥ 75
- [ ] Organizational IPL reported in monthly executive review
- [ ] Onboarding playbook codified and self-serve
- [ ] Role evolution discussions begun in 3+ job families
- [ ] Council moved to biweekly cadence
- [ ] Atlas reporting on duplicate/stuck/orphan Loops every Council meeting

## 4.4 Phase 4 — Embed (Months 10+)

### Goal

Make Loopy the default way work happens. Move from "rolled out" to "embedded in the operating model." This is a multi-year journey; this Playbook covers the first 12 months of it.

### What changes in Phase 4

- **Job descriptions** are rewritten to include Loop ownership for roles where it applies.
- **Onboarding** for new hires includes Loopy training in week one.
- **Performance reviews** acknowledge Loop ownership and IPL contribution (without making IPL a performance KPI — see §10.4).
- **Career ladders** include "Loop architect" and "Loop owner" tracks.
- **QBRs and board materials** include IPL by department alongside revenue and headcount.
- **The Loopy Council** transitions to a monthly cadence and becomes a standing executive forum, not a project team.

### Continuous Improvement

The principal Phase 4 discipline is **continuous improvement of the Loop catalog**. This includes:

- Monthly Loop hygiene review (Atlas-driven).
- Quarterly Loop retirement cycle — every Loop must justify its continued existence.
- Annual Charter review — does the AI Contribution Charter still match practice?
- Annual policy review — are the Loop Lifecycle and Incident policies current?

### Sunset Conditions for the Council

The Council was set up at T-9 with a 12-month assignment. At Month 12 the Council reviews its own continued necessity. Most organizations evolve it into a smaller executive forum that meets monthly. Do not disband it entirely; the governance discipline is what keeps the catalog healthy.

### ▶ Phase 4 Indicators (not exit criteria — Phase 4 does not end)

- [ ] Loop ownership appears in role descriptions for relevant roles
- [ ] New hire onboarding includes Loopy in week one
- [ ] IPL reported in QBRs at department level
- [ ] Loop retirement cycle running quarterly
- [ ] At least one strategic initiative this year was instrumented as Loops from day one
- [ ] Workforce sentiment on AI is *higher* than at Phase 1 baseline (measure with anonymous survey)

---

# Part V — Role-by-Role Guides

This Part is written so each role can read just their section and walk away with a clear set of responsibilities and first-90-days actions.

## 5.1 CEO / Founder

### Your job in this implementation

You are the executive sponsor. You are not the implementation lead. Resist the urge to do both — your role is to provide *air cover* and *forcing function*, not to execute. The two questions only you can answer for the organization are:

1. *Are we serious about this?*
2. *What will we retire?*

If the workforce reads the rollout as serious — meaning, the CEO talks about it in all-hands, asks about IPL in operating reviews, and does not let it slide when other priorities collide — the implementation will succeed. If the workforce reads it as the implementation lead's pet project, it will not.

### What to do in the first 90 days

- **T-12 to T-9.** Sign the strategic memo. Name the implementation lead. Allocate budget. Make the public commitment in an executive team meeting.
- **T-7.** Sit in on the first Council meeting. Speak briefly: *"This is one of three priorities for the next 12 months. The Council has my air cover. I will hear about it in operating reviews. I will read the AI Contribution Charter myself."*
- **T-3.** Sign the AI Risk Posture document.
- **T-0.** Send a written kickoff message to the executive team (template in §11.8).
- **Months 1–3.** Attend Council monthly. Ask one specific question each time: *"What did we retire this month?"*
- **Month 3.** Speak at the company all-hands at the start of Phase 2. Use the script in §7.4.
- **Months 4–9.** Include IPL in your monthly operating review with department heads. The number gets attention because you ask about it.
- **Month 12.** Review the Council's recommendation on its own continuation. Speak again at the company all-hands.

### What to be careful about

- Do not promise outcomes you cannot deliver. *Specifically*, do not promise the workforce that no role will change. Roles will change. What you can credibly promise is that role evolution will be a managed transition with training and support, and that liberated capacity will be redirected to growth, not headcount cuts. Keep the language in §7.5 and §7.6 close.
- Do not let other priorities silently crowd out Loopy in the first 90 days. The implementation lead will not push back on you — they cannot — so you have to push back on yourself.
- Do not interpret early IPL numbers as "we have proven this." Two months of IPL data is not a trend. Wait for Phase 2 exit before declaring success internally, and Phase 3 mid-point before declaring it externally.

### What to read

- This Playbook: Executive Summary, Part II, Part VII, Part X.
- The AI Contribution Charter (when drafted).
- The first Council retrospective (Week 4).

## 5.2 COO / Operations

### Your job

You are the most natural sponsor for Loopy if the CEO has chosen not to take that role personally. The Loopy worldview — work made legible, decisions instrumented, capacity measured — is operations work. You will likely chair the Council if you are the sponsor.

Your specific responsibilities:

- **The Loop catalog is your domain.** You are the executive who cares most about catalog hygiene, owner accountability, and the retirement cycle.
- **You set IPL targets.** By department, by quarter, with the People Lead.
- **You arbitrate cross-departmental Loop conflicts.** When two departments want to instrument the same work, you decide.
- **You own the operational kill-switch.** If a Loop produces a bad outcome, you are the executive who can pause it; if Loopy as a whole misbehaves, you are the one who can pause the platform.

### What to do in the first 90 days

- **T-12 to T-9.** Co-author the strategic memo with the CEO. Co-design the budget.
- **T-9.** Lead the Council formation. Run the first Council meeting if you are chairing.
- **T-9 to T-3.** Personally attend at least one *legibility phase* exercise per pilot domain. Watching the decision log get filled out for two weeks teaches you more about your operations than any dashboard.
- **T-0.** Approve the activation of each pilot Loop after shadow mode review.
- **Months 1–3.** Run the Council weekly. Make the Confidence Index threshold decisions.
- **Months 4–9.** Run the wave rollout schedule. Adjudicate cross-department conflicts.
- **Month 9.** Lead the operating-model review: which roles are evolving, which Loops are being retired, which capacity is being redirected.

### What to be careful about

- The temptation to instrument *too much* in the first six months. The Loop catalog is not a checklist; it is an active inventory. If you cannot describe what a Loop does in one sentence, retire it.
- The temptation to use the Confidence Index as a performance KPI for owners. This breaks the index — owners will inflate scores. The Confidence Index is a *trust* metric for leaders, not a performance metric for owners. (See §10.4.)
- The temptation to skip the workforce voice. This seat is uncomfortable to fill; do not let it be vacant for more than two weeks.

## 5.3 CTO / Head of Engineering / IT

### Your job

You own the technical reliability of the implementation. Your responsibilities:

- **Hosting choice.** Cloud or self-hosted (per §2.4). If self-hosted, this is your project.
- **Identity.** SSO integration, role mapping, agent token lifecycle.
- **Data integrations.** Which source systems Loopy connects to, on what permissions, with what audit trail.
- **Model and key management.** BYOK across whichever providers the Council approves.
- **Observability.** Work Signal export, audit logs, performance monitoring, on-call rotation if self-hosted.
- **Plugin distribution.** The Cowork plugin lifecycle — packaging, versioning, distribution.

### What to do in the first 90 days

- **T-12 to T-9.** Read the cloud-vs-self-hosted decision tree (§2.4). Be honest about your team's bandwidth. If you do not have a platform team that can on-call a Postgres+Node service, advocate for cloud.
- **T-9 to T-6.** Stand up the staging environment. Test SSO. Test BYOK. Test SIEM export.
- **T-6 to T-3.** Run a security review with your security team. Tabletop the kill-switch. Write the runbook for "Loopy is down."
- **T-3 to T-0.** Stand up production. Onboard the Council to the Cowork plugin. Validate end-to-end Loops in shadow mode.
- **Months 1–3.** Attend Council weekly. Report on platform health, incident count, integration status.
- **Months 4–9.** Scale integrations. Add wave-by-wave data sources. Run quarterly disaster-recovery tabletops.
- **Month 12.** Annual security review. Renew SOC2/ISO mapping if applicable.

### What to be careful about

- **Over-customization.** The Loopy core is open source and tempting to fork. Do not fork unless you have a *named, durable, business-justified divergence* from the upstream. Most "we'll just patch this" turns into a maintenance burden that compounds.
- **Under-budgeting LLM costs.** BYOK costs scale with Loop volume. A successful deployment will *increase* its LLM spend over time, not decrease it. Budget conservatively for Year 1 ($30k–$120k) and reforecast quarterly.
- **Leaving the kill-switch undocumented.** Every Council member should know how to pause a single Loop. The implementation lead and the on-call should know how to pause the platform. Test this in tabletop, not in incident.
- **Mis-permissioning agent tokens.** An agent token with too-broad scope is a security risk. Issue per-user tokens with minimum scope; rotate quarterly.

### Key technical artifacts you produce

- Architecture diagram (ours in §11.10 as a starting point)
- Runbook for incidents (Loop-level, platform-level)
- Integration map: source systems → Loopy → destinations
- BYOK key inventory and rotation schedule
- Quarterly platform health report for Council

## 5.4 CHRO / Head of People

### Your job

You own the human side of the implementation. The technology will be installed regardless of what you do. Whether the workforce trusts it depends almost entirely on you.

Your responsibilities:

- **The AI Contribution Charter.** Drafting and stewarding. Templates in §11.4.
- **Training.** Curriculum design and delivery for each role in each wave.
- **Role evolution.** Job description updates, career ladder updates, performance review evolution.
- **Change communications.** All-hands scripts, FAQs, manager talking points, listening sessions.
- **Workforce sentiment.** Baseline survey before launch; pulse surveys quarterly; deep dive at month 9.
- **The kill-switch for harm.** If a Loop is producing harm to a worker (bias, misuse, opacity), you can pause it.

### What to do in the first 90 days

- **T-12 to T-9.** Brief HR business partners. Ensure they hear about the program from you, not from rumor.
- **T-9 to T-6.** Conduct the **workforce baseline survey** — sentiment about AI, trust in leadership, experience of past transformations. Do this *anonymously* and report the results to the Council. The numbers will surprise you and they are critical to plan against.
- **T-6 to T-3.** Draft the AI Contribution Charter. Run it past employee representatives, legal, and the workforce voice on the Council. Iterate. The Charter must be readable to a frontline employee.
- **T-6 to T-3.** Design the training curriculum (curriculum outline in §7.3).
- **T-3 to T-0.** Train the Council. Train the pilot owners. Prepare the manager talking points for the Phase 2 announcement.
- **Months 1–3.** Run pilot-cohort training. Run weekly office hours. Begin role-evolution conversations with pilot owners.
- **Months 4–9.** Run wave-by-wave training. Update job descriptions for first three job families.
- **Month 9.** Pulse survey #2. Compare to baseline. Report to Council.
- **Month 12.** Annual Charter review with employee representatives. Recommendations for Year 2.

### What to be careful about

- **Avoid HR speak.** The Charter and the all-hands cannot read like a corporate communication. If they sound like a layoff notice, the workforce will read them as one. Use the workforce voice on the Council to pressure-test every word.
- **Manager enablement.** The most common point of communication failure is the manager. Workers hear about Loopy from the all-hands, then ask their manager — and if the manager is uninformed or dismissive, the announcement evaporates. Manager talking points must precede the all-hands by 48 hours.
- **Performance review evolution must lag adoption.** If you change performance reviews to require Loopy use *before* people are competent with it, you will create a panic. Update reviews in Phase 4, not Phase 2.
- **Compensation should not be tied to IPL.** Be very careful here. If individual IPL becomes a comp metric, people will inflate it (by counting bad work) or game it (by routing low-value tasks through Loops to harvest hours). IPL is a *team and organization* metric.

### Key HR artifacts you produce

- Workforce baseline survey (and quarterly pulse)
- AI Contribution Charter
- Training curriculum (per role, per wave)
- Manager talking points for each major announcement
- Updated job descriptions for evolving roles
- Career ladder updates for Loop ownership tracks

## 5.5 CFO / Finance

### Your job

You own the financial discipline of the implementation. Specifically:

- **Budget.** Initial envelope, quarterly reforecasts, ROI tracking.
- **Capacity-to-cash translation.** Liberated hours are not cash savings. Your job is to make sure the executive team understands that and plans the redirection accordingly.
- **LLM cost management.** Most underestimated line item. You will be the one calling out runaway costs.
- **Audit posture.** Many regulated companies will need finance involvement in the SOX-like control environment around Loopy.

### What to do in the first 90 days

- **T-12 to T-9.** Sign off on the budget envelope. Write the IPL valuation methodology your team will use (per §2.3) and circulate it for executive alignment.
- **T-7.** Approve the LLM provider contracts. Negotiate reserved capacity if your projected volume warrants it.
- **T-3.** Sign off on the AI Risk Posture from a financial-controls perspective.
- **Months 1–3.** Establish the monthly finance check-in: actual LLM spend, Loop count, IPL by department.
- **Months 4–9.** Quarterly ROI report to the executive team. Compute IPL value, compare to spend, narrate the redirection of capacity.
- **Month 12.** Annual budget for Year 2. Lessons from Year 1.

### What to be careful about

- **Do not promise cash savings.** IPL is a capacity metric. Cash savings only materialize if you redirect capacity into revenue or *retire* roles — and we strongly recommend not retiring roles in Year 1 (see §7.6).
- **Do not over-discount the LLM cost projection.** Real deployments grow LLM spend 20–40% quarter-over-quarter in the first year as more Loops come online. Budget for the curve, not for the start.
- **Monitor for "vanity Loops"** — Loops that exist to generate IPL numbers without producing real value. Atlas will flag candidates; the Council should enforce retirement.

## 5.6 Legal / Compliance / Risk

### Your job

You own the regulatory and legal posture. Your responsibilities:

- **AI policy.** The internal-facing document that complements the workforce-facing Charter. Covers acceptable use, model selection, data handling, and disclosures.
- **Regulatory categorization.** Per Loop, in jurisdictions where it matters (EU AI Act, sector regulators).
- **Data protection.** GDPR, CCPA, and equivalents — lawful basis, retention, subject rights.
- **Vendor management.** Model providers, integration partners, hosting vendors.
- **Incident response.** When something goes wrong, you decide what to disclose, to whom, and when.

### What to do in the first 90 days

- **T-12 to T-9.** Brief the executive team on the regulatory landscape relevant to your jurisdiction and industry. The EU AI Act, evolving US state laws, and sector regulators are moving quickly.
- **T-9 to T-6.** Draft the internal AI policy. Coordinate with HR on the Charter.
- **T-6 to T-3.** DPA execution with model providers. Categorize each pilot Loop's risk tier. Sign off on the AI Risk Posture.
- **T-3 to T-0.** Tabletop exercise: incident response. What if a Loop produced a discriminatory output? What if a regulator asked for an audit? What if a Work Signal stream leaked?
- **Months 1–3.** Attend Council. Approve each new Loop's risk classification.
- **Months 4–9.** Quarterly review of the Loop catalog from a compliance lens.
- **Month 12.** Annual policy review. Regulatory horizon scan.

### What to be careful about

- **Do not let "we'll handle it later" risk-tier categorization slide.** Every active Loop must have a categorization. The Council does not activate without one.
- **Do not over-rotate to a single regulation.** The EU AI Act is important, but so is US sector law, GDPR, and emerging frameworks. Build a regulatory matrix once and maintain it.
- **Discovery posture matters.** Work Signals are discoverable in litigation. Treat them as such — retention policy, access controls, and litigation-hold readiness all matter.

## 5.7 Department Heads

### Your job

You are the most critical role in the rollout. You are the one whose teams will or will not adopt Loopy. The all-hands does not adopt Loopy; you do, and your team follows your lead.

Your responsibilities:

- **Identify Loops in your domain.** Run the legibility phase in your team. Submit Loop candidates.
- **Own pilot Loops.** If your department is a pilot domain, you own the Loops. The owner is *you*, not a delegate.
- **Manage the change in your team.** Hold listening sessions. Translate the all-hands to your team's specifics. Surface fear and doubt to the Council.
- **Redirect liberated capacity.** When your team's IPL grows, you decide what new work fills the time.
- **Retire work.** If a Loop reveals that a process is unnecessary, you stop doing it.

### What to do in the first 90 days (if you are a pilot domain head)

- **T-9 to T-6.** Run the legibility phase. Be present in the exercises; do not delegate.
- **T-6 to T-3.** Submit your Loop candidates with R-I-V-O scores. Defend them in Council review.
- **T-3 to T-0.** Walk your team through the upcoming change before the all-hands. Manager talking points will arrive 48 hours before the all-hands; use them.
- **Months 1–3.** Be in the Cowork plugin yourself daily. Demonstrate use. Schedule weekly Loop reviews with your team.
- **Months 4–9.** Submit new Loop candidates as your team's confidence grows. Review and retire Loops that are not delivering.
- **Month 9.** Lead the role-evolution conversation in your domain. Update job descriptions. Revise career conversations.

### What to be careful about

- **Do not delegate the early adoption.** If you ask your team to use Loopy and you do not, they will read your absence as the real signal.
- **Do not over-promise to your team.** Specifically, do not promise "your job will not change." Roles will evolve. What you can promise is fairness, transparency, and support.
- **Do not let Loops become a status game.** Some teams will try to compete on Loop count. The Council will (correctly) shut this down. Compete on Confidence Index and IPL, not Loop count.

## 5.8 Individual Contributors

### Your job

You will use Loopy daily. You will own one or more Loops. You will be the one who notices when a Loop is producing bad output, when a process is wasteful, when a new Loop should exist.

Your responsibilities:

- **Use the Cowork plugin** as part of your daily work, after you are trained.
- **Surface Loop candidates** when you notice repetitive cognitive work.
- **Own the Loops you are assigned**, including their Confidence Index and IPL.
- **Speak up.** If a Loop produces a wrong answer, say so. The Council depends on this signal. Do not assume someone else will report it.

### What to expect

- **Week 1 of training.** A 90-minute live session covering Loops, the Cowork plugin, the Charter, and the channels for asking questions.
- **Week 2.** Setup of your Cowork plugin and your first interaction with an active Loop.
- **Weeks 3–8.** Adoption. By week eight you should be using Loopy multiple times per week. If not, that is data — tell your manager.
- **Months 3–6.** First Loop ownership. You will likely be asked to own a small Loop in your domain.
- **Months 6–12.** Role evolution conversations. Your job description may change. This is a managed conversation; you are entitled to clarity.

### What you are entitled to

- A clear AI Contribution Charter explaining what Loopy will and will not do with your work.
- Training before being expected to use Loopy.
- A channel to report concerns without going through your manager (typically the People Lead's office).
- Honest answers when you ask "what does this mean for my role?"
- A say in the role-evolution conversations affecting your job family.

---

# Part VI — Operations & Governance

This Part covers the operating cadences, hygiene practices, and governance levers that keep a Loopy deployment healthy after launch. It is dense by design — most of it is reusable operating-procedure material.

## 6.1 The Operating Cadences

A healthy Loopy deployment has five cadences. They overlap and reinforce each other.

| Cadence | Frequency | Owner | Purpose |
|---|---|---|---|
| Loop owner check-in | Daily (Phase 1–2) → Weekly (Phase 3+) | Loop owner | Review signals, approve outputs, tag anomalies |
| Council meeting | Weekly (Pilot) → Biweekly (Scale) → Monthly (Embed) | Implementation Lead | Catalog hygiene, decisions, escalations |
| Department review | Monthly | Department head | Department IPL, Confidence Index, Loop adoption |
| Executive operating review | Monthly | COO / Sponsor | Org-wide IPL, key risks, wave progress |
| Workforce listening | Quarterly | People Lead | Pulse survey, listening sessions, feedback synthesis |

Each cadence has a fixed agenda. We provide the agendas in §11.11.

## 6.2 Loop Hygiene

A Loop catalog left untended decays. The hygiene discipline is what keeps it useful. There are five hygiene practices.

### Practice 1 — Naming conventions

Every Loop has a name in the format:

```
[Domain] / [Verb-noun] / [Cognitive Layer]
```

Examples:

- `Sales / Triage-inbound-leads / Perception`
- `Customer Success / Draft-renewal-email / Action`
- `Engineering / Classify-incoming-bugs / Interpretation`
- `Finance / Approve-expense-report / Decision`
- `HR / Summarize-exit-interview / Reflection`

This convention sounds bureaucratic. It is not. It makes the catalog navigable. Do not skip it.

### Practice 2 — Owner accountability

Every Loop has exactly one named human owner. Not a team. Not "the agent." A person, with a calendar, who is on the hook.

When an owner leaves the company, the Loop is paused immediately and reassigned within 14 days, or retired. Orphan Loops are how catalogs decay.

### Practice 3 — Review cadence

Every Loop is reviewed on a schedule based on its Confidence Index:

- Confidence < 50: weekly by the owner, monthly by the Council.
- Confidence 50–70: biweekly by the owner.
- Confidence 70–80: monthly by the owner.
- Confidence > 80: quarterly by the owner.

The review is structured: *did the Loop run as expected? did it produce useful output? are there anomalies in the signals?*

### Practice 4 — Retirement criteria

A Loop is retired when *any* of:

- Confidence < 50 for more than 60 days with no remediation plan.
- Owner cannot articulate the value in one sentence.
- The work is no longer being done by the organization.
- The work has been better automated by another system.
- Two consecutive quarterly reviews fail to renew the Loop's mandate.

Retirement is a feature, not a failure. Retirement signals that the catalog reflects the work the organization actually values *now*.

### Practice 5 — The quarterly retirement cycle

Every quarter, every Loop owner answers two questions in writing:

1. *Is this Loop still worth running?*
2. *If I were creating this Loop today, would I create it in this exact form?*

The Council reviews these answers in aggregate. Loops where the owner cannot defend continued operation are retired. Plan for 10–25% retirement per quarter in mature deployments — that is healthy turnover.

## 6.3 The Confidence Index, Operationally

The Confidence Index is automatic — Loopy computes it. But the *thresholds* are decisions, and the *responses* are policy. Here is the operational playbook.

### Computing the index

Loopy's Confidence Index is a weighted blend (default weights, adjustable per organization):

- Coverage: 25%
- Cadence: 15%
- Completion: 25%
- Outcome: 25% (when measurable; reweighted to other dimensions when not)
- Hygiene: 10%

Each component is computed against the Loop's specification — its expected inputs, its expected schedule, its completion criteria, its outcome metric, and its metadata fields.

### Thresholds and response

| Index | Status | Response |
|---|---|---|
| 90+ | Excellent | Use the Loop's outputs in standard reporting; surface as a model in the catalog |
| 80–89 | Trusted | Standard operation; quarterly review |
| 70–79 | Trusted with oversight | Standard operation; monthly review |
| 50–69 | Monitored | Owner reviews biweekly; Council aware |
| 30–49 | At risk | Owner has 14 days to produce a remediation plan; Council reviews |
| < 30 | Failed | Loop is paused; remediation or retirement within 30 days |

### Anti-gaming guardrails

The Confidence Index can be gamed if you let it become a performance metric for owners. The discipline:

- The Index is a *trust* metric for the Council, not a performance metric for owners.
- Owners are not measured on their Loops' Confidence Index. They are measured on whether they responded appropriately to whatever Index their Loops produced.
- The index is computed automatically; owners cannot edit it.
- Anomalous index movements (large jumps with no change in Loop config) are flagged by Atlas for Council review.

## 6.4 The IPL, Operationally

The IPL is reported at three levels: personal, team, organizational. Each has its own operational discipline.

### Personal IPL

Each Loopy user sees their personal IPL — hours liberated this month by Loops they own or are part of. The personal IPL is *informational*. It is not reported up to the manager, not shown in performance reviews, not tied to compensation. It is shown to the user so they can self-assess and so they can make informed decisions about which Loops to lean on.

### Team IPL

Team IPL is reported in the department review. It is the sum of personal IPL across team members, deduplicated for Loops that span multiple owners. The department head sees the team IPL alongside Loop count, average Confidence Index, and adoption rate.

Team IPL *can* be a department-level KPI. It should be set as a target alongside other operational KPIs and reviewed quarterly. We recommend targets of 200–600 hours/month per 10 knowledge workers in the first year, scaling up over time.

### Organizational IPL

Organizational IPL is reported in the executive operating review and the QBR. It is the sum across teams. The executive view also includes:

- IPL per dollar of LLM spend (efficiency).
- IPL per Loop (Loop quality).
- IPL by cognitive layer (where amplification is concentrated).
- IPL by department (where adoption is leading and lagging).

Organizational IPL *should* appear in board materials starting in Phase 3 (Month 6+). Be careful to caveat it as a capacity metric, not a cash-savings metric.

### Common IPL pitfalls

- **Counting hours that were not real.** Vanity Loops inflate IPL. The Confidence Index is the cross-check.
- **Counting hours twice.** A Loop that triggers another Loop double-counts unless you account for cascades. Atlas surfaces these.
- **Ignoring the redirection question.** Liberated hours that go nowhere are not real value. Track redirection at the team level: *what did the team do with the freed time?*
- **Using IPL as a layoff metric.** The fastest way to destroy trust. Do not do this. (See §10.4.)

## 6.5 Team Loopy in Operation

Team Loopy — Nova, Atlas, Vega, Echo, Orion — are not "extra agents." They are the operating system of your deployment. Each has a place in the operating cadences.

### Nova in operation

Nova translates work into Loops. Use Nova when:

- A Loop candidate has been identified but not yet structured.
- An ad-hoc piece of work in Slack/Teams looks like it might be a Loop.
- A Loop owner wants to revise the structure of their Loop.

Council pattern: at every meeting, review the new Loop candidates Nova has surfaced from the past period. Decide which to instantiate.

### Atlas in operation

Atlas orchestrates the catalog. Use Atlas for:

- Duplicate Loop detection.
- Stuck Loop reports (Confidence Index trending down).
- Orphan Loop alerts.
- Cross-domain conflict surfacing.

Council pattern: Atlas's report is a standing agenda item at every Council meeting.

### Vega in operation

Vega is the analyst. Vega computes:

- Monthly IPL by team and organization.
- Confidence Index distributions.
- ROI estimations.
- Stuck Loop diagnostics.
- Adoption by department.

Council pattern: Vega's monthly summary feeds the executive operating review and the QBR.

### Echo in operation

Echo handles agent-to-agent and human-to-agent coordination. Use Echo when:

- A Loop needs input from another Loop.
- Work needs to be transferred between owners.
- Escalations cross departments.

Council pattern: review Echo's escalation log monthly to detect patterns.

### Orion in operation

Orion is the registry. Orion knows:

- Which agents are deployed.
- Which skills are installed.
- Which integrations are connected.
- Which versions of the protocol each is running.

Council pattern: Orion's inventory is reviewed quarterly. Anything older than two minor versions of the protocol gets flagged.

## 6.6 Incident Response

Incidents will happen. Plan for them. The structure:

### Severity levels

- **Sev-3 — Loop misbehavior.** A Loop produced an unexpected output, but no external harm. Pause the Loop, fix, redeploy, document.
- **Sev-2 — Localized harm.** A Loop produced output that caused harm to a customer, a vendor, or a worker. Pause the Loop, notify affected parties, conduct a Loop-level review, document.
- **Sev-1 — Systemic harm.** Multiple Loops are misbehaving, or a single Loop produced harm that crosses departmental, regulatory, or public-facing boundaries. Pause the platform, escalate to executive sponsor and legal, run the full incident response playbook.

### Response steps for each severity

```
SEV-3 RESPONSE
1. Loop owner pauses the Loop.
2. Loop owner files an incident note in the Loop's signal stream.
3. Council reviews at next weekly meeting.
4. Owner publishes a one-paragraph postmortem within 14 days.

SEV-2 RESPONSE
1. Loop owner pauses the Loop.
2. People Lead and Risk Lead are paged.
3. Affected parties notified within 48 hours.
4. Council convenes within 5 business days.
5. Postmortem published to all relevant stakeholders within 14 days.

SEV-1 RESPONSE
1. Implementation Lead pauses the platform.
2. Executive Sponsor, Legal, Risk, and People Lead paged immediately.
3. Crisis communication plan activated.
4. Regulatory disclosure if applicable (Risk Lead decides).
5. Council convenes within 24 hours, then daily until resolved.
6. Postmortem published company-wide within 30 days.
7. Board notification.
```

### The kill-switch

Three people must be able to pause the platform end-to-end at any moment:

- The Implementation Lead.
- The on-call platform engineer (if self-hosted) or the support contact (if cloud).
- The Executive Sponsor.

Test the kill-switch in tabletop quarterly. The first time you exercise it should not be in a real incident.

## 6.7 The QBR

Quarterly Business Reviews of the Loopy program are the executive forum where the program proves its continued value. The QBR has a fixed structure (template in §11.12):

1. **State of the catalog.** Number of Loops, by status, by department.
2. **State of trust.** Average Confidence Index, distribution, anomalies.
3. **State of capacity.** Organizational IPL, by department, with redirection commentary.
4. **State of adoption.** Active users, by department, by wave.
5. **State of risk.** Open incidents, regulatory posture changes, audit findings.
6. **State of cost.** LLM spend, hosting cost, total cost of ownership; cost per liberated hour.
7. **Decisions for the quarter.** Loops to retire, Loops to add, role-evolution decisions.
8. **Workforce sentiment.** Pulse survey results.
9. **Forward look.** Next quarter's targets.

The QBR is presented by the Implementation Lead with the Executive Sponsor, and attended by the Council and the executive team. It is the principal forum where the program is renewed, revised, or rebudgeted.

---

# Part VII — People & Culture

The technology will be installed regardless of how well you handle the people side. Whether the workforce trusts the technology, uses it, and grows with it depends entirely on the people side. This Part is the longest in the Playbook for that reason.

## 7.1 The Change Curve, Loopy-Specific

The classical change curve — denial, anger, bargaining, depression, acceptance — applies to AI rollouts but with a specific twist. With Loopy you should plan for *two* curves: one for **owners** (people who will run Loops) and one for **observers** (people who will be affected by Loops they do not own).

### The owner curve

Owners typically pass through four states:

1. **Curiosity.** They are intrigued. They volunteer for the pilot. They build their first Loop with enthusiasm.
2. **Frustration.** Their Loop does not work as well as they hoped. The agent makes mistakes. They wonder if the time saved was worth the configuration time spent.
3. **Calibration.** They figure out which work is amplifiable and which is not. They retire some Loops, refine others. They start to feel real leverage.
4. **Fluency.** They think in Loops. They surface new candidates regularly. Their job has evolved and they prefer the new shape.

The Frustration phase usually peaks around Week 4–6 of pilot work. This is when implementations lose owners if there is not active support. The Council should *expect* it and respond with extra coaching, not interpret it as failure.

### The observer curve

Observers — people who hear about Loopy but are not yet using it — pass through different states:

1. **Anxiety.** What does this mean for my job? Will I be replaced? Will my work be surveilled?
2. **Wait-and-see.** They do not engage actively, but they listen for signals from leadership and from peers.
3. **Engagement.** Once they see colleagues use Loopy productively without negative consequence, they engage.
4. **Adoption.** They become users.

The Anxiety phase is shaped almost entirely by the **first three communications** — the Phase 2 all-hands, the Charter, and what their direct manager says. If those communications are clear, honest, and credible, the Anxiety phase passes quickly. If they are evasive or boilerplate, the Anxiety phase calcifies into resistance.

## 7.2 The Workforce Baseline Survey

Run an anonymous survey *before* the Phase 2 announcement. Repeat quarterly. The survey is the most underused tool in AI rollouts.

### ❖ Template — Workforce Baseline Survey

The survey should take 8–10 minutes. Use a 5-point scale (Strongly disagree → Strongly agree) unless otherwise noted. Mix mandatory questions with optional free-text.

**Section 1 — Trust in leadership and change**

1. I trust [Company]'s leadership to make decisions in the long-term interest of employees.
2. The last major change initiative at [Company] was handled well.
3. I have a clear understanding of [Company]'s strategic priorities for the next 12 months.

**Section 2 — Current experience of work**

4. There is too much repetitive cognitive work in my role.
5. I have enough time to do the parts of my job that require deep thinking.
6. I have access to the information I need to do my job well.

**Section 3 — AI today**

7. I currently use AI tools in my work (yes / no / sometimes).
8. I feel competent using AI tools in my work.
9. I am concerned that AI will affect my role at [Company].
10. I trust that [Company] will use AI in ways that are fair to employees.

**Section 4 — Open questions**

11. *In one or two sentences:* what part of your work would you most like to amplify with AI?
12. *In one or two sentences:* what is your biggest concern about AI being introduced at [Company]?
13. *In one or two sentences:* what would have to be true for you to be a public supporter of AI being used in your team?

Aggregate by department, tenure, and seniority. Report to the Council. Use the patterns to shape the Charter, the all-hands, and the manager talking points.

The most important number to track over time is **Question 10**: *I trust that [Company] will use AI in ways that are fair to employees.* If this number declines from baseline to month 9, you have a trust problem. If it rises, you have built trust.

## 7.3 Training Curriculum

Training is not a video. It is a structured program. Plan for three tracks: **General**, **Owners**, and **Leaders**.

### Track 1 — General (90 minutes, all employees)

Single live session, recorded for replay. Delivered cohort-by-cohort during their wave's onboarding.

**Module 1 (15 min) — What is Loopy?** The thesis (amplification not replacement). The five cognitive layers. The Loop concept. The Charter.

**Module 2 (20 min) — Concepts you will encounter.** Work Signals, Loops, IPL, Confidence Index. Show, do not tell — use real screenshots from the deployment.

**Module 3 (30 min) — Hands-on with the Cowork plugin.** Setup. First interaction. How to use Loopy in the daily flow of work. Live troubleshooting.

**Module 4 (15 min) — How this affects your role.** Honest discussion of role evolution. Current company commitments. The redirection of liberated capacity.

**Module 5 (10 min) — Q&A.** Live, with a Council member present. Hard questions welcomed.

### Track 2 — Owners (3 hours, split into 90-minute sessions)

For people who will own one or more Loops. Cohort size 8–15.

**Session 1 — Designing a Loop (90 min).** Cognitive layers. The Loop Candidate Worksheet. Reversibility. Owner readiness. R-I-V-O scoring. Hands-on: design a Loop end to end.

**Session 2 — Operating a Loop (90 min).** Shadow mode. Confidence Index. Reviewing signals. Handling anomalies. Iteration. Hands-on: walk through a live Loop.

A 30-minute manager check-in 4 weeks later.

### Track 3 — Leaders (full day, split into two half-days)

For department heads, Council members, and senior managers.

**Half-day 1 — Strategy and governance.** The thesis. The maturity model. The Council. The Charter. The IPL framing. The retirement discipline. Discussion: what should we retire?

**Half-day 2 — Change management and role evolution.** The change curve. The role-evolution conversations. The compensation question. The communication patterns. Practice: workshop on a role evolution case.

### Refresh cadence

- General: at hire (week one), then refresher annually.
- Owners: at first ownership, then upon any major Loop change, then annually.
- Leaders: at promotion to a leader role, then annually.

## 7.4 Communication Templates

The following templates are starting points. Adapt to your tone of voice. The structural elements should be preserved.

### ❖ Template — Phase 2 All-Hands Script (CEO or Sponsor delivers)

> "Good morning. I want to take ten minutes today to talk about something we are starting at [Company] called Loopy.
>
> Here is what it is, in plain English. Loopy is an internal program to make AI work for us in a structured way. We have been using AI in scattered ways for a while now — different teams, different tools, different practices. That has produced some wins and a lot of confusion. Loopy is how we bring structure to it.
>
> The unit Loopy works in is called a Loop. A Loop is a piece of recurring work — something we do over and over — that we are choosing to instrument. Every Loop has a clear owner — a real person on this team. Every Loop has a clear input and output. Every Loop runs partly through humans and partly through AI agents, with a clear audit trail of what each side did. We measure the AI's contribution in hours liberated for humans — what we call the IPL. We measure each Loop's reliability with a score we call the Confidence Index.
>
> We have been piloting this for the past three months in [pilot domains]. Today we are expanding it.
>
> Three things I want you to hear from me directly.
>
> First — this is not a layoff initiative. We are not deploying Loopy to reduce headcount. We are deploying it to grow our capacity to do the work in front of us without burning out our people. Hours liberated by Loopy will be redirected to higher-leverage work — work we previously could not afford to do. If that ever changes, you will hear it from me directly, not as a quiet implication.
>
> Second — we have published an AI Contribution Charter. It is a one-page document that says what Loopy will and will not do, how decisions get made, and how you can raise concerns. I want you to read it. I want you to tell us where it falls short. The link is in this morning's email.
>
> Third — your role will evolve. Some of you will own Loops. Most of you will work alongside Loops that other people own. Over the next year, parts of how you spend your time will shift. We are committed to walking that with you — with training, with role conversations, and with honest answers to honest questions. Your manager has talking points for the conversations you will want to have with them this week.
>
> The team running this is the Loopy Council — seven people across leadership, IT, HR, legal, and the workforce. The workforce voice on the Council is [name]. If you want to surface a concern, [name] is the channel that is not your manager.
>
> I will speak about Loopy at every all-hands going forward. We will report IPL and Confidence Index at the next QBR. We will take your questions seriously.
>
> Thank you."

### ❖ Template — Manager Talking Points (delivered 48 hours before all-hands)

> **Subject: Loopy launch — what to know before tomorrow's all-hands**
>
> Hi managers — tomorrow [the CEO/COO] will speak at the all-hands about a program called Loopy. You may get questions from your team this week. Here is what you need to know.
>
> **What is Loopy?** A program to deploy AI agents in a structured, governed way across recurring work. Built on an open-source platform we control. Run by a cross-functional Council with workforce representation.
>
> **What is changing for my team?** Probably nothing in the next 4 weeks. Onboarding is wave-by-wave; your team's wave is [date range]. Before that, [team's manager / Council member] will walk you through what your team's Loops will look like.
>
> **What if my team asks "will I lose my job?"** The honest answer: no — not because of Loopy. We are deploying this to grow capacity, not to reduce headcount. If that ever changes, you will hear it from leadership before your team does. Roles will evolve over time. Evolution will be a managed conversation, with training and support.
>
> **What if my team asks "is my work being surveilled?"** Loopy logs Work Signals — events inside Loops, like a draft being created or approved. It does not log keystrokes, screen activity, or activity outside the Cowork plugin. The audit trail is for the Loop, not for the worker. Access to Work Signals is restricted to the Loop owner, the Council, and audit when applicable.
>
> **What if my team asks "what about my career?"** Career ladders will evolve. Loop ownership and Loop architecture are emerging tracks. Your HRBP is preparing role-conversation guidance.
>
> **What you should do this week:**
>
> - Read the AI Contribution Charter (linked).
> - Hold a 20-minute team conversation Friday: "what did you hear, what are your questions?"
> - Bring your team's questions to your HRBP.
> - Encourage anyone with concerns to use the workforce voice channel: [name, contact].
>
> Office hours for managers: Tuesday 11am, Thursday 2pm, with [Council members].
>
> Thanks for stewarding this with us.

### ❖ Template — All-Hands FAQ (posted morning of all-hands)

```
LOOPY — FREQUENTLY ASKED QUESTIONS

Q: Is Loopy going to take my job?
A: No, not because of Loopy. We are deploying Loopy to grow capacity,
   not to reduce headcount. Your role may evolve over time; that is a
   managed transition, with training and support. Our commitment is
   transparency: if our position on this changes, you will hear it
   directly, not as a quiet implication.

Q: Is Loopy surveilling my work?
A: No. Loopy logs events inside Loops — like a draft being created or
   approved. It does not log keystrokes, screen activity, or work
   outside the Cowork plugin. Access is restricted to the Loop owner,
   the Council, and audit when applicable.

Q: What is the IPL? Will I be measured on it?
A: The IPL is hours of human work liberated by AI agents in a Loop.
   It is reported at the team and organizational level. It is not used
   as an individual performance metric, and it is not tied to
   compensation.

Q: Who decides which Loops get built?
A: Loops are proposed by anyone, scoped by the team where the work
   lives, and approved by the Loopy Council. The Council includes a
   workforce voice — [name].

Q: What if a Loop produces a bad outcome?
A: There is an incident response process (Sev-1 / Sev-2 / Sev-3).
   Any Loop owner, any Council member, and the on-call engineer can
   pause a Loop. Sev-2 and Sev-1 incidents trigger affected-party
   notification within 48 hours.

Q: How do I report a concern about Loopy?
A: Three channels:
   - Your manager
   - Your HRBP
   - The workforce voice on the Council: [name, contact]

Q: How is my data protected?
A: [Brief description of data classification, hosting choice, BYOK,
   retention policy. Reference the AI Risk Posture document.]

Q: Can I opt out?
A: For training and learning, no — Loopy is part of how work happens
   here. For specific Loops affecting your role, raise it through the
   channels above and the Council will review.

Q: How is Loopy related to other AI tools we use?
A: Loopy is the structured layer. You may still use other AI tools
   (e.g., Claude, ChatGPT, Copilot) for ad-hoc work; Loopy is for
   recurring instrumented work.
```

## 7.5 The AI Contribution Charter

The Charter is the public-facing commitment to the workforce. It is one page. If it is longer, it does not get read. It is signed by the Executive Sponsor and the Workforce Voice. It is reviewed annually.

### ❖ Template — AI Contribution Charter (one page)

```
[COMPANY] — AI CONTRIBUTION CHARTER

Effective: [date]
Reviewed annually.

Our intent. We deploy AI to amplify the work of our people, not to
replace them. We measure success in hours liberated for higher-value
work, not in headcount reduced.

Our commitments to you.

1. NO LAYOFFS BECAUSE OF LOOPY. We are not deploying Loopy to reduce
   headcount. Liberated capacity will be redirected to growth and
   higher-leverage work. If our position on this changes, you will be
   told directly, with notice, not by quiet implication.

2. ROLE EVOLUTION WITH SUPPORT. Your role may evolve over time. We
   commit to: clear communication of changes, training before
   expectation of competence, and honest conversations about career
   trajectory. Role evolution decisions are made with HRBP, not
   unilaterally by managers.

3. TRANSPARENCY OF AGENTS. Every Loop has a named human owner, a clear
   purpose, and a complete audit trail of what the agent did. You can
   ask to see how a Loop affecting your work operates.

4. NO SURVEILLANCE. Loopy logs events inside Loops, not your activity
   outside Loops. We do not use Loopy for individual performance
   monitoring or for surveillance.

5. APPEALABLE DECISIONS. If a Loop produces a decision affecting you
   (e.g., a draft email about you, a triage outcome involving your
   work, a recommendation about your performance), you can request
   human review. The path is documented.

6. WORKFORCE VOICE IN GOVERNANCE. The Loopy Council includes a
   workforce voice — currently [name]. This seat is permanent.

7. DATA HANDLING. Your data flows through Loopy under [hosting choice]
   with [retention policy]. The full AI Risk Posture is published
   internally.

How to raise a concern.
- Your manager.
- Your HRBP.
- The workforce voice on the Council: [name, contact].

Signatures.
- Executive Sponsor: ______________________
- Workforce Voice:    ______________________
```

## 7.6 Role Evolution

This is the hardest part of the implementation and the most consequential. It is also the part most likely to be done badly. We give it a section of its own.

### The reality

Roles will change. Pretending otherwise is dishonest and destroys credibility when the reality becomes visible. The honest framing is:

- *Some* tasks within most roles will be substantially amplified.
- *Some* roles will see their composition shift — less of one type of work, more of another.
- *A few* roles will see significant evolution, requiring meaningful retraining or transition.

The art is to handle this honestly *and* without creating panic.

### The principles

**Principle 1 — Evolution, not elimination.** As a matter of policy in Year 1, you do not eliminate roles because of Loopy. You evolve them. Liberated capacity is redirected, retrained, or grown into. This buys trust. It also forces the organization to find the *real* high-value work, which is usually undervalued and underexplored.

**Principle 2 — Honest conversations, not boilerplate.** Role-evolution conversations happen one-on-one between the worker, their manager, and their HRBP. They are not delegated to a deck. They include: *what is changing in your work, what new capabilities are needed, what training will be provided, what the timeline looks like, what your career path looks like in the new shape.*

**Principle 3 — Career ladders include Loop ownership.** Update your career ladders to recognize:

- *Loop ownership* — a worker who owns and operates Loops in their domain.
- *Loop architecture* — a senior worker who designs Loop systems for their team.
- *Loop governance* — a leader who orchestrates Loops across teams.

These are real new tracks, with real new compensation bands. Add them to the ladder explicitly so people can see the path.

**Principle 4 — Time and budget for retraining.** Allocate dedicated time (not "after hours") and dedicated budget (per worker) for retraining in evolving roles. A typical Year 1 commitment is 80 hours of paid training time per evolving worker, plus tuition support.

**Principle 5 — Compensation does not regress.** A worker whose role evolves does not see compensation regress. Their old work was valuable; the new work is valuable; they are valuable. This is a non-negotiable principle in the first 24 months. Without it, the workforce reads the program as a stealth comp cut.

### The conversation script

A role-evolution conversation, conducted by a manager in collaboration with HRBP, runs roughly 60 minutes and covers:

> "I want to talk through how your role is evolving with the work we're doing in Loopy. I'll share where I see things going, then I want to hear your reaction.
>
> *[Manager describes specific changes: e.g., "About 15 hours a week of your time has been triaging incoming requests. With the triage Loop in place, that's down to about 4 hours. I'd like to redirect those 11 hours toward [specific higher-value work]."]*
>
> *[Manager describes new capability needs: e.g., "To do that work well, you'll need to build skills in [X]. We've allocated training time and budget for that — here's the plan."]*
>
> *[Manager describes career trajectory: e.g., "If you grow into this, your next role looks like [Y]. The compensation band evolves to [Z]. The timeline is [N months/years]."]*
>
> *[Manager opens for response.]* "What's your reaction? What concerns do you have? What would you change about this plan?"
>
> *[Closing commitments:]* "We'll meet in [N weeks] to check progress. Here's what I'm committing to. Here's what I'm asking of you. We can revisit any of this."

Do not skip steps. Do not deliver this as an email. Do not allow managers to delivery without HRBP coaching.

## 7.7 Resistance Patterns

Some resistance is healthy and should be heard. Some is sticky and needs structured response. The common patterns:

### Pattern 1 — "I'm too senior to need this."

Some experienced staff will resist Loopy as beneath them. They are typically not actually wrong — their judgment is genuinely better than the agent's at most things. The mistake is to argue. The right response is to invite them to *own* the Loops in their domain, designing the system that other people will use. This converts resistance into ownership.

### Pattern 2 — "I tried it once and it gave a wrong answer."

Common in Phase 1 and Phase 2. The right response is honest: "It will get things wrong. The discipline is to use it where the cost of a wrong answer is low and the volume is high. Where do you see that pattern in your work?" Do not oversell. Do not dismiss.

### Pattern 3 — "This is going to replace me."

The deepest resistance, often unspoken. The right response is the Charter — clearly, repeatedly, with visible behavior matching the words. If headcount actions are taken in the first 24 months that even *appear* to contradict the Charter, this resistance hardens into attrition.

### Pattern 4 — "My manager doesn't actually use this."

The clearest signal of an implementation failing. If managers do not use Loopy themselves, no amount of training will produce adoption in their teams. Address by requiring manager use as a condition of cohort onboarding.

### Pattern 5 — "I don't have time to learn this."

Often legitimate. The right response is to *give* time — protect 4–6 hours in the first month for training and Loop setup, with workload reductions elsewhere. If you do not give time, learning will not happen.

### Pattern 6 — "It's not worth it for the few hours it saves me."

The hardest legitimate critique. The right response is honest: not every role is a high-IPL role. For some roles the value is small. The deployment should be honest about which roles will and will not see meaningful amplification, and not push Loopy where it will not help.

---

# Part VIII — Technical Deep-Dive

This Part is written for the technology lead and platform engineers. It assumes basic familiarity with web infrastructure, containers, identity, and LLM APIs. It is reference material, not narrative — read it when you are building.

## 8.1 Architecture Overview

Loopy OSS is a Turborepo monorepo with the following components:

- `apps/web` — the Next.js web application; the user-facing interface.
- `apps/api` — the Node/TypeScript API service; serves the protocol and the web app.
- `packages/sdk` — the agent SDK; how external agents and the Cowork plugin talk to Loopy.
- `packages/protocol` — the Loop and Work Signal protocol definitions.
- `packages/db` — the database schema; Postgres via migrations.
- `packages/skills` — the built-in skills for Team Loopy.
- `packages/cowork-plugin` — the Cowork plugin that runs in Claude desktop.
- `packages/docs` — the documentation site.
- `docker/` — the Docker Compose stack for self-hosted deployment.

The runtime topology for a self-hosted deployment:

```
[Users / Cowork plugin]
        │
        ▼
   [Reverse proxy (nginx/caddy)]
        │
        ▼
   [apps/web (Next.js)]   ◄──►   [apps/api (Node)]
                                       │
                                       ▼
                                  [Postgres]
                                       │
                                       ▼
                          [Object storage (optional)]
                                       │
                              [LLM provider APIs]
```

For loopythinking.ai cloud, the same shape is operated for you. You get a tenant; you do not run the stack.

### Hardware sizing (self-hosted, as a starting point)

| Scale | Web/API | Database | LLM spend (BYOK) |
|---|---|---|---|
| 50 users | 2 vCPU / 4 GB | Postgres 14, 2 vCPU / 4 GB / 50 GB SSD | ~$1.5k–$5k/mo |
| 200 users | 4 vCPU / 8 GB | Postgres 14, 4 vCPU / 8 GB / 200 GB SSD | ~$5k–$15k/mo |
| 1000 users | 8 vCPU / 16 GB × 2 (HA) | Postgres 14 (HA), 8 vCPU / 16 GB / 500 GB SSD | ~$20k–$60k/mo |
| 5000 users | Auto-scaled cluster | Postgres HA, partitioned signals table | $80k+/mo |

These are starting points. Actual sizing depends on Loop volume, integration depth, and observability requirements.

## 8.2 Self-Hosting

For the standard self-hosted deployment, the steps are:

1. **Provision infrastructure.** A container orchestrator (Docker Compose for small deployments, Kubernetes for production at scale), a managed Postgres (RDS, Cloud SQL, Azure Database — or self-managed), a reverse proxy, and a secrets manager.
2. **Clone the repo.** `git clone https://github.com/LoopyThinking/loopy-oss.git`. Pin to a release tag, not `main`.
3. **Build the images.** Use the provided `docker/` configuration. The web and API are separate images so they can scale independently.
4. **Provision the database.** Run the migrations from `packages/db`. Migrations are forward-only.
5. **Configure environment.** Critical environment variables include:
   - `DATABASE_URL` — Postgres connection string.
   - `LOOPY_BASE_URL` — public URL of your deployment.
   - `LOOPY_ENCRYPTION_KEY` — 32-byte base64 key for encrypting BYOK secrets at rest.
   - `LOOPY_DISABLE_CRON` — set to `1` if you run scheduled tasks externally.
   - SSO-related variables (per your IdP).
   - Storage variables (S3-compatible).
6. **Configure SSO.** SAML 2.0 and OIDC are supported. Map your IdP groups to Loopy roles.
7. **Configure BYOK.** In the admin UI, add LLM provider credentials (Anthropic, OpenAI, Google, OpenAI-compatible). Encrypted with `LOOPY_ENCRYPTION_KEY`.
8. **Configure observability.** Wire metrics to your stack (OpenTelemetry, Prometheus). Wire logs to your aggregator. Wire Work Signal export to your SIEM.
9. **Configure the Cowork plugin.** Build the `.plugin` package with your `LOOPY_BASE_URL` baked in. Distribute via your standard internal channel (mobile device management, internal app store, or shared link).
10. **Smoke test.** Login. Issue an agent token. Run a Loop in shadow mode. Validate signals. Validate SIEM ingestion.

### High-availability considerations

For deployments above 200 users, plan for:

- Multi-AZ Postgres with read replicas.
- Two or more web/API replicas behind the proxy.
- A queue (e.g., BullMQ on Redis, or SQS) for async work like analytics jobs and digests.
- Backup-and-restore tested quarterly.
- Disaster-recovery runbook tested annually.

## 8.3 Identity and Access

### Authentication

SSO is strongly recommended even for small deployments. Local auth exists for bootstrapping but should be disabled in production.

Supported flows:

- SAML 2.0 (Okta, OneLogin, Azure AD, Google Workspace via SAML, etc.).
- OIDC (Keycloak, Auth0, etc.).

Each user receives a Loopy session JWT on login; the session JWT is exchanged for a per-user agent token used by the Cowork plugin and any A2A integration.

### Authorization

Loopy implements role-based access control with the following built-in roles:

- **Owner** — full administrative access. One per organization.
- **Admin** — full configuration access, user management, integration management.
- **Council** — access to the Council surfaces, governance dashboards, all Loops (read-only by default).
- **Loop Owner** — can create, modify, retire Loops they own.
- **Member** — can use Loops, view their own IPL.
- **Auditor** — read-only access to Work Signals; for compliance, audit, and risk teams.

Custom roles can be defined; map IdP groups onto roles.

### Agent tokens

Agent tokens are per-user, scope-limited credentials used by the Cowork plugin and any other agentic surface. Lifecycle:

- Issued on first plugin setup (`POST /me/agent-token`, idempotent).
- Stored in the user's plugin config (`LOOPY_AGENT_TOKEN`).
- Rotated on a schedule (default 90 days, configurable).
- Revoked on offboarding (automated via SCIM if configured).

Agent tokens cannot perform admin operations and cannot read Work Signals outside the user's own Loops.

## 8.4 Data Integrations

Loopy integrates with source and destination systems through *connectors*. Connectors run in the API tier and use OAuth where possible.

### Built-in connectors (Loopy OSS)

- Slack
- Microsoft Teams
- Google Workspace (Gmail, Calendar, Drive, Docs, Sheets)
- Microsoft 365 (Exchange, Outlook, OneDrive, SharePoint)
- GitHub / GitLab
- Linear / Jira
- Notion / Confluence
- Generic webhook (in/out)
- Generic SQL source (read-only, for analytics)
- Generic REST API (configurable)

### Cloud-only connectors (loopythinking.ai)

The cloud product includes an extended connector catalog covering many enterprise systems (Salesforce, HubSpot, Zendesk, ServiceNow, Workday, NetSuite, common BI tools, etc.). Self-hosted operators can build equivalents via the SDK; the open-core licensing is permissive of this.

### Building custom connectors

The SDK exposes a connector framework. A custom connector is a TypeScript module implementing:

- Authentication (typically OAuth or API key).
- Read operations (event streams, polling, webhooks).
- Write operations (create, update, append).
- Schema description (for Atlas to reason about).

Build connectors in your own repo and load them as packages. Do not fork the core to add a connector.

## 8.5 BYOK and Model Management

### Provider configuration

In the admin UI, configure one or more LLM providers. Each provider includes:

- Provider type (Anthropic, OpenAI, Google, OpenAI-compatible).
- Endpoint URL (for self-hosted or third-party gateways).
- API key (encrypted at rest with `LOOPY_ENCRYPTION_KEY`).
- Default models (specific model identifiers).
- Rate limit configuration.
- Cost cap (monthly maximum spend; alerts and hard cap).

### Loop-to-provider mapping

Each Loop can specify:

- Default provider and model.
- Fallback provider (for failover).
- Maximum cost per run.
- Whether this Loop is permitted to use models that may train on inputs (default: no, for any data classified Confidential or Restricted).

The model permissioning matrix is reviewed by Risk and Council quarterly.

### Cost observability

The admin UI includes cost dashboards by provider, by Loop, by department, and by user. Alerts fire at 60%, 80%, and 100% of monthly cost cap. Hard cap (configurable) suspends Loops if the cap is reached.

In year 1, expect cost growth quarter-over-quarter. Reforecast quarterly.

## 8.6 The Cowork Plugin

The Cowork plugin is how individual users interact with Loopy from their desktop AI client. It is the runtime that exposes Loopy skills (`loopy-bridge`, `loopy-loop-mapper`, `loopy-signal-emit`, `loopy-collab-bridge`, `loopy-ipl-tracker`, `loopy-qa`) to the user.

### Distribution

Loopy OSS plugin distribution is the operator's responsibility. The pre-configured `.plugin` file embeds the `LOOPY_BASE_URL` for the operator's instance. A typical distribution pipeline:

1. CI builds the `.plugin` from source on each release.
2. Plugin is signed (operator's key).
3. Plugin is hosted on the operator's internal portal.
4. Onboarding instructions point users to install Claude desktop and load the plugin file.

### First-run wizard

The first time a user opens the plugin, the `loopy-bridge` skill executes the setup flow:

1. Detect that `LOOPY_AGENT_TOKEN` is empty.
2. Prompt the user for their Loopy login (web SSO).
3. Exchange the resulting session JWT for an agent token.
4. Save the token in the plugin config.
5. Confirm registration with the API.

### Skill behavior

The bundled skills are activated by user intent (the LLM matches user prompts against the skill descriptions). Each skill emits Work Signals back to the API in real time, so the Loop catalog reflects the user's activity.

## 8.7 Audit, Logging, and SIEM Integration

### Work Signal lifecycle

Every event in Loopy produces a Work Signal:

- `loop.created`, `loop.updated`, `loop.retired`
- `signal.emitted` (the principal event — agent or human action within a Loop)
- `agent.invoked`, `agent.completed`, `agent.failed`
- `auth.login`, `auth.token_issued`, `auth.token_revoked`
- `policy.changed`, `confidence.recomputed`

Signals are stored in the database; for at-scale deployments, the signals table is partitioned by month.

### SIEM export

Three patterns are supported:

1. **Webhook push.** Loopy POSTs events to your SIEM webhook in near-real-time. Recommended for live security monitoring.
2. **Scheduled SQL pull.** Your SIEM connector pulls from the `signals` table on a schedule. Recommended for batch ingestion.
3. **S3-compatible export.** Loopy can be configured to write daily signal dumps to S3-compatible storage. Recommended for long-term archival.

### Retention

Default retention is 13 months. Configure based on industry:

- Financial services: typically 7 years.
- Healthcare: typically 6 years (US HIPAA) or longer per jurisdiction.
- General: 13–24 months.

Set retention in the database configuration; older signals are archived to cold storage.

## 8.8 Security Posture

### Threat model

The principal threats:

- **Credential theft** (agent token exposure) — mitigated by per-user tokens, rotation, and revocation.
- **Prompt injection through integrations** — mitigated by content sanitization, model permissioning, and Council review of high-risk Loops.
- **Data exfiltration via LLM** — mitigated by BYOK, model permissioning, and DPA enforcement.
- **Insider misuse** — mitigated by least-privilege roles, audit trails, and the kill-switch.
- **Platform compromise** — mitigated by standard infrastructure security (TLS, secrets management, OS hardening, patching cadence).

### Recommended controls

- Network: TLS 1.2+ everywhere; private networking between web/API and database; egress filtering for LLM endpoints.
- Secrets: managed via Vault/Secrets Manager; never in environment files committed to source.
- Database: encryption at rest; least-privilege application user; backups encrypted.
- Application: SCA/SAST in CI; dependency review; patch SLA (critical CVEs <= 7 days).
- Access: SSO with MFA enforcement; SCIM provisioning where possible.
- Audit: SIEM ingestion; alerting on suspicious patterns; quarterly access review.

### Compliance mappings

For organizations needing compliance attestation:

- **SOC 2** — most controls map cleanly to Loopy's existing audit trail. Operators are responsible for the surrounding control environment.
- **ISO 27001** — similar; the Annex A controls have natural counterparts in the Loop catalog.
- **HIPAA** — self-host strongly recommended; BAA with model providers required; PHI-handling Loops should be specifically reviewed.
- **EU AI Act** — risk categorization required per Loop; high-risk Loops trigger additional documentation requirements.
- **SOX** — Loop catalog can be mapped to SOX control language; financial Loops may be in-scope for ITGC/financial controls.

The compliance work is operator-specific. Loopy does not certify your environment; it provides the substrate.

## 8.9 Observability

### Application metrics

Default metrics emitted via OpenTelemetry:

- Request rate, latency, error rate (by endpoint).
- Loop run rate (by Loop, by status).
- Signal emission rate.
- LLM call rate, latency, cost (by provider, by model).
- Active sessions, active agents.

### Health checks

- `/healthz` — liveness.
- `/readyz` — readiness (DB connectivity, queue connectivity, LLM provider reachability).

Wire to your monitoring of choice; Prometheus and Datadog are tested.

### Recommended dashboards

For Council use:

- Loop catalog status (count by status, by department).
- Confidence Index distribution.
- IPL trend (organizational, by department).
- Adoption (active users, by department).

For platform team use:

- Service health.
- LLM cost burn-down.
- Integration health (per connector).
- Error rates and incident counts.

## 8.10 Upgrade Discipline

Loopy OSS releases follow semver. Operators should track minor releases at most one quarter behind upstream. The discipline:

- **Subscribe to GitHub Releases** for `loopy-oss`. Read the changelog for every release.
- **Test in staging** before production. Allow at least 7 days in staging.
- **Migration ordering**: database migrations are forward-only and applied automatically on startup. Take a database backup before upgrade.
- **Plugin compatibility**: the Cowork plugin must be within one minor version of the API. Plan plugin redistribution in lockstep.
- **Major versions**: read the migration guide before upgrading. Major versions may require operator action beyond automatic migrations.

---

# Part IX — Measuring Success

This Part is the metrics framework. It is opinionated about what to measure, what *not* to measure, and how to read the numbers honestly.

## 9.1 The Metric Hierarchy

Loopy metrics organize in three tiers:

**Tier 1 — Outcome metrics.** What changed in the world because of the deployment. Reported to the executive team and board.

**Tier 2 — Operating metrics.** How the program is operating. Reported to the Council.

**Tier 3 — Diagnostic metrics.** How specific Loops, agents, and integrations are behaving. Reported to Loop owners and the platform team.

Do not confuse them. Tier 3 metrics are *not* outcome metrics. Reporting them as outcome metrics produces vanity dashboards and erodes credibility.

## 9.2 Tier 1 — Outcome Metrics

### Organizational IPL

The principal Tier 1 metric. Hours of human work liberated by AI agents per month, organization-wide.

Reporting frequency: monthly to executive team; quarterly to board.

Targets:

- **End of Phase 2 (Month 3):** 200–600 hours/month at the pilot domain.
- **End of Phase 3 (Month 9):** 1,500–6,000 hours/month organization-wide for a 200-person company.
- **End of Year 1:** 3,000–10,000 hours/month for a 200-person company.

These ranges scale roughly linearly with knowledge worker count. They will vary by industry and by the cognitive composition of the workforce.

### Capacity Redirection Ratio

The share of liberated hours actually redirected to higher-leverage work. Reported quarterly.

A Capacity Redirection Ratio of 0.5 in Year 1 is realistic. Ratios above 0.7 are excellent. Ratios below 0.3 mean the gains are evaporating into general slack — concerning, and a signal to revisit the operating model.

### Workforce Sentiment Index

Composite score from the quarterly pulse survey. Track three sub-indices:

- Trust in leadership (Q1 of the survey).
- Comfort with AI at the company (Q9, Q10).
- Engagement with Loopy specifically (added Q after Phase 2).

Target: each sub-index should be *equal or higher* at month 9 than at baseline. If trust declines, the rollout is structurally problematic. Stop scaling and diagnose.

### Strategic Initiative Velocity

Optional but useful. The number of strategic initiatives the organization completed this year, vs the prior year. Loopy's promise is that liberated capacity allows you to do more strategic work; this metric tests the promise.

### Risk-Adjusted Decision Quality

Measured by the count of significant decision-quality incidents (escalations, customer complaints, regulatory findings, internal audit findings) compared against baseline. Target: 30% reduction in Year 1, 60% by Year 2.

## 9.3 Tier 2 — Operating Metrics

These are reviewed by the Council. Reporting frequency: weekly during Pilot, monthly after Scale.

### Loop Catalog Metrics

- **Loop count by status** (active, monitored, at risk, retired).
- **Loops created this period.**
- **Loops retired this period.**
- **Average tenure of active Loops.**
- **Coverage by department** (% of departments with at least one active Loop).

### Trust Metrics

- **Average Confidence Index** across active Loops.
- **Distribution of Confidence Index** (histogram).
- **Loops below threshold** (Confidence < 70 for >30 days).
- **Confidence trend** (improving, stable, declining at the catalog level).

### Adoption Metrics

- **Active users** (used Cowork plugin in last 7 / 30 days).
- **Active Loop owners.**
- **Adoption rate by department.**
- **Time to first Loop** (median time from training to first Loop interaction).
- **Time to first ownership** (median time from training to owning a Loop).

### Cost Metrics

- **LLM spend** (by provider, by Loop).
- **Hosting cost.**
- **Total cost of ownership.**
- **Cost per liberated hour** = TCO / IPL.

A healthy Cost-per-Liberated-Hour at Year 1 is in the range of $4–$12 per liberated hour, depending on industry and provider mix. Below $4 is suspect (likely vanity IPL); above $12 is concerning (likely under-utilizing infra).

### Risk Metrics

- **Open incidents by severity.**
- **Postmortem completion rate.**
- **Time to resolution** by severity.
- **Loops by risk classification** (per regulatory matrix).

## 9.4 Tier 3 — Diagnostic Metrics

These are reviewed by Loop owners and the platform team. Per-Loop metrics include:

- Run count, success/failure rate, latency.
- Confidence Index components (coverage, cadence, completion, outcome, hygiene).
- IPL contribution.
- Cost per run.
- User feedback (match/better/worse/wrong tags).
- Anomaly count.

Per-integration metrics include:

- Connector health, error rates, retry counts.
- Latency.
- Authentication renewals.

Per-platform metrics: in §8.9.

## 9.5 The QBR Dashboard

The Quarterly Business Review dashboard is the single artifact that the executive team will read. It must fit on two pages. Discipline matters; the temptation to bloat the QBR will be constant.

### ❖ Template — QBR One-Pager

```
LOOPY QBR — [Quarter]
Executive Sponsor: [name]   Implementation Lead: [name]

THE NUMBERS
- Organizational IPL: [hours/month]   (vs target [N], vs prior quarter [N])
- Capacity Redirection Ratio: [0.x]   (vs target 0.5)
- Workforce Sentiment Index: [score]   (vs baseline)
- Active Loops: [count]   (created this Q: [N], retired this Q: [N])
- Average Confidence Index: [score]
- Active users: [count]   (% of target population)
- Cost per Liberated Hour: $[N]
- Open Sev-1 / Sev-2 incidents: [counts]

THE STORY (4-6 sentences)
[Implementation Lead writes a short narrative connecting the numbers
to what happened this quarter. Successes, surprises, problems.]

DECISIONS REQUESTED
1. [Decision needed from executive team this quarter, e.g., budget
   adjustment, scope expansion, role-evolution policy ratification.]
2. [...]

RISKS / WATCHLIST
- [Risk 1: brief description, status, owner]
- [Risk 2: ...]

NEXT QUARTER PRIORITIES
- [Top 3 priorities for the next quarter, owner, target]

WORKFORCE VOICE STATEMENT
[1-3 sentences from the workforce voice on the Council, in their own
words. Unedited by leadership.]
```

The Workforce Voice Statement is the most important section. It is the part most often cut. Do not cut it. Its presence changes how the entire document is read.

## 9.6 What *Not* to Measure

This list is at least as important as the list above.

**Do not measure individual IPL as a performance KPI.** You will get inflated reports and gaming. IPL is a team and organization metric.

**Do not measure Confidence Index as an owner KPI.** Owners will find ways to inflate the components. The Confidence Index is a trust metric for the Council.

**Do not measure Loop count as a goal.** Loop count is a vanity metric. Quality and impact matter; count does not.

**Do not measure "AI usage time" or "prompts sent."** These are the wrong unit of analysis. The unit is the Loop.

**Do not measure headcount changes attributable to Loopy in Year 1.** Even if there are some — there should not be — measuring them creates the wrong incentive structure for the Council.

**Do not benchmark against external companies' IPL.** Industry benchmarks are not yet reliable. Set your own targets, against your own baseline, and adjust.

## 9.7 Reading the Numbers Honestly

Some patterns to watch for:

**Pattern: IPL rising, Confidence falling.** The deployment is producing more output of lower quality. Pause Loop additions; invest in catalog hygiene.

**Pattern: IPL flat, adoption rising.** People are using the system but not finding leverage. Likely Loops are scoped too narrowly. Revisit the Loop Candidate Worksheets.

**Pattern: Confidence high, sentiment falling.** Workforce trust is declining despite technical success. Likely the role-evolution conversations are going badly, or managers are using Loopy as a stick. Investigate via listening sessions.

**Pattern: Cost rising faster than IPL.** Either prompt inefficiency, model overspend, or vanity Loops. Diagnose with Vega; investigate Loops with high cost per liberated hour.

**Pattern: New Loops not surfacing organically.** Workforce does not feel safe proposing Loops. Address via Council members publicly proposing Loops in their domains and surfacing the response.

**Pattern: Loops being created but not retired.** Catalog inflation. Enforce the quarterly retirement cycle.

---

# Part X — Risks, Pitfalls & Anti-Patterns

This Part is the catalog of failure modes we have seen across deployments. It is structured as a set of named anti-patterns. Use it as a checklist during planning and a reference during operations.

## 10.1 Strategic Anti-Patterns

### Anti-pattern: "AI as cost-cutting"

**Pattern.** The CFO or board frames Loopy as a way to reduce headcount. The IPL is presented as a cash-savings number. Year 1 plans include planned reductions in roles affected by Loops.

**Why it fails.** The workforce reads the framing and disengages. The pilots produce smaller-than-projected IPL because the people closest to the work are not honest about what is amplifiable. By Month 6, attrition has eaten more value than the deployment liberated.

**Mitigation.** Adopt the amplification framing in §1.1 from day zero. Sign the no-layoff commitment in the Charter. Tie executive compensation to the Capacity Redirection Ratio, not to headcount.

### Anti-pattern: "Skip the Council"

**Pattern.** A senior leader says "we don't need a Council; we move fast here." A single executive owner is appointed; governance is informal.

**Why it fails.** When the first Sev-2 incident happens — and it will — there is no body to own the response. Affected parties are notified late or not at all. Trust collapses.

**Mitigation.** Stand up the Council before any technology decisions. Make it a precondition of go-live.

### Anti-pattern: "Skip the legibility phase"

**Pattern.** "We already know what work to instrument. Let's just start building Loops." The implementation lead skips the process narration, decision logging, and pain-point inventory.

**Why it fails.** The Loops chosen reflect what the leader *thinks* the work is, not what it actually is. The first Loops underperform; the team blames the technology; the deployment loses momentum.

**Mitigation.** Run the legibility phase. It is two to three weeks of work and saves three to six months of recovery.

### Anti-pattern: "Pilot the hardest Loop first"

**Pattern.** The first Loop is a Decision-layer Loop in a high-visibility domain. ("AI will help us decide which deals to discount." "AI will help us decide which candidates to advance.")

**Why it fails.** The agent's judgment is below the human expert's; the failures are visible to the executive team; the deployment is discredited before it has any positive signal.

**Mitigation.** Pilot Perception and Action layers first. Earn the right to do Decision Loops by Month 6.

### Anti-pattern: "Boil the ocean"

**Pattern.** Phase 1 includes 15+ Loops across 6 departments simultaneously.

**Why it fails.** No Loop gets enough attention. Quality is uniformly mediocre. Council bandwidth saturates. Owners burn out.

**Mitigation.** Three to five Loops in Phase 1, period. Resist expansion until Phase 2 exit criteria are met.

## 10.2 Governance Anti-Patterns

### Anti-pattern: "Vanity Council"

**Pattern.** The Council exists on paper. It meets; it ratifies; it does not actually decide. Real decisions are made by the implementation lead and the executive sponsor offline.

**Why it fails.** The Charter, the policies, and the role evolution decisions get made without proper review. When something goes wrong, the formal owner is unprepared.

**Mitigation.** Give the Council real decision rights. Document them. Test them by having the Council make a real decision in Phase 1 (e.g., retiring an early Loop). Publish the decision.

### Anti-pattern: "Workforce voice in name only"

**Pattern.** The workforce voice seat is filled by a senior IC who is friendly to leadership and rarely raises hard questions. Or it is left vacant for "weeks" that become months.

**Why it fails.** The Council loses its credibility check. Workforce-affecting decisions are made without dissent. The pulse survey shows declining trust, but the Council does not see why.

**Mitigation.** Choose a workforce voice with credibility *across* the workforce, not just to leadership. Empower them to bring questions back from listening sessions. Make the workforce voice statement a permanent QBR section.

### Anti-pattern: "Charter as PR"

**Pattern.** The Charter is a beautifully designed document that says nothing concrete. "We commit to a thoughtful, ethical, human-centered approach to AI." The workforce reads it and shrugs.

**Why it fails.** The Charter exists to create concrete commitments that can be audited against. Vague commitments fail this test.

**Mitigation.** Use the template in §7.5. Make commitments specific. Specifically, make the no-layoff commitment specific or do not make it at all.

## 10.3 Operational Anti-Patterns

### Anti-pattern: "Loop sprawl"

**Pattern.** By Month 9 there are 150 Loops, most below Confidence 60, many with absent or unclear owners. The catalog has become a graveyard.

**Why it fails.** The catalog stops being useful as a navigational tool. Atlas's reports become noise. The IPL number is unreliable because vanity Loops inflate it.

**Mitigation.** Enforce the quarterly retirement cycle. Plan for 10–25% retirement per quarter. Make Loop retirement a Council-celebrated event, not a failure.

### Anti-pattern: "Silent agent updates"

**Pattern.** A Loop's underlying prompt or model is changed silently by the owner. Behavior shifts. Users notice; nobody understands why; trust degrades.

**Why it fails.** The audit trail becomes unreliable. Incident postmortems cannot reconstruct what happened.

**Mitigation.** Loop changes are versioned. Major prompt changes require a re-shadow period. Council reviews material Loop changes quarterly.

### Anti-pattern: "Confidence Index gaming"

**Pattern.** Owners who feel pressure on the Confidence Index find ways to inflate it — narrowing the Loop scope, padding completions, redefining the outcome metric.

**Why it fails.** The Confidence Index becomes meaningless. The Council loses its trust signal.

**Mitigation.** Do not use the Confidence Index as an owner performance KPI. Atlas flags anomalous index movements. Council reviews every flag.

### Anti-pattern: "The lonely owner"

**Pattern.** An owner has been assigned a Loop but has no community of practice — no peer owners to learn from, no Council guidance, no training. They are quietly drowning.

**Why it fails.** Their Loop underperforms. They lose enthusiasm. They become a quiet skeptic in the workforce.

**Mitigation.** Run owner cohort sessions monthly. Pair new owners with experienced ones. Provide office hours. Ensure the People Lead checks in with owners individually in their first 60 days.

### Anti-pattern: "Drift without retrospectives"

**Pattern.** The deployment runs for 6+ months without a substantive retrospective. The Council ratifies; the Loops run; nothing is learned in writing.

**Why it fails.** Mistakes recur. New cohorts onboard against assumptions that proved false in earlier cohorts. Institutional knowledge stays in heads.

**Mitigation.** End-of-phase retrospectives are mandatory. Retrospectives produce written artifacts published to all stakeholders. The Charter and policies are updated based on retrospectives.

## 10.4 People & Culture Anti-Patterns

### Anti-pattern: "Skill atrophy"

**Pattern.** A team uses a Decision Loop for so long that the human expertise underlying the decisions atrophies. The Loop owner can no longer judge the agent's outputs critically. Mistakes propagate undetected.

**Why it fails.** This is the most insidious risk in mature deployments. By the time it surfaces, the company has lost a capability it depended on.

**Mitigation.** Periodic "manual shifts" where the Loop is paused and humans handle the work for a defined period. Apprenticeship programs that maintain the underlying skill across generations of staff. Audit signals randomly to ensure human review is meaningful, not rubber-stamping.

### Anti-pattern: "Performance review as adoption tool"

**Pattern.** Adoption is slow; HR adds a "uses Loopy" item to the performance review template; the workforce concludes that Loopy is mandatory and game it accordingly.

**Why it fails.** Adoption that is forced is not adoption. It produces vanity metrics and resentment. It does not produce IPL.

**Mitigation.** Update performance reviews to *acknowledge* Loop ownership and contribution, not to *require* Loopy use. Wait until Phase 4. Lead with carrots, not sticks.

### Anti-pattern: "IPL as comp metric"

**Pattern.** Manager comp is tied to team IPL. Suddenly every manager is finding "Loops" everywhere, the catalog explodes, and quality collapses.

**Why it fails.** The IPL becomes a vanity number. The workforce sees through it. Trust collapses.

**Mitigation.** IPL is not a compensation metric. The Capacity Redirection Ratio *can* be a manager-level operating metric. The two are different.

### Anti-pattern: "Manager who doesn't use Loopy"

**Pattern.** A department head pushes their team to adopt Loopy but does not use it themselves.

**Why it fails.** The team reads the absence as the real signal. Adoption stalls in that department.

**Mitigation.** Manager use is a precondition of cohort onboarding in their team. The People Lead validates manager use before scheduling the cohort.

### Anti-pattern: "Surveillance creep"

**Pattern.** Someone — usually a well-intentioned operations manager — proposes using Work Signals for individual performance management. ("We can see who is responding to Loops fastest.")

**Why it fails.** The Charter explicitly prohibits this. The workforce will notice. Trust collapses.

**Mitigation.** Charter language is explicit. Access to Work Signals is restricted to Loop owners, the Council, and audit. Any proposal to repurpose signals goes through the Council with the workforce voice present and is announced publicly if accepted.

## 10.5 Technical Anti-Patterns

### Anti-pattern: "Forking the core"

**Pattern.** "We just need this one thing changed in the API." The team forks the core; six months later the fork is months behind upstream and migration is a project unto itself.

**Why it fails.** Most desired changes can be done as connectors, skills, or external services. Forking should be a last resort.

**Mitigation.** Default to extension via SDK. Fork only with a documented business justification, durable funding, and a monthly upstream-merge discipline.

### Anti-pattern: "Single-provider lock-in"

**Pattern.** All BYOK is configured with one model provider. Loops are written assuming that provider's model behaviors. When the provider has an outage or changes pricing, the deployment is exposed.

**Why it fails.** The whole point of BYOK is optionality. Using only one provider negates it.

**Mitigation.** Configure at least two providers. Define fallbacks per Loop. Test failover quarterly.

### Anti-pattern: "Cost surprise"

**Pattern.** Year 1 LLM costs come in 3× over budget because Loops were rolled out without cost caps and a few high-volume Loops dominated.

**Why it fails.** Killed many implementations in 2024–2025. The CFO loses confidence; the program is cut.

**Mitigation.** Hard cost caps per Loop. Monthly cost caps per provider. Quarterly cost reviews. Vega-driven cost-per-liberated-hour reporting.

### Anti-pattern: "Stale plugin"

**Pattern.** Cowork plugin distribution is one-shot — built once, distributed once. Six months later users are running an outdated plugin and skills behave inconsistently.

**Why it fails.** Drift. Inconsistent user experience. Hard-to-reproduce bugs.

**Mitigation.** CI builds the plugin on every release. Plugin auto-update mechanism (where supported). Quarterly inventory of plugin versions in use.

### Anti-pattern: "Untested kill-switch"

**Pattern.** The kill-switch is documented but never exercised. When the first Sev-1 incident comes, the on-call cannot find the runbook or does not have the credentials.

**Why it fails.** Incident response collapses. Recovery time exceeds disclosure windows.

**Mitigation.** Quarterly kill-switch tabletop. Annual full exercise — actually pause the platform in staging.

## 10.6 Ethical Guardrails

Beyond the operational anti-patterns, there are ethical guardrails that the Council should enforce.

### Guardrail 1 — No deceptive agent personas

Loopy agents are agents. Do not deploy Loops that present agent outputs as human work without disclosure. Customers, vendors, and employees deserve to know when they are interacting with an agent. The Charter should commit to this and the Loop catalog should track it.

### Guardrail 2 — Human review for irreversible action

Any Loop in the Action layer that produces irreversible outcomes — communications to customers, financial transactions, public-facing content, hiring/termination decisions — requires human review before execution. Build the human approval into the Loop, not around it.

### Guardrail 3 — Bias review for HR-adjacent Loops

Any Loop whose outputs influence hiring, promotion, performance review, or termination must undergo a bias review before activation, and quarterly thereafter. The People Lead and Risk Lead jointly own the review.

### Guardrail 4 — Disclosure of model usage to data subjects

Where regulation requires it (e.g., EU AI Act Article 52), Loops touching personal data must disclose their use of AI to data subjects. The Risk Lead maintains the regulatory matrix and the disclosure templates.

### Guardrail 5 — Right to human review

The Charter commits to appealable decisions. Every Loop that produces a decision affecting an individual must have a documented path for that individual to request human review. Build the path; do not just document it.

### Guardrail 6 — Sunset for high-stakes Loops

Loops in regulated, sensitive, or high-stakes domains have a *sunset clause* — they expire after a defined period (12 or 24 months) and must be re-justified, not just renewed. This forces meaningful reflection on whether the Loop still serves its purpose.

---

# Part XI — Templates & Appendices

This Part is the toolkit. Copy what you need; adapt to your organization's voice; reuse and republish under the Playbook's CC BY-SA 4.0 license. Where templates appeared earlier in the Playbook in shorter form, this Part contains the expanded versions.

## 11.1 The Strategic Memo

### ❖ Template — One-Page Strategic Memo

```
LOOPY IMPLEMENTATION — STRATEGIC MEMO

Date: [date]
From: [Executive Sponsor name and role]
To: [Executive team]

WHY NOW.
[2-3 sentences. The strategic context — what is true about our company,
our market, our workforce that makes this the right moment to deploy
Loopy. Be specific to our situation, not generic.]

WHAT SUCCESS LOOKS LIKE IN 12 MONTHS.
- Organizational IPL: [target hours/month]
- Loop catalog: [target Loop count and Confidence Index average]
- Adoption: [target % of knowledge workers using the Cowork plugin
  weekly]
- Workforce sentiment: [target on Q10 of pulse survey]
- Operating-model: [specific role-evolution outcomes]

PILOT DOMAINS.
1. [Domain 1] — owner [name]. Rationale: [why this domain].
2. [Domain 2] — owner [name]. Rationale: [why this domain].
3. [Optional Domain 3].

BUDGET.
Year 1 envelope: $[N]
- Implementation Lead: $[N]
- Hosting & infrastructure: $[N]
- LLM (BYOK): $[N]
- Training & change: $[N]
- External partner (if any): $[N]

EXECUTIVE SPONSOR.
[Name, role]. Commits to: monthly Council attendance, quarterly QBR
chairing, public commitment at all-hands #1 and all-hands #2.

IMPLEMENTATION LEAD.
[Name, role]. Full-time, 12-month assignment. Reports to Sponsor.

LOOPY COUNCIL.
[List the seven roles + tentative names. Note the workforce voice
seat as required.]

KEY RISKS.
- [Risk 1]
- [Risk 2]
- [Risk 3]

DECISIONS REQUESTED OF THE EXECUTIVE TEAM.
1. Approve the budget envelope.
2. Approve the Sponsor and Implementation Lead.
3. Approve the pilot domains.
4. Confirm public commitment at the executive team meeting on [date].

Signed: [Sponsor]
```

## 11.2 The Loop Candidate Worksheet (Expanded)

### ❖ Template — Loop Candidate Worksheet (Expanded)

```
LOOP CANDIDATE WORKSHEET

Title: [Domain] / [Verb-Noun] / [Cognitive Layer]
Proposed Owner: [name, role, manager]
Proposed Reviewer: [name — Council member who sponsors this candidate]

DESCRIPTION.
What is this Loop? (1-2 sentences in plain language.)

TRIGGER.
What starts this Loop? (e.g., new email in inbox, new ticket created,
calendar event scheduled, time-of-day, manual invocation.)

INPUTS.
What data sources does this Loop need?
- Source 1: [system, what data, frequency]
- Source 2: [...]

OUTPUTS.
What does this Loop produce, and where does it go?
- Output 1: [system, format, destination]
- Output 2: [...]

CADENCE.
How often does this Loop run?
- Expected runs per day: [N]
- Expected runs per week: [N]
- Expected runs per month: [N]

CURRENT STATE (without Loopy).
- Who does this work today?
- How long does each instance take?
- What is the typical quality / error rate?
- What is the cost of an error?

DESIRED STATE (with Loopy).
- What share of the work does the agent do?
- What share remains human? (The "judgment" that stays human.)
- What is the expected error rate at production?
- What is the expected human-time savings per run?

R-I-V-O SCORING (1-5 each).
- Reversibility: [score]   — irreversible (1) → trivially reversible (5)
- IPL potential: [score]   — <5 hr/mo (1) → >40 hr/mo (5)
- Visibility: [score]      — invisible (1) → leadership-visible (5)
- Owner readiness: [score] — no owner (1) → enthusiastic owner (5)
RIVO Total: [sum]

ESTIMATED IPL CONTRIBUTION.
runs/month × minutes saved/run × (1 - residual human review %) ÷ 60
= [N hours/month]

DATA CLASSIFICATION.
[Public / Internal / Confidential / Restricted]

REGULATORY CATEGORIZATION.
[None / GDPR / CCPA / HIPAA / EU AI Act tier / Sector-specific]

WORST-CASE BAD OUTCOME.
[1-3 sentences describing the worst plausible failure mode of this
Loop. This drives the Council's risk classification.]

REQUIRED HUMAN APPROVAL?
[Yes / No / Conditional. If conditional, state the condition.]

PROPOSED CONFIDENCE INDEX TARGET.
[Score the Loop must reach in shadow mode before activation.]

PROPOSED SUNSET DATE.
[For sensitive Loops only. Date by which the Loop must be re-justified.]

COUNCIL DECISION.
[ ] Activate     [ ] Extend shadow     [ ] Reject     [ ] Defer
Date: [date]   Council notes: [...]
```

## 11.3 Council Meeting Agendas

### ❖ Template — Weekly Council Meeting Agenda (Pilot phase)

```
LOOPY COUNCIL — WEEKLY AGENDA
Time: 60 minutes
Quorum: 5 of 7. Workforce Voice required for any item touching workforce
communication or role evolution.

1. Open (5 min)
   - Action item review from last week.
   - Pending decisions.

2. Catalog Status (10 min)
   - Atlas report: new candidates, duplicates, stuck Loops, orphans.
   - Decisions on candidates ready for activation.

3. Trust Status (10 min)
   - Confidence Index distribution.
   - Loops below threshold; remediation status.
   - Sev-3 incident review.

4. Adoption Status (5 min)
   - Vega adoption snapshot.
   - Cohort onboarding progress.

5. Workforce Voice (10 min)
   - Listening session synthesis.
   - Concerns raised through the workforce voice channel.

6. Risk and Compliance (5 min)
   - Open incidents; regulatory updates.

7. Decisions (10 min)
   - Each decision logged in Loopy as a Reflection-layer Loop signal.

8. Action Items (5 min)
   - Owner, deadline, deliverable.
```

### ❖ Template — Biweekly Council Agenda (Scale phase)

```
LOOPY COUNCIL — BIWEEKLY AGENDA
Time: 90 minutes

1. Open (5 min)
2. Wave Progress (15 min)
   - Current wave status. Next wave readiness.
3. Catalog Status (15 min)
4. Trust Status (10 min)
5. Adoption Status (10 min)
6. Cost & ROI (10 min)
7. Workforce Voice (10 min)
8. Risk & Compliance (10 min)
9. Decisions (10 min)
10. Action Items (5 min)
```

### ❖ Template — Monthly Council Agenda (Embed phase)

```
LOOPY COUNCIL — MONTHLY AGENDA
Time: 120 minutes

1. Open (5 min)
2. Catalog Hygiene Review (20 min)
   - Quarterly retirement candidates.
   - Sunset reviews for high-stakes Loops.
3. Operating Health (20 min)
   - Confidence Index trends.
   - Cost trends.
   - Adoption trends.
4. Strategic Initiatives (20 min)
   - New initiatives requiring Loop instrumentation.
5. Role Evolution Review (15 min)
   - Job descriptions updated this month.
   - Career ladder changes.
6. Workforce Voice (15 min)
   - Pulse survey results (if quarter).
   - Listening session synthesis.
7. Risk & Compliance (10 min)
8. Decisions (10 min)
9. Action Items (5 min)
```

## 11.4 Communications Library

### ❖ Template — Pre-Announcement Manager FAQ Package

To be delivered to managers 5 business days before the Phase 2 all-hands.

```
PACKAGE CONTENTS (distributed to all people-managers):

1. The strategic memo (one page).
2. The AI Contribution Charter (one page).
3. The Phase 2 all-hands script that will be delivered (so the
   manager hears it from us first).
4. The All-Hands FAQ.
5. Manager talking points (in §7.4).
6. A 30-minute manager office hours schedule.
7. A team-conversation guide for the week after the all-hands.

OFFICE HOURS SCHEDULE.
- Day 1 (T-3): Manager office hours, 11am, with [Council member 1].
- Day 2 (T-2): Manager office hours, 2pm, with [Council member 2].
- Day 3 (T-1): Manager office hours, 11am, with [Sponsor].
- Day 4 (T-0): All-hands.
- Day 5 (T+1): Manager office hours, 11am, post-all-hands debrief.
- Day 8 (T+4): Manager team-conversation guide.
```

### ❖ Template — Listening Session Guide

```
LOOPY LISTENING SESSION
For a department, 60 minutes. Facilitated by HRBP or Council member.
NOT facilitated by the team's manager — this is the point.

AGENDA.
1. (5 min) Purpose and ground rules.
   "We are here to listen. Nothing said here goes back to your manager
   without your permission. We will summarize themes, not attribute
   quotes. The point is to give the Council a true read on how this
   is landing."

2. (15 min) What have you heard about Loopy?
   [Capture themes. Notice gaps and rumors.]

3. (15 min) What concerns you most?
   [Capture themes. Surface fears that may not be expressed elsewhere.]

4. (15 min) What would have to be true for you to be a public
   supporter of Loopy?
   [The most important question. Capture themes.]

5. (10 min) What questions do you want answered at the next all-hands?
   [Concrete questions to feed the FAQ.]

OUTPUT.
- Themes (not quotes), shared with Council within 48 hours.
- Concrete FAQ questions added to the All-Hands FAQ.
- Anonymous summary published to the department within 7 days,
  showing how their input shaped subsequent communications.
```

## 11.5 Policy Templates

### ❖ Template — Loop Lifecycle Policy

```
[COMPANY] — LOOP LIFECYCLE POLICY
Version [N], effective [date]. Reviewed annually.

1. SCOPE.
This policy applies to all Loops in the [Company] Loopy deployment.

2. CREATION.
Any employee may propose a Loop. Loop candidates use the standard
Worksheet (Appendix). Candidates are reviewed by the Loopy Council
at its next meeting after submission. Candidates require:
- A named owner.
- A cognitive layer.
- Data classification and regulatory categorization.
- A worst-case bad outcome statement.
- An R-I-V-O score.

3. SHADOW MODE.
Every newly created Loop runs in shadow mode for at least 14 days.
The Loop's outputs are recorded but not delivered to humans or
external systems. The owner reviews outputs daily in shadow mode.

4. ACTIVATION.
A Loop graduates from shadow to active when:
- Match rate ≥ 80% across at least N runs (N defined per Loop).
- The Council holds an activation review.
- Any conditional human-approval requirement is configured.

5. OPERATION.
Operating Loops are subject to:
- The owner's review cadence (per Confidence Index).
- The Council's monthly catalog review.
- Atlas anomaly detection.

6. RETIREMENT.
A Loop is retired when any of:
- Confidence < 50 for >60 days with no remediation plan.
- The owner cannot articulate the value in one sentence.
- The work it instruments is no longer being done.
- It is superseded by a better Loop.
- Two consecutive quarterly reviews fail to renew the Loop's mandate.

7. SUNSET (HIGH-STAKES LOOPS).
Loops in regulated, sensitive, or high-stakes domains have a sunset
period (12 or 24 months) and must be re-justified at sunset.

8. CHANGE CONTROL.
Material changes to a Loop's prompt, model, scope, or inputs require:
- Documentation in the Loop's signal stream.
- Re-shadow if the change is structural.
- Council review if the change affects risk classification.

9. ROLES.
- Loop Owner: operational owner, accountable for the Loop's daily
  health.
- Council: governance owner, accountable for catalog hygiene.
- Risk Lead: regulatory owner, accountable for compliance per Loop.
```

### ❖ Template — Incident & Kill-Switch Policy

```
[COMPANY] — LOOPY INCIDENT & KILL-SWITCH POLICY
Version [N], effective [date]. Reviewed annually. Tested quarterly.

1. SEVERITY DEFINITIONS.
- Sev-3: Loop misbehavior; no external harm.
- Sev-2: Localized harm to a customer, vendor, or worker.
- Sev-1: Systemic or public-facing harm; multiple Loops or the
  platform itself misbehaving.

2. KILL-SWITCH AUTHORITY.
- Loop pause: any Loop owner; any Council member; the on-call engineer.
- Platform pause: the Implementation Lead; the on-call platform
  engineer; the Executive Sponsor. Two-person concurrence required
  except in actively unfolding incident.

3. TRIGGER CONDITIONS FOR PLATFORM PAUSE.
- Multiple concurrent Sev-2 incidents (>= 3 in any 24 hours).
- Any Sev-1 incident.
- Detected security compromise.
- Regulator inquiry requiring suspension.
- Any incident the Sponsor decides warrants pause.

4. RESPONSE STEPS.
[Include the Sev-3 / Sev-2 / Sev-1 response steps from §6.6.]

5. NOTIFICATION OBLIGATIONS.
- Sev-2: affected parties within 48 hours. Workforce notified within
  5 business days if workers affected.
- Sev-1: affected parties immediately. Workforce within 24 hours.
  Regulator per applicable regulation. Board within 24 hours.

6. POSTMORTEM REQUIREMENTS.
- Sev-3: 1-paragraph note in signal stream within 14 days.
- Sev-2: full postmortem within 14 days, distributed to Council and
  affected parties.
- Sev-1: full postmortem within 30 days, distributed company-wide.

7. TESTING.
- Tabletop exercise quarterly.
- Full kill-switch exercise (in staging) annually.
```

## 11.6 Training Curriculum (Detail)

The Track 1 / 2 / 3 outline appears in §7.3. The detail below is the slide and exercise outline for each.

### ❖ Track 1 — General Training (90-min cohort session)

```
SLIDE OUTLINE
1. Welcome (1 min)
2. The amplification thesis (5 min)
3. The five cognitive layers (5 min)
4. What is a Loop? (5 min)
5. The IPL — what we measure (5 min)
6. The Confidence Index — what we trust (5 min)
7. The AI Contribution Charter — what we promise (10 min)
8. Hands-on: install the Cowork plugin (10 min)
9. Hands-on: first interaction with a Loop (15 min)
10. Live troubleshooting (10 min)
11. How this affects your role (10 min)
12. Channels and resources (5 min)
13. Q&A (10 min)
14. Closing (4 min)

EXERCISE.
Pair up. Each pair has one cohort member identify one piece of
recurring cognitive work in their role. Use the Loop Candidate
Worksheet to sketch a Loop for it. Submit to the facilitator.
Best three submissions get reviewed by the Council.

POST-SESSION.
- 7-day reminder email with deeper resources.
- 30-day office hours invite.
- Pulse survey question added to next quarterly survey.
```

### ❖ Track 2 — Owner Training (two 90-min sessions)

```
SESSION 1 — DESIGNING A LOOP

SLIDE OUTLINE
1. Role of the Loop Owner (10 min)
2. Cognitive layers in depth (15 min)
3. The Loop Candidate Worksheet, walked through (20 min)
4. R-I-V-O scoring (10 min)
5. Reversibility, irreversibility, and human approval (15 min)
6. Designing the inputs and outputs (10 min)
7. Hands-on: design a Loop end-to-end (20 min)

SESSION 2 — OPERATING A LOOP

SLIDE OUTLINE
1. Shadow mode and what to do during it (15 min)
2. The Confidence Index — components and what to do at each level (15 min)
3. Reviewing signals — what to look for (15 min)
4. Handling anomalies (15 min)
5. Iteration and change control (10 min)
6. When to retire a Loop (10 min)
7. Hands-on: walk through a live Loop (20 min)

POST-SESSION.
- Pair with an experienced owner for first 60 days.
- Monthly owner office hours.
- 4-week manager check-in.
```

### ❖ Track 3 — Leader Training (two half-days)

```
HALF-DAY 1 — STRATEGY AND GOVERNANCE (3 hours)

1. The amplification thesis and the Loopy worldview (30 min)
2. The maturity model (30 min)
3. The Council and your role within it (30 min)
4. The Charter, policies, and governance levers (30 min)
5. Workshop: what should we retire? (45 min)
6. Discussion (15 min)

HALF-DAY 2 — CHANGE MANAGEMENT (3 hours)

1. The change curve, owner and observer (30 min)
2. The role-evolution conversation script (30 min)
3. The compensation question and how to handle it (30 min)
4. Workshop: a role evolution case (60 min)
5. Communication patterns: all-hands, manager, listening (30 min)
6. Closing commitments (15 min)
```

## 11.7 Common Questions & Answers (Long Form)

This is a long-form FAQ for internal use. The short-form FAQ for the workforce is in §7.4.

```
1. What if a department head doesn't want to participate?

Listen. Department heads who decline are usually responding to a
real concern — bandwidth, trust deficit, or a prior bad experience
with transformation initiatives. The Sponsor (not the Implementation
Lead) should have a one-on-one conversation. Three outcomes are
acceptable: (a) the head joins; (b) the head defers a quarter and
joins later; (c) the head opts out, and the Council respects that
for at least a year. What is not acceptable is forcing participation
under threat — that produces the worst possible adoption pattern.

2. What if the workforce voice on the Council resigns?

The seat is filled within 14 days, with the same selection criteria.
The Implementation Lead does not delegate this seat upward. If
nobody at the IC level is willing, that is a strong signal that
trust is too low to proceed at speed.

3. How do we handle a Loop that surfaces a person's mistake?

Carefully. Loops are not designed to surveil. If a Loop incidentally
surfaces an individual error, the response is at the Loop level
(improve the Loop) and at the team level (improve the process), not
at the individual level. The Charter prohibits using signals for
performance management.

4. How do we talk about Loopy externally — to customers, partners,
   the press?

The Sponsor and Communications Lead jointly own external messaging.
The principal points: Loopy is internal infrastructure for how we
work; it is built on open-source foundations we control; we govern
it with a cross-functional Council that includes a workforce voice.
Do not externally cite IPL numbers without context — they are
capacity numbers, not cash numbers.

5. What if a regulator asks for an audit?

Risk Lead leads the engagement. The Loop catalog, the Charter, the
Loop Lifecycle Policy, the Incident Policy, the regulatory matrix,
and the Work Signal audit trail are the principal artifacts. Most
regulator inquiries are well-served by Loopy's natural audit trail.

6. What if we acquire another company?

Acquisition integration includes a Loop catalog merger. The acquired
company's processes are subject to the same legibility phase as the
original implementation. Plan for 6–12 months of integration before
the acquired company is at parity.

7. What if a Loop produces a discriminatory output?

This is a Sev-2 minimum. Pause the Loop. Convene Council. People
Lead and Risk Lead jointly investigate. Affected parties notified.
Bias review for related Loops triggered. The Council may impose a
moratorium on similar Loops pending investigation. Postmortem
published. Charter language reaffirmed or updated.

8. What if executives use Loopy to produce communications they
   present as their own?

Charter language: agents are agents. Communications produced by
agents and presented as the executive's own personal writing are a
deception. The Council should make this explicit; the Sponsor
should model it (e.g., disclose in their newsletter when sections
were drafted by an agent, even if reviewed and edited).

9. How do we handle Loops in highly creative work?

Most creative work is in the Decision and Reflection layers and
should be amplified, not automated. Treat creative Loops as
collaborator-Loops: the agent expands options; the human chooses,
edits, and ships. Measure outcome quality, not throughput.

10. How do we handle Loops where the agent gets it wrong more
    often than humans do?

Retire the Loop or rescope it. There is no shame in retirement.
The Council should celebrate retirement as much as creation.
```

## 11.8 Sponsor Kickoff Message (T-0)

### ❖ Template — Sponsor T-0 Internal Email

```
Subject: Loopy launches today

Team,

Today we begin Phase 1 of our Loopy implementation. I want to take
two minutes of your inbox to mark it.

Why we're doing this. We've been using AI in scattered ways for a
while. The pieces are real, but the picture is fragmented. Loopy is
how we bring structure to the picture — making the work AI helps with
visible, governed, and measured. We are deploying it because we want
to amplify the people we have, not replace them, and because we want
the discipline of an audit trail when AI is involved in real work.

What is happening today. Three to five Loops are activating in
[pilot domains]. Owners and the Loopy Council are running them. The
broader workforce is not affected yet — onboarding is wave-by-wave
and your wave will be communicated.

What you can read today.
- The AI Contribution Charter — our public commitments about how
  Loopy is used. (Linked.)
- The Loop Lifecycle Policy — how Loops are created, operated, and
  retired. (Linked.)
- The Incident & Kill-Switch Policy — what happens when something
  goes wrong. (Linked.)

How to engage today.
- Questions about the program: [Implementation Lead, contact].
- Concerns or feedback you want to raise privately: the workforce
  voice on the Council, [name, contact].
- Day-to-day curiosity about Loops in your area: your manager.

This is a real commitment. I'll talk about it at every all-hands.
The QBR will report what we've learned. We'll be honest about what's
working and what isn't.

Thanks for being part of this.

[Sponsor]
```

## 11.9 Glossary

```
Agent — A software entity that performs work within a Loop on behalf
        of a human owner. May invoke an LLM. Always logs Work Signals.

A2A — Agent-to-agent. The protocol by which agents communicate with
      each other within Loopy.

BYOK — Bring Your Own Key. The pattern in which Loopy uses LLM
       providers via the operator's own API keys, not Loopy's.

Cognitive Layer — One of the five layers of cognitive work mapped in
                  Loopy: Perception, Interpretation, Decision, Action,
                  Reflection.

Confidence Index — A 0-100 score per Loop combining Coverage, Cadence,
                   Completion, Outcome, and Hygiene. Used as a trust
                   signal by the Council.

Council — The Loopy Council. The cross-functional governance body
          for the implementation.

Cowork plugin — The desktop client that exposes Loopy skills inside
                a user's AI client. Bundled in Loopy OSS as
                packages/cowork-plugin.

IPL — Productivity Liberation Index. Hours of human work liberated
      by AI agents through Loops, against a baseline of 180 hr/mo
      per knowledge worker.

Loop — The atomic unit of operational work in Loopy. Has a name, a
       cognitive layer, an owner, inputs, outputs, signals, and
       metrics.

Loop Candidate — A proposed Loop, before activation.

Open Core — The licensing model in which the core protocol and
            platform are open source (AGPL v3 for Loopy OSS) and
            specific commercial layers are proprietary
            (loopythinking.ai cloud).

R-I-V-O — Reversibility / IPL potential / Visibility / Owner
          readiness. The four-axis scoring used to rank Loop
          candidates.

Shadow Mode — A Loop state in which the agent runs but its outputs
              are not delivered. Used for validation before
              activation.

Signal — See Work Signal.

Skill — A bundled set of capabilities accessible to a Loopy agent.
        Examples: loopy-bridge, loopy-loop-mapper.

Team Loopy — The five built-in governance agents: Nova, Atlas, Vega,
             Echo, Orion.

Wave — A cohort of departments onboarded together during Phase 3.

Work Signal — A single event within a Loop. The unit of the audit
              trail.

Workforce Voice — The seventh seat on the Loopy Council, filled by a
                  senior individual contributor or middle manager
                  (not a senior leader).
```

## 11.10 Reference Architecture Diagram (ASCII)

```
                              +-----------------------+
                              |   IDENTITY PROVIDER   |
                              |    (Okta / Azure AD)  |
                              +-----------+-----------+
                                          | SAML/OIDC
                                          v
+------------------+      HTTPS    +------+--------+        +----------------+
|                  | <----------> |               | <----> |   POSTGRES     |
|  COWORK PLUGIN   |               |   LOOPY API   |         |  (signals,    |
|  (user's desktop)|               |  (Node/TS)    |         |   loops,      |
|                  |               |               |         |   users,      |
+------------------+               +------+--------+         |   configs)    |
                                          |                  +----------------+
                                          |
                                          | LLM calls
                                          v
                                  +-------+--------+
                                  |   LLM PROVIDER |
                                  |   (BYOK key)   |
                                  | Anthropic / OAI|
                                  | Google / etc.  |
                                  +----------------+

       +--------------------+        Async events       +-----------------+
       |  CONNECTORS        | <-----------------------> |  LOOPY API      |
       |  Slack/Teams/M365/ |                            +-----------------+
       |  Google/CRM/etc.   |
       +--------------------+

       +--------------------+        Webhooks / SQL     +-----------------+
       |  SIEM / AUDIT      | <----------------------- |  LOOPY API      |
       |  (Splunk/Elastic/  |                            +-----------------+
       |   Datadog/etc.)    |
       +--------------------+

       +--------------------+        OpenTelemetry      +-----------------+
       |  OBSERVABILITY     | <----------------------- |  LOOPY API      |
       |  (Prom/Grafana/DD) |                           +-----------------+
       +--------------------+

                                  +--------------------+
                                  |   WEB APP (Next.js)|
                                  |   apps/web         |
                                  +--------------------+
                                          ^
                                          | Browser, HTTPS
                                  +-------+--------+
                                  |    USERS       |
                                  +----------------+
```

## 11.11 Operating Cadence Quick Reference

```
PHASE 1 — FOUNDATION (Weeks 1-4)
- Council: weekly (60 min)
- Pilot owners: daily 15-min check-in
- Sponsor: attends Council; one all-hands at start of Phase 2

PHASE 2 — PILOT (Weeks 5-12)
- Council: weekly (60 min)
- Pilot owners: daily 15-min in pilot domain
- Department review: monthly
- Executive operating review: monthly
- All-hands: at start of phase
- Workforce listening session: month 2 in pilot domain

PHASE 3 — SCALE (Months 4-9)
- Council: biweekly (90 min)
- Loop owners: weekly review per Loop
- Department review: monthly
- Executive operating review: monthly
- Wave kickoff: at start of each wave
- All-hands: month 6 (wave 2 milestone)
- QBR: end of month 3, 6, 9
- Workforce listening: quarterly per department
- Pulse survey: month 3, 6, 9

PHASE 4 — EMBED (Month 10+)
- Council: monthly (120 min)
- Loop owners: cadence per Confidence Index
- Department review: monthly
- Executive operating review: monthly
- QBR: quarterly
- Annual: Charter review, policy review, regulatory horizon, Council
  continuation review
```

## 11.12 Pre-Flight, In-Flight, Post-Flight Checklists (Consolidated)

```
PRE-FLIGHT (T-0 readiness)
[See §3.8 — comprehensive list.]

IN-FLIGHT (Phase 1 exit, end of Week 4)
[ ] All pilot Loops created in catalog
[ ] All Council members onboarded
[ ] SSO, BYOK, SIEM validated
[ ] At least 3 pilot Loops active
[ ] Confidence Index thresholds ratified
[ ] IPL targets set for Phase 2
[ ] First retrospective completed

PHASE 2 EXIT (end of Week 12)
[ ] All pilot Loops at Confidence ≥ 70
[ ] Pilot domain IPL meeting target
[ ] Pilot cohort adoption ≥ 80%
[ ] At least 2 organically-surfaced new Loop candidates
[ ] First QBR-style report produced
[ ] Phase 2 retrospective completed
[ ] At least one Loop or process retired

PHASE 3 EXIT (end of Month 9)
[ ] 30+ Loops live across 5+ departments
[ ] Average Confidence ≥ 75
[ ] Org IPL in monthly executive review
[ ] Onboarding playbook codified and self-serve
[ ] Role evolution begun in 3+ job families
[ ] Council moved to biweekly
[ ] Atlas reporting on duplicate/stuck/orphan Loops

YEAR 1 CLOSE (Month 12)
[ ] Annual Charter review completed
[ ] Annual policy review completed
[ ] Annual regulatory horizon scan completed
[ ] Council continuation decision made
[ ] Year 2 budget approved
[ ] Workforce sentiment ≥ baseline
[ ] Loop ownership in role descriptions for relevant roles
[ ] New hire onboarding includes Loopy
```

## 11.13 References & Further Reading

The list below points to underlying frameworks, related operating-model literature, and the Loopy project itself.

```
PROJECT
- Loopy OSS repository:
  https://github.com/LoopyThinking/loopy-oss
- loopythinking.ai (cloud):
  https://loopythinking.ai
- Loopy documentation site (built from packages/docs).

LICENSES
- Loopy OSS: AGPL v3.
- This Playbook: CC BY-SA 4.0.

UNDERLYING CONCEPTS
- The five cognitive layers borrow from cognitive systems engineering
  (Norman, Hutchins). The translation to operational AI work is
  Loopy's.
- The IPL framing was developed within Loopy Thinking. It draws on
  capacity-based productivity literature (Goldratt's Theory of
  Constraints, capacity-utilization measurement).
- The Open Core / AGPL v3 strategy follows the model of Grafana Labs,
  Sentry, and other open-core companies operating in regulated
  environments.

OPERATING MODEL READING
- "The Phoenix Project" / "The DevOps Handbook" (Kim et al.) — for
  the cadence and governance metaphors.
- "An Elegant Puzzle" (Larson) — for the Council and decision-rights
  framing.
- "Working Backwards" (Bryar & Carr) — for the writing discipline
  used in the strategic memo, Charter, and policies.

REGULATORY
- EU AI Act (Regulation (EU) 2024/1689). Operators in or selling
  into the EU should review the risk-tier framework. Loopy's
  Loop-level categorization is designed to map cleanly.
- US state AI legislation (Colorado SB24-205, Illinois HFS, NYC
  Local Law 144 for HR-adjacent AI) varies — track per jurisdiction.
- Sector-specific regulators: HHS/OCR (HIPAA), OCC and Fed (banking),
  FINRA/SEC (financial services), FERC (energy), etc.
```

---

# Closing

This Playbook will not stay at version 1.0 forever. Loopy is open source and so is this document. If you adapt it for your organization, please send the diffs back. If you find anti-patterns we did not cover, please write them up. If you build templates we missed, please share them.

The fastest way to a healthy AI deployment is to learn in public. The Loopy project, and this Playbook, are designed to make that easy.

Maintained by Loopy Thinking. Distributed under CC BY-SA 4.0. Contact: dev@loopy-thinking.com.








