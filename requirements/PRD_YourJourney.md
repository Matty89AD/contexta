# PRD — Your Journey: Challenge Overview & Management

Version: 0.2  
Status: Draft  
Owner: Product  
Area: Your Journey / Challenge Management  

---

# 1. Overview

"Your Journey" is a new core page that acts as the **user's personal workspace and history of challenges inside Contexta**.

The page allows users to:

- Understand their **progress across challenges**
- Resume **active work**
- Access **previous recommendations and artifacts**
- Identify **patterns in their challenges**
- Manage the **lifecycle of challenges**

The page combines:

1. **Journey Insights** (progress, usage, thought leaders)
2. **Active Challenges**
3. **Challenge History Table**

---

# 2. Problem Statement

Currently the product don't show existing challenge per user.

Current limitations:

- No dedicated page for challenge management
- No visibility into user progress or learning journey
- Difficult to resume existing work
- No insights into patterns across challenges
- Limited lifecycle control

As a result, challenges behave like **one-time interactions** instead of **long-term workspaces**.

---

# 3. Goals

Primary goals:

- Turn challenges into **long-term manageable objects**
- Provide **visibility into the user's product journey**
- Increase **re-engagement with active challenges**
- Enable **quick continuation of work**
- Surface **insights about the user's learning patterns**

---

# 4. Page Structure

The **Your Journey page** contains three sections:

### Section 1 — Journey Insights

Provides a high-level overview of the user's activity.

Components:

**Challenge Activity Overview**

Displays aggregated stats:

- Total challenges
- Active challenges
- Completed challenges
- Saved recommendations
- Used recommendations

Possible visualization:

- Compact dashboard cards
- Progress bar or simple chart

---

**Content Type Distribution**

Shows which types of PM Artifacts the user interacted with.

Example:

- Frameworks
- Playbooks
- Articles
- Rules of Thumb
- Anti-Patterns
- Founder Stories

Purpose:

Helps users understand **what type of knowledge they use most**.

---

**Top Thought Leaders**

Displays the **most frequent sources** from recommendations.

Example:

- Lenny Rachitsky
- Marty Cagan
- Brian Balfour
- Gibson Biddle

Goal:

Reinforce **trust and recognition of knowledge sources**.

---

### Section 2 — Active Challenges

Highlights challenges that are still in progress.

Each card includes:

- Challenge title
- Short summary
- Current status
- Selected artifact
- Progress indicator
- "Continue" button

Purpose:

Provide a **clear entry point back into ongoing work**.

---

### Section 3 — Challenge Overview Table

Displays the full list of challenges.

This replaces the current simple table with a **structured management interface**.

---

# 5. Functional Requirements

## 5.1 Enhanced Challenge Table

Each challenge entry includes:

- Challenge ID
- Title
- Short summary
- Status  
  - Open  
  - In Progress  
  - Completed  
  - Archived  
  - Abandoned
- Selected Artifact
- Category  
  - Strategy  
  - Discovery  
  - Delivery  
  - Growth  
  - Leadership
- Creation date
- Last activity date
- Completion date (if applicable)
- Progress indicator

---

## 5.2 Filtering & Sorting

Users can filter by:

- Status
- Category
- Artifact type
- Date range

Sorting options:

- Creation date
- Last activity
- Completion date
- Alphabetical

---

## 5.3 Challenge Lifecycle States

Each challenge supports lifecycle transitions.

States:

Open  
In Progress  
Completed  
Archived  
Abandoned

If **Abandoned**:

User can optionally provide:

- Reason category
- Free-text explanation

Example categories:

- No longer relevant
- Solved outside Contexta
- Lack of time
- Company priority changed

---

## 5.4 Challenge Detail Navigation

Clicking a challenge opens the existing **result View**.

The state must reflect the **latest saved execution progress**.

---

## 5.5 Execution Continuation

From the Your Journey page users can:

Continue active work via:

- "Continue" button on challenge cards
- Table row click

Continuation opens the **Recommendation Detail page**.

---

# 7. Navigation

The page is accessible via the **main navigation bar**:

- Home
- Your Journey
- New Challenge
- Profile

Users are redirected to **Your Journey** after:

- saving a challenge
- Logging in

