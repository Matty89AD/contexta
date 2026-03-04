# ChallengeTestData

Synthetic challenge submissions for testing (Challenge → Content matching, routing, and UI).

## Fields
- **User context**: role, company_stage, experience, team_size
- **Challenge metadata**: domain, sub_domain, reach, impact, related_teams
- **Enum values**: mapped enum keys used by the matching engine
- **content match**: named the best matching content items from the content test data

---

## CH-001: Align stakeholders on a 6‑month product strategy

**Raw challenge**: I need to align Sales, Engineering, and the CEO on our 6‑month strategy and stop weekly priority churn.

### User context
- Role: Product Manager
- Company stage: Series A (post‑PMF, scaling)
- Experience: 3–5 years
- Team size: Squad of ~8 (PM, designer, 6 eng)

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `mid`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Strategy
- Sub-domain: Stakeholder alignment
- Reach: Cross-functional (3+ teams)
- Impact: High
- Related teams: Founders/Exec, Engineering, Sales, Design, Customer Success

### Content Match
- Brian Chesky.txt
- Petra Wille.txt
- John Cutler.txt

---

## CH-002: Prioritize roadmap with noisy customer requests

**Raw challenge**: We have 40+ requests from enterprise prospects and existing customers. I need a roadmap process that feels fair and defensible.

### User context
- Role: Senior PM
- Company stage: Series B (growth)
- Experience: 5–8 years
- Team size: PM group of 4; shared platform team of 10 eng

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `senior`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Discovery
- Sub-domain: Prioritization frameworks
- Reach: Product area (multiple squads)
- Impact: High
- Related teams: Sales, Customer Success, Engineering, Product Operations, Finance

### Content Match
- Ryan Singer.txt
- Teresa Torres.txt
- John Cutler.txt
---

## CH-003: Improve onboarding conversion for self-serve

**Raw challenge**: Activation dropped 12% after a redesign. I need to diagnose the onboarding funnel and ship experiments without slowing delivery.

### User context
- Role: Growth PM
- Company stage: Seed (early GTM)
- Experience: 2–4 years
- Team size: Growth pod of ~6 (PM, 1 design, 4 eng)

### Enum values
- `role`: `sr_pm`
- `company_stage`: `preseed_seed`
- `experience_level`: `mid`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Growth
- Sub-domain: Activation & onboarding
- Reach: Customer-facing (all new users)
- Impact: High
- Related teams: Growth, Design, Engineering, Data/Analytics, Marketing

### Content Match
- Adam Fishman.txt
- Brian Balfour.txt
- Elena Verna 2.0.txt
---

## CH-004: Reduce cycle time and missed commitments

**Raw challenge**: We keep missing sprint goals and stakeholders are losing trust. I need a delivery system that improves predictability.

### User context
- Role: Product Lead
- Company stage: Scale-up (Series C+)
- Experience: 8–12 years
- Team size: 2 squads (~16 eng), 2 designers, 1 data analyst

### Enum values
- `role`: `head_of_product`
- `company_stage`: `growth_series_c_plus`
- `experience_level`: `lead`
- `team_size`: `16-50`

### Challenge metadata
- Domain: Delivery
- Sub-domain: Execution & planning
- Reach: Department (Product/Eng)
- Impact: High
- Related teams: Engineering, Product, Design, QA, Operations

### Content Match
- Ryan Singer.txt
- Petra Wille.txt
- John Cutler.txt
---

## CH-005: Define ICP and messaging for new segment

**Raw challenge**: We want to expand from SMB to mid-market. I need to define ICP, positioning, and which product gaps matter most.

### User context
- Role: PM (0→1)
- Company stage: Series A
- Experience: 4–6 years
- Team size: Single squad of 7; no dedicated marketing PM

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `senior`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Strategy
- Sub-domain: Positioning & segmentation
- Reach: Company-wide (GTM + Product)
- Impact: High
- Related teams: Marketing, Sales, Founders/Exec, Customer Success, Engineering

### Content Match
- Brian Balfour.txt
- Adam Grenier.txt
- Elena Verna 3.0.txt
---

## CH-006: Create a discovery cadence with limited user access

**Raw challenge**: We rarely talk to users because Sales gatekeeps access. I need a repeatable discovery pipeline and buy-in for user research.

