# PRD — Recommendation Detail Screen

## 0. Prerequisite
The chunk retrieval, chunks matching the users challenge, must be optimized towards a PM artifact (concret element like Opportunity-solution-tree, PM-Wheel, RICE, JTBD) search. Currently it does a multi-search (domain, sematic and keyword). Top-k ranked chunks get listed. This logic has to be updated in the way that we show the user the best matched PM-Artifacts for their challenge. Each Artifact is only shown once. We will not show the user from which content item we retrieved it. 
We will show the following:

- Titel
- domain(s)
- what is it used for (e.g. prioritization, alignment, focus, ...)

The user can then click on the shown artifects. What they see is described in the following sections.

## 1. Objective
Provide a detailed view for a recommended artifact (framework, playbook, article, etc.) that helps the user understand:
- what the artifact is
- when to use it
- how to apply it
- related deeper knowledge

The screen should reuse the layout and UI structure defined in the reference `ArtifactDetail` component. :contentReference[oaicite:0]{index=0}

---

# 2. Page Context

### Entry Point
User navigates to this screen by clicking a recommendation from:
- Challenge Results screen
- Saved recommendations
- Knowledge base items

### Navigation
Top navigation element:
Back button: **"Zurück zu den Empfehlungen"**

Action:
Returns user to the recommendation list.

---

# 3. Page Layout

Responsive **3-column layout**

Desktop:
- grid `lg:grid-cols-3`
- main content `lg:col-span-2`
- sidebar `lg:col-span-1`

Mobile:
- stacked layout

Structure:

Main Content  
Sidebar  
Related Knowledge Section (bottom)

---

# 4. Core Components

## 4.1 Header Section

Displays artifact metadata and title.

Fields:

- title
- domain
- reading_time
- description

UI Elements:

- domain badge
- reading time indicator
- artifact title (large headline)

Example:

Discovery  
15 min read  
Opportunity Solution Tree

---

## 4.2 Tab Navigation

Two tabs control the main view.

Tabs:

Overview  
How to use

Default state: **Overview**

---

## 4.3 Overview Tab

### Section A — Description

Title:
**Über dieses Framework**

Content:
Artifact explanation and contextual summary.

---

### Section B — Metadata Cards

The following data must come from the LLM and not from the internal RAG.

Two cards.

Card 1 — Suitability

Fields:
- company_stage
- domain

Example:
Growth / Series A-B  
Discovery

---

Card 2 — Thought Leaders

Displays authors associated with the artifact.

Example:

Teresa Torres  
Marty Cagan

Purpose:
Build credibility and context.

---

## 4.4 How-To-Use Tab

Step-by-step application guide.

Display a 1-3 sentence explaniation of how to use it. Show a structured step-by-step flow next.

Structure:

Step Number  
Step Title  
Step Explanation

Example:

1. Define Outcome  
Define a measurable business metric.

2. Map Opportunities  
Identify user needs and problems.

Steps are displayed in a vertical flow with numbered indicators.

This data must come from the LLM and not from the internal RAG.
---

## 4.5 Sidebar (Sticky)

Contextual insight panel.

Purpose:
Provide AI-generated guidance related to the artifact and the user's challenge.

Contents:

Title: **Contexta Pro-Tipp**

Short contextual recommendation.

CTA Button:

Save to Playbook (will be implemented in on of the next epics)

Action:
Stores artifact in user's personal library.

Behavior:

Desktop:
Sticky sidebar

Mobile:
Inline section.

---

## 4.6 Knowledge Base Section

Horizontal scrollable carousel with related content.

Purpose:
Provide deeper learning material related to the artifact, to build trust. Frame it like "see who speaks about this artifact. That comes from our hybrid RAG (import: use keyword search th get top-k chunks which with the artifact as keyword. Only show each content item one time, remove all other chunks found for that conent piece. show max. 5 content peices.)

Load the data when user opens the artifacts details screen. Don't wait until data comes back from ai module but show a dynamic skaleton while waiting for the data.

Supported content types:

Podcast  
Video  
Article

Card Fields:

- title
- speaker / author
- source
- duration
- content type

Interaction:

Click card → open **Content Detail Screen** --> details are tbd

---

# 5. Data Model

Artifact object

artifact
- id
- title
- description
- domain
- reading_time
- company_stage
- thought_leaders[]
- how_to_steps[]
    - step_title
    - step_detail

---

Related content

content
- id
- title
- type
- speaker
- source (if known)
- duration (if known)

---

# 6. User Actions

Back → returns to recommendation list

Switch Tab → toggle overview / how-to

Save to Playbook → stores artifact (later)

Open Related Content → opens content detail screen (later)

Scroll Knowledge Base → browse additional resources

---

# 7. Functional Requirements

Performance:
two separate AI calls:
- first: get the data for the overview, how-to-use, metad-data and contexta-pro-tip from LLM
- second: get "who talks about it" data from internal RAG with embedding LLM

intial Page load < 1 second

---

# 8. Future Enhancements (Not MVP)

Artifact difficulty indicator  
User progress tracking  
Recommended next frameworks  
Artifact rating  
Discussion/comments