### User context
- Role: Associate PM
- Company stage: Enterprise (late-stage)
- Experience: 1–2 years
- Team size: Squad of 10; centralized research team (backlog)

### Enum values
- `role`: `associate_pm`
- `company_stage`: `enterprise`
- `experience_level`: `junior`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Discovery
- Sub-domain: User research operations
- Reach: Product area
- Impact: Medium
- Related teams: Sales, Research, Customer Success, Engineering, Legal/Compliance

### Content Match
- Teresa Torres.txt
- Petra Wille.txt
- Ada Chen Rekhi.txt
---

## CH-007: Handle a major incident and rebuild reliability trust

**Raw challenge**: We had two outages in a month. I need to coordinate incident learnings into a reliability roadmap and communicate credibly.

### User context
- Role: Platform PM
- Company stage: Series B
- Experience: 6–9 years
- Team size: Platform group of 12 eng; shared SRE of 3

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `senior`
- `team_size`: `16-50`

### Challenge metadata
- Domain: Delivery
- Sub-domain: Reliability & incident response
- Reach: Company-wide (all product lines depend)
- Impact: High
- Related teams: Engineering, SRE/Infra, Support, Customer Success, Founders/Exec

### Content Match
- Alex Komoroske.txt
- Albert Cheng.txt
- John Cutler.txt
---

## CH-008: Set up OKRs that actually guide trade-offs

**Raw challenge**: Our OKRs are vague and don't change decisions. I need a system that ties metrics to roadmap and weekly execution.

### User context
- Role: Head of Product
- Company stage: Series A
- Experience: 10+ years
- Team size: Product org of 6 (PMs+Design); Eng org of 20

### Enum values
- `role`: `head_of_product`
- `company_stage`: `series_a_b`
- `experience_level`: `lead`
- `team_size`: `16-50`

### Challenge metadata
- Domain: Leadership
- Sub-domain: Goals & metrics (OKRs)
- Reach: Company-wide
- Impact: High
- Related teams: Founders/Exec, Engineering, Design, Data/Analytics, Finance

### Content Match
- John Cutler.txt
- Petra Wille.txt
- Brian Chesky.txt
---

## CH-009: Launch pricing changes without churn spike

**Raw challenge**: We need to increase prices for new customers and migrate existing ones. I need a plan that minimizes churn and support load.

### User context
- Role: Monetization PM
- Company stage: Series C
- Experience: 5–8 years
- Team size: 2 pods (monetization + billing), ~14 eng total

### Enum values
- `role`: `sr_pm`
- `company_stage`: `growth_series_c_plus`
- `experience_level`: `senior`
- `team_size`: `16-50`

### Challenge metadata
- Domain: Growth
- Sub-domain: Pricing & packaging
- Reach: Customer-facing (billing)
- Impact: High
- Related teams: Finance, Sales, Customer Success, Support, Engineering

### Content Match
- Elena Verna 4.0.txt
- Casey Winters.txt
- Brian Balfour.txt
---

## CH-010: Define MVP scope for a 0→1 product bet

**Raw challenge**: We have an idea but no clarity on MVP scope. I need a crisp problem statement, success metrics, and a 6–8 week plan.

### User context
- Role: Founding PM
- Company stage: Pre-seed/Seed
- Experience: 3–6 years
- Team size: Small team: 3 engineers, 1 designer

### Enum values
- `role`: `founder`
- `company_stage`: `preseed_seed`
- `experience_level`: `mid`
- `team_size`: `1-5`

### Challenge metadata
- Domain: Discovery
- Sub-domain: MVP definition
- Reach: Product area (new initiative)
- Impact: High
- Related teams: Founders/Exec, Engineering, Design, Marketing, Early Customers

### Content Match
- Brian Chesky.txt
- Ryan Singer.txt
- Alex Hardimen.txt
---

## CH-011: Improve collaboration with a strong-willed tech lead

**Raw challenge**: My tech lead overrides product decisions in meetings. I need a healthier decision process and working relationship.

### User context
- Role: PM
- Company stage: Series A
- Experience: 2–4 years
- Team size: Squad of 8 with senior tech lead

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `mid`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Leadership
- Sub-domain: Cross-functional communication
- Reach: Team (single squad)
- Impact: Medium
- Related teams: Engineering, Design, Product, Founders/Exec

### Content Match
- Petra Wille.txt
- Ada Chen Rekhi.txt
- John Cutler.txt
---

## CH-012: Build a metrics layer everyone trusts

**Raw challenge**: Different dashboards show different numbers. I need a single source of truth and metric definitions to drive decisions.

### User context
- Role: Product Ops / PM
- Company stage: Series B
- Experience: 4–7 years
- Team size: Data team of 5; product org of 10

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `senior`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Delivery
- Sub-domain: Data infrastructure & metrics
- Reach: Company-wide
- Impact: High
- Related teams: Data/Analytics, Engineering, Product, Finance, Marketing

### Content Match
- Albert Cheng.txt
- Aishwarya Naresh Reganti + Kiriti Badam.txt
- John Cutler.txt
---

## CH-013: Increase retention for a usage-based SaaS

**Raw challenge**: Customers sign up but don't build habits. I need to identify retention levers and design a retention experiment plan.

### User context
- Role: Growth PM
- Company stage: Series A
- Experience: 3–5 years
- Team size: Growth pod of 7; shared data analyst

### Enum values
- `role`: `sr_pm`
- `company_stage`: `series_a_b`
- `experience_level`: `mid`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Growth
- Sub-domain: Retention & engagement
- Reach: Customer-facing (active users)
- Impact: High
- Related teams: Growth, Design, Engineering, Data/Analytics, Customer Success

### Content Match
- Casey Winters.txt
- Elena Verna 4.0.txt
- Brian Balfour.txt
---

## CH-014: Navigate compliance constraints in product design

**Raw challenge**: We're entering a regulated market and Legal blocks many features late. I need a compliance-by-design workflow.

### User context
- Role: PM
- Company stage: Enterprise / late-stage
- Experience: 6–10 years
- Team size: Squad of 9; shared legal/compliance partners

### Enum values
- `role`: `sr_pm`
- `company_stage`: `enterprise`
- `experience_level`: `senior`
- `team_size`: `6-15`

### Challenge metadata
- Domain: Delivery
- Sub-domain: Risk, compliance & governance
- Reach: Cross-functional (Product + Legal)
- Impact: High
- Related teams: Legal/Compliance, Security, Engineering, Design, Operations

### Content Match
- Alex Komoroske.txt
- Adriel Frederick.txt
- John Cutler.txt
---

## CH-015: Transition from project requests to product thinking

**Raw challenge**: We operate like an internal agency taking tickets. I need to shift the org toward outcomes, discovery, and empowered teams.

### User context
- Role: Director of Product
- Company stage: Mid-size (private)
- Experience: 10+ years
- Team size: Product org of 12; Eng org of 40 across 5 teams

### Enum values
- `role`: `cpo_director`
- `company_stage`: `growth_series_c_plus`
- `experience_level`: `lead`
- `team_size`: `51+`

### Challenge metadata
- Domain: Leadership
- Sub-domain: Org design & operating model
- Reach: Department (Product/Eng/GTM)
- Impact: High
- Related teams: Engineering, Founders/Exec, Operations, Sales, Customer Success

### Content Match
- Petra Wille.txt
- Brian Chesky.txt
- John Cutler.txt
---

## Enum mapping notes

| CH | Display role | `role` enum | Notes |
|----|-------------|-------------|-------|
| 001 | Product Manager | `sr_pm` | Mid-experience PM |
| 002 | Senior PM | `sr_pm` | |
| 003 | Growth PM | `sr_pm` | Growth specialisation within sr_pm |
| 004 | Product Lead | `head_of_product` | Manages multiple squads |
| 005 | PM (0→1) | `sr_pm` | Founding/0→1 but not a founder |
| 006 | Associate PM | `associate_pm` | |
| 007 | Platform PM | `sr_pm` | Platform specialisation within sr_pm |
| 008 | Head of Product | `head_of_product` | |
| 009 | Monetization PM | `sr_pm` | Domain specialisation within sr_pm |
| 010 | Founding PM | `founder` | Founder building product themselves |
| 011 | PM | `sr_pm` | |
| 012 | Product Ops / PM | `sr_pm` | Ops-leaning PM |
| 013 | Growth PM | `sr_pm` | |
| 014 | PM | `sr_pm` | |
| 015 | Director of Product | `cpo_director` | "Mid-size private" mapped to `growth_series_c_plus` (closest match) |
