# Contexta — Product / Requirements Document

# Requirements Document

## Introduction

The Fast Activation Core Flow enables first-time ICP users to reach a clear "aha" moment within minutes by guiding them from entry to a prioritized, context-aware content recommendation. The system functions as a Problem Pattern Intelligence System that uses structured data frameworks, archetype-based matching, and semantic similarity to generate explainable, context-aware recommendations. The flow includes instant access without mandatory signup, context anchoring, guided challenge submission, progress indication, expectation setting, and content recommendation generation powered by a three-layer matching architecture (structured filtering, semantic similarity, and archetype alignment). Users submit a real product or leadership challenge and receive a prioritized overview of relevant frameworks, playbooks, or articles based on structured Challenge and Content schemas that enable reliable retrieval and explainable recommendations. The entire experience is designed to achieve 30% activation rate within 48 hours by providing immediate value through a structured, time-efficient process that removes early friction and uncertainty while building toward learning paths, marketplace matching, and evaluation loops.

## Glossary

### Flow Components
- **Access_Controller**: The system component that manages user entry without mandatory signup
- **Entry_Interface**: The landing interface that provides immediate product access
- **Primary_CTA**: The main call-to-action that leads users into the core flow
- **Context_Collector**: The system component that captures user role and startup stage information
- **Role_Selector**: The interface element allowing users to choose their primary role
- **Stage_Selector**: The interface element allowing users to specify their startup stage
- **Navigation_Controller**: The system component that manages automatic progression between steps
- **Challenge_Prompter**: The system component that provides guided prompts and examples for challenge submission
- **Challenge_Validator**: The system component that validates and confirms challenge submissions
- **Progress_Indicator**: The interface element that shows user progress through the flow
- **Expectation_Messenger**: The system component that displays effort-to-value messaging
- **Activation_Prompter**: The system component that presents clear CTAs for recommendation activation

### Content Intelligence Components
- **Content_Recommender**: The system component that generates prioritized content recommendations using three-layer matching architecture
- **Challenge_Processor**: The system component that transforms raw challenge input into structured Challenge schema
- **Content_Indexer**: The system component that maintains structured Content schema for all curated materials
- **Structured_Filter**: The matching layer that filters content by taxonomy and context overlap
- **Semantic_Matcher**: The matching layer that ranks content using embedding-based similarity
- **Archetype_Classifier**: The matching layer that classifies challenges into problem archetypes and boosts aligned content
- **Matching_Engine**: The system component that orchestrates the three-layer matching architecture

### Data Structures
- **Challenge_Schema**: Structured representation of user challenges including taxonomy, context, problem patterns, and constraints
- **Content_Schema**: Structured representation of content items including taxonomy, outcome mapping, context fit, and maturity
- **Problem_Archetype**: A recurring product dysfunction pattern defined by typical blockers, context conditions, outcome goals, and solution paths
- **Archetype_Definition**: The specification of an archetype including problem description, context signals, core blockers, and content mappings
- **Taxonomy_Layer**: Classification system including domains, capability tags, and challenge types
- **Context_Layer**: User context including role, experience level, company stage, team size, and organizational complexity
- **Problem_Pattern_Layer**: Problem characteristics including core blockers, impact scope, and urgency level
- **Constraint_Layer**: Challenge constraints including time, political, resource, and information limitations

### Domain Values
- **Domain**: Product management focus area (strategy | discovery | delivery | growth | leadership)
- **Capability_Tag**: Specific PM capability or skill area
- **Challenge_Type**: Category of challenge (decision | alignment | prioritization | execution | capability_gap | scaling_problem)
- **Core_Blocker**: Standardized problem blocker (lack_of_clarity | conflicting_priorities | missing_data | stakeholder_misalignment | weak_process | lack_of_authority | capability_gap | scaling_issues)
- **Experience_Level**: User experience tier (junior | mid | senior | exec)
- **Company_Stage**: Startup maturity level (idea | seed | series_a | growth | enterprise)
- **Org_Complexity**: Organizational complexity level (low | medium | high)
- **Content_Format**: Type of content structure (framework | playbook | case_study | mental_model | anti_pattern | method)
- **Designed_Outcome**: Target outcome for content (clarity | alignment | speed | growth | scale | confidence | influence)
- **Depth_Level**: Content sophistication (introductory | intermediate | advanced)
- **Implementation_Effort**: Effort required to apply content (low | medium | high)
- **Time_To_Value**: Expected value delivery timeline (quick_win | mid_term | long_term)
- **Abstraction_Level**: Content focus level (tactical | operational | strategic)

### Legacy Terms
- **Knowledge_Curator**: The system component that manages curated source material and decision patterns
- **Decision_Pattern**: A normalized, actionable rule in the format "When X → do Y (unless Z)"
- **Source_Material**: Curated high-quality references (podcasts, blogs, frameworks) for each problem archetype
- **Context_Signal**: Indicators such as role, stage, and team size that help classify user challenges
- **User**: A first-time PM leader or founder using the guidance tool
- **Context_Data**: The collected role and startup stage information
- **Challenge_Data**: The user's submitted product or leadership challenge
- **Content_Recommendation**: A prioritized list of relevant frameworks, playbooks, or articles
- **Activation_Event**: User completion of select, save, or open actions on recommendations
- **Meaningful_Action**: The first substantive interaction that provides value to the user
- **Recommendation_Overview**: A prioritized list of 3-5 content items with explanations of relevance

## Requirements

### Requirement 1: Immediate Product Entry

**User Story:** As a time-constrained PM leader, I want to start using the product immediately without creating an account, so that I don't lose momentum before taking my first action.

#### Acceptance Criteria

1. THE Access_Controller SHALL allow users to enter the product and start the core flow without mandatory signup
2. THE Access_Controller SHALL not require email verification before first interaction
3. THE Access_Controller SHALL defer signup until after first meaningful action or activation
4. WHEN a user accesses the product, THE Entry_Interface SHALL provide immediate access to core functionality

### Requirement 2: Clear First Action Definition

**User Story:** As a new user, I want a clear first step I can take immediately, so that I'm not left wondering how to start.

#### Acceptance Criteria

1. THE Entry_Interface SHALL display one primary CTA that is clearly highlighted
2. THE Entry_Interface SHALL not show competing primary actions alongside the main CTA
3. THE Primary_CTA SHALL lead directly into the context collection step
4. THE Primary_CTA SHALL use clear, action-oriented language such as "Start with your challenge"

### Requirement 3: Role Selection

**User Story:** As a first-time PM leader or founder, I want to select my primary role, so that the guidance I receive is tailored to my responsibilities.

#### Acceptance Criteria

1. THE Role_Selector SHALL display three role options: PM, Founder, and Other
2. WHEN a user clicks on a role option, THE Role_Selector SHALL visually indicate the selection
3. THE Role_Selector SHALL allow only one role to be selected at a time
4. WHEN a user changes their role selection, THE Role_Selector SHALL update to show the new selection and clear the previous one

### Requirement 4: Startup Stage Selection

**User Story:** As a first-time PM leader or founder, I want to specify my startup stage, so that the guidance reflects my current business context.

#### Acceptance Criteria

1. THE Stage_Selector SHALL display startup stage options appropriate for early-stage contexts
2. WHEN a user selects a startup stage, THE Stage_Selector SHALL visually confirm the selection
3. THE Stage_Selector SHALL allow only one stage to be selected at a time
4. WHEN a user changes their stage selection, THE Stage_Selector SHALL update to reflect the new choice

### Requirement 5: Context Completion Validation

**User Story:** As a user, I want the system to validate my context selections, so that I can proceed only when I've provided the necessary information.

#### Acceptance Criteria

1. WHEN both role and startup stage are selected, THE Context_Collector SHALL enable progression to the next step
2. WHEN either role or startup stage is missing, THE Context_Collector SHALL prevent progression and maintain current state
3. THE Context_Collector SHALL provide clear visual feedback about completion status
4. WHEN context is incomplete, THE Context_Collector SHALL indicate which selections are still needed

### Requirement 6: Rapid Completion Design

**User Story:** As a first-time user, I want to complete the context step quickly, so that I can reach valuable guidance without delay.

#### Acceptance Criteria

1. THE Context_Collector SHALL be designed to enable completion within 30 seconds
2. THE Role_Selector SHALL use clear, immediately recognizable labels
3. THE Stage_Selector SHALL use terminology familiar to startup founders and PM leaders
4. THE Context_Collector SHALL minimize cognitive load through simple, focused choices

### Requirement 7: Automatic Navigation

**User Story:** As a user, I want to be automatically taken to the challenge input step after completing context selection, so that I maintain momentum in the activation flow.

#### Acceptance Criteria

1. WHEN both role and startup stage are selected, THE Navigation_Controller SHALL automatically transition to the challenge input step
2. THE Navigation_Controller SHALL complete the transition without requiring additional user action
3. WHEN transitioning, THE Navigation_Controller SHALL preserve the collected context data
4. THE Navigation_Controller SHALL ensure the transition occurs immediately after context completion

### Requirement 8: Context Data Persistence

**User Story:** As a user, I want my context selections to be maintained during my session, so that I don't lose my progress if I navigate within the application.

#### Acceptance Criteria

1. WHEN context data is collected, THE Context_Collector SHALL store it for the duration of the user session
2. WHEN a user returns to the context step, THE Context_Collector SHALL display their previous selections
3. THE Context_Collector SHALL maintain context data until the user completes the activation flow or ends their session
4. WHEN the session ends, THE Context_Collector SHALL clear the stored context data

### Requirement 9: Analytics Integration

**User Story:** As a product team, I want to track user behavior in the context step, so that we can measure completion rates and identify drop-off points.

#### Acceptance Criteria

1. WHEN a user begins the context step, THE Context_Collector SHALL log a context_step_started event
2. WHEN a user completes role selection, THE Context_Collector SHALL log a role_selected event with the chosen role
3. WHEN a user completes stage selection, THE Context_Collector SHALL log a stage_selected event with the chosen stage
4. WHEN context collection is completed, THE Context_Collector SHALL log a context_completed event
5. WHEN a user transitions to the challenge input step, THE Navigation_Controller SHALL log a challenge_input_transition event

### Requirement 10: Guided Challenge Prompting

**User Story:** As a new user feeling stuck, I want help phrasing my current product or leadership challenge, so that I can submit a useful input without overthinking it.

#### Acceptance Criteria

1. THE Challenge_Prompter SHALL display guided prompts or examples to help users articulate their challenges
2. THE Challenge_Prompter SHALL enable challenge submission without requiring long free text input
3. WHEN a user views the challenge input interface, THE Challenge_Prompter SHALL provide clear guidance on what constitutes a useful challenge description
4. THE Challenge_Prompter SHALL minimize cognitive load by offering structured input options

### Requirement 11: Challenge Submission Validation

**User Story:** As a user submitting a challenge, I want clear confirmation that my submission was successful, so that I know the system received my input.

#### Acceptance Criteria

1. WHEN a user submits a challenge, THE Challenge_Validator SHALL provide immediate confirmation of successful submission
2. THE Challenge_Validator SHALL clearly indicate submission status through visual feedback
3. WHEN submission fails, THE Challenge_Validator SHALL provide clear error messaging and guidance for resolution
4. THE Challenge_Validator SHALL ensure submitted challenges meet minimum quality criteria before acceptance

### Requirement 12: Effort-to-Value Expectation Setting

**User Story:** As a time-constrained startup operator, I want to know upfront how long it will take to get value, so that I feel confident continuing the flow.

#### Acceptance Criteria

1. THE Expectation_Messenger SHALL display explicit timing messaging before challenge submission
2. THE Expectation_Messenger SHALL communicate expected time investment and value delivery clearly
3. WHEN a user views the challenge input interface, THE Expectation_Messenger SHALL show messaging such as "Get personalized content recommendations in ~3 minutes"
4. THE Expectation_Messenger SHALL set realistic expectations about the effort required to complete the flow

### Requirement 13: Progress Indication

**User Story:** As a first-time user, I want to see where I am in the process, so that I know I'm getting closer to value.

#### Acceptance Criteria

1. THE Progress_Indicator SHALL display clear step indicators throughout the flow
2. THE Progress_Indicator SHALL show current step and total steps in a format like "Step 2 of 3"
3. WHEN a user progresses to the next step, THE Progress_Indicator SHALL update to reflect the new position
4. THE Progress_Indicator SHALL be visible and consistent across all steps in the flow

### Requirement 14: Content Recommendation Generation

**User Story:** As a first-time PM leader, I want a prioritized overview of relevant frameworks, playbooks, or articles based on my challenge, so that I clearly understand what will help most with my situation.

#### Acceptance Criteria

1. WHEN a challenge is submitted, THE Content_Recommender SHALL create a prioritized content recommendation overview immediately
2. THE Content_Recommender SHALL include 3-5 recommended content items in the overview
3. THE Content_Recommender SHALL clearly mark one recommendation as "most relevant" based on the submitted challenge and user context data
4. THE Content_Recommender SHALL include a short explanation for each item describing why it helps with the user's challenge
5. THE Content_Recommender SHALL deliver the recommendations without requiring additional user input or waiting periods
6. THE Content_Recommender SHALL exclude deep content, full summaries, and multiple recommendation strategies from the overview

### Requirement 15: Content Recommendation Structure

**User Story:** As a user receiving content recommendations, I want clear explanations of why each item helps with my challenge, so that I can understand the relevance and make informed choices.

#### Acceptance Criteria

1. THE Content_Recommendation SHALL contain a short explanation for each recommended item describing why it helps with the user's challenge
2. THE Content_Recommendation SHALL include clear titles and descriptions for each recommended framework, playbook, or article
3. THE Content_Recommendation SHALL be structured for immediate understanding without additional research
4. THE Content_Recommendation SHALL focus on relevance explanations rather than detailed content summaries

### Requirement 16: Recommendation Activation Call-to-Action

**User Story:** As a user who received content recommendations, I want clear prompts to select, save, or open recommended items, so that I can act on them immediately.

#### Acceptance Criteria

1. WHEN recommendations are displayed, THE Activation_Prompter SHALL present clear activation CTAs for each recommended item
2. THE Activation_Prompter SHALL offer at least one easy-to-complete activation action (select, save, or open)
3. THE Activation_Prompter SHALL make activation options immediately visible with each recommendation
4. WHEN a user completes an activation action, THE Activation_Prompter SHALL confirm the completion

### Requirement 17: Activation Event Tracking

**User Story:** As a product team, I want to track activation events, so that we can measure the success of the core flow.

#### Acceptance Criteria

1. WHEN a user selects a recommendation, THE Activation_Prompter SHALL log a recommendation_selected event
2. WHEN a user saves a recommendation, THE Activation_Prompter SHALL log a recommendation_saved event  
3. WHEN a user opens a recommendation, THE Activation_Prompter SHALL log a recommendation_opened event
4. WHEN any activation event occurs, THE Activation_Prompter SHALL log an activation_completed event
5. THE Activation_Prompter SHALL track the specific activation method chosen by each user

### Requirement 18: Canonical Problem Archetype Set

**User Story:** As a product/domain team, I want to define and maintain a small, canonical set of the most common PM leadership problem archetypes, so that the system can reliably generate relevant and non-generic guidance for first-time PM leaders.

#### Acceptance Criteria

1. THE Knowledge_Curator SHALL maintain a list of 15–20 problem archetypes
2. WHEN defining each archetype, THE Knowledge_Curator SHALL include a short problem description, typical context signals (role, stage, team size), key constraints and failure modes
3. THE Knowledge_Curator SHALL map each archetype to at least one Product Outcome (PO1–PO4)
4. THE Knowledge_Curator SHALL exclude edge cases and highly specialized enterprise scenarios from the canonical set

### Requirement 19: Curated Source Material per Archetype

**User Story:** As a domain expert/content curator, I want to curate a small set of high-quality sources for each problem archetype, so that generated guidance is grounded in credible, real-world reasoning instead of generic advice.

#### Acceptance Criteria

1. THE Knowledge_Curator SHALL maintain 3–5 trusted source references for each archetype
2. WHEN curating sources, THE Knowledge_Curator SHALL extract decision heuristics, trade-offs, and common mistakes from each source
3. THE Knowledge_Curator SHALL tag each source by archetype, company stage, and role relevance
4. THE Knowledge_Curator SHALL exclude full transcription, summarization, and exhaustive content coverage from the curation scope

### Requirement 20: Normalized Decision Patterns

**User Story:** As a system designer, I want curated content normalized into reusable decision patterns, so that the AI can generate actionable, context-aware plans instead of abstract recommendations.

#### Acceptance Criteria

1. THE Knowledge_Curator SHALL store knowledge as "When X → do Y (unless Z)" patterns, trade-off rules, and anti-patterns
2. THE Knowledge_Curator SHALL explicitly link patterns to problem archetypes and context signals
3. THE Knowledge_Curator SHALL ensure each pattern can be traced back to its source(s)
4. THE Knowledge_Curator SHALL exclude perfect ontologies, full knowledge graphs, and automated pattern extraction from the initial implementation scope

### Requirement 21: Enhanced Content Recommendation with Domain Knowledge

**User Story:** As a Content_Recommender component, I want to use problem archetypes, curated sources, and decision patterns, so that I can create context-aware, credible content recommendations instead of generic suggestions.

#### Acceptance Criteria

1. WHEN generating recommendations, THE Content_Recommender SHALL classify user challenges using the canonical problem archetypes
2. THE Content_Recommender SHALL ground recommendations in curated source material relevant to the identified archetype
3. THE Content_Recommender SHALL apply decision patterns that match the user's context signals (role, stage, team size)
4. THE Content_Recommender SHALL ensure generated recommendations are relevant and context-aware rather than generic or broad

### Requirement 22: Persistent Recommendation Context (Session-Level)

**User Story:** As a returning user in the same session, I want the system to remember my challenge and recommendations, so that I can explore additional content without starting over.

#### Acceptance Criteria

1. THE Navigation_Controller SHALL allow users to navigate back to the recommendation overview within the same session
2. THE Content_Recommender SHALL maintain previously recommended items visible when users return
3. THE Context_Collector SHALL preserve challenge and context data throughout the session for recommendation consistency
4. THE Content_Recommender SHALL exclude cross-session persistence, accounts, and history views from the session-level context

### Requirement 23: Structured Challenge Schema

**User Story:** As a Challenge_Processor, I want to transform raw challenge input into a structured Challenge schema, so that the matching system can perform reliable structured retrieval.

#### Acceptance Criteria

1. THE Challenge_Processor SHALL extract and structure raw_input, structured_summary, problem_statement, and desired_outcome_statement from user challenges
2. THE Challenge_Processor SHALL classify challenges using the Taxonomy_Layer including primary_domain, secondary_domain, capability_tag, and challenge_type
3. THE Challenge_Processor SHALL extract Context_Layer information including role, experience_level, company_stage, team_size, org_complexity, and stakeholder_pressure_level
4. THE Challenge_Processor SHALL identify Problem_Pattern_Layer attributes including core_blockers, impact_scope, and urgency_level
5. THE Challenge_Processor SHALL capture Constraint_Layer elements including time_constraint, political_constraint, resource_constraint, and information_constraint
6. WHEN any required schema field cannot be determined from input, THE Challenge_Processor SHALL use reasonable defaults based on collected context data

### Requirement 24: Structured Content Schema

**User Story:** As a Content_Indexer, I want to maintain structured Content schemas for all curated materials, so that the matching system can perform reliable filtering and ranking.

#### Acceptance Criteria

1. THE Content_Indexer SHALL store core metadata including title, summary, key_takeaways, source_type, and content_format for each content item
2. THE Content_Indexer SHALL classify content using the Taxonomy_Layer mirroring Challenge taxonomy (primary_domain, secondary_domain, capability_tag, applicable_challenge_type)
3. THE Content_Indexer SHALL map content to outcomes and blockers including designed_for_outcome and solves_blockers
4. THE Content_Indexer SHALL define Context_Fit including ideal_role, ideal_experience_level, ideal_company_stage, ideal_team_size_range, org_complexity_fit, and stakeholder_pressure_fit
5. THE Content_Indexer SHALL specify Maturity_Layer attributes including depth_level, implementation_effort, time_to_value, and abstraction_level
6. THE Content_Indexer SHALL maintain Authority_Layer information including content_creator, original_thought_leader, and credibility_weight

### Requirement 25: Problem Archetype Definitions

**User Story:** As a system architect, I want to define Problem Archetypes as recurring product dysfunction patterns, so that the system can provide interpretation and narrative explanation rather than just similarity-based recommendations.

#### Acceptance Criteria

1. THE Archetype_Classifier SHALL maintain 12-15 manually defined Problem_Archetype definitions
2. WHEN defining each archetype, THE Archetype_Classifier SHALL specify typical blockers, typical context conditions, typical outcome goals, and typical solution paths
3. THE Archetype_Classifier SHALL include example archetypes such as Roadmap Chaos, Founder Bottleneck, Feature Factory Trap, Growth Plateau After PMF, Misaligned OKRs, and Overloaded PM
4. THE Archetype_Classifier SHALL enable content sequencing, explainable recommendations, reusable learning paths, and structured marketplace matching through archetype definitions

### Requirement 26: Three-Layer Matching Architecture

**User Story:** As a Matching_Engine, I want to use a three-layer matching architecture, so that recommendations are both relevant and explainable through structured filtering, semantic similarity, and archetype alignment.

#### Acceptance Criteria

1. THE Matching_Engine SHALL implement structured filtering as the first matching layer
2. THE Matching_Engine SHALL implement semantic similarity ranking as the second matching layer
3. THE Matching_Engine SHALL implement archetype alignment boosting as the third matching layer
4. THE Matching_Engine SHALL combine all three layers to produce final content scores and rankings

### Requirement 27: Structured Filtering Layer

**User Story:** As a Structured_Filter, I want to filter content by taxonomy and context overlap, so that only contextually appropriate content reaches the ranking stage.

#### Acceptance Criteria

1. THE Structured_Filter SHALL filter content by primary_domain match between Challenge and Content schemas
2. THE Structured_Filter SHALL filter content by capability_tag overlap between Challenge and Content schemas
3. THE Structured_Filter SHALL filter content by company_stage compatibility between Challenge context and Content context_fit
4. THE Structured_Filter SHALL filter content by role compatibility between Challenge context and Content ideal_role
5. THE Structured_Filter SHALL filter content by solves_blockers overlap with Challenge core_blockers
6. WHEN no content passes all filters, THE Structured_Filter SHALL relax constraints progressively starting with secondary criteria

### Requirement 28: Semantic Similarity Layer

**User Story:** As a Semantic_Matcher, I want to rank filtered content using embedding-based similarity, so that semantically relevant content is prioritized.

#### Acceptance Criteria

1. THE Semantic_Matcher SHALL generate embeddings for Challenge problem_statement and desired_outcome_statement
2. THE Semantic_Matcher SHALL generate embeddings for Content summary and key_takeaways
3. THE Semantic_Matcher SHALL compute similarity scores between Challenge and Content embeddings
4. THE Semantic_Matcher SHALL rank content by semantic similarity scores in descending order
5. WHEN multiple content items have similar semantic scores, THE Semantic_Matcher SHALL preserve relative ordering for archetype boosting

### Requirement 29: Archetype Classification and Alignment

**User Story:** As an Archetype_Classifier, I want to classify challenges into problem archetypes and boost aligned content, so that recommendations are explainable and pattern-based rather than purely similarity-driven.

#### Acceptance Criteria

1. WHEN a structured Challenge is processed, THE Archetype_Classifier SHALL classify it into one or more Problem_Archetypes
2. THE Archetype_Classifier SHALL use Challenge core_blockers, context conditions, and desired outcomes to determine archetype matches
3. THE Archetype_Classifier SHALL boost content scores when Content is mapped to the same archetype as the Challenge
4. THE Archetype_Classifier SHALL apply archetype_alignment_weight to matching content items
5. WHEN a Challenge matches multiple archetypes, THE Archetype_Classifier SHALL apply boosting for all matching archetypes

### Requirement 30: Final Score Composition

**User Story:** As a Matching_Engine, I want to combine structured fit, semantic similarity, and archetype alignment into a final score, so that recommendations balance multiple relevance signals.

#### Acceptance Criteria

1. THE Matching_Engine SHALL compute final scores using the formula: structured_fit_weight + embedding_similarity_weight + archetype_alignment_weight + context_fit_adjustment
2. THE Matching_Engine SHALL normalize all component scores to comparable ranges before combination
3. THE Matching_Engine SHALL rank content by final scores in descending order
4. THE Matching_Engine SHALL return the top 3-5 highest-scoring content items as recommendations
5. WHEN content items have identical final scores, THE Matching_Engine SHALL use credibility_weight as a tiebreaker

### Requirement 31: Archetype-Based Content Mapping

**User Story:** As a Content_Indexer, I want to map content items to problem archetypes, so that archetype alignment boosting can function correctly.

#### Acceptance Criteria

1. THE Content_Indexer SHALL maintain archetype mappings for each content item
2. THE Content_Indexer SHALL allow content to be mapped to multiple archetypes when applicable
3. WHEN content is mapped to an archetype, THE Content_Indexer SHALL validate that the content addresses typical blockers for that archetype
4. THE Content_Indexer SHALL store archetype mappings as part of the Content_Schema

### Requirement 32: Explainable Recommendation Output

**User Story:** As a Content_Recommender, I want to provide explanation metadata with each recommendation, so that users understand why content was recommended.

#### Acceptance Criteria

1. WHEN generating recommendations, THE Content_Recommender SHALL include the matched archetype name for each recommended item
2. THE Content_Recommender SHALL include the primary matching reason (structured fit, semantic similarity, or archetype alignment)
3. THE Content_Recommender SHALL include context fit indicators showing why the content matches user context
4. THE Content_Recommender SHALL include blocker alignment showing which user blockers the content addresses

### Requirement 33: Archetype Evolution Logging

**User Story:** As a system architect, I want to log challenge-to-archetype mappings and outcome signals, so that archetype definitions can be refined over time.

#### Acceptance Criteria

1. WHEN a Challenge is classified, THE Archetype_Classifier SHALL log the challenge ID, assigned archetypes, and classification confidence
2. WHEN a user activates a recommendation, THE Activation_Prompter SHALL log the archetype associated with the activated content
3. THE Archetype_Classifier SHALL store evaluation signals for future archetype refinement
4. THE Archetype_Classifier SHALL exclude automated archetype evolution and real-time learning from the initial implementation scope

### Requirement 34: Challenge Schema Validation

**User Story:** As a Challenge_Processor, I want to validate structured Challenge schemas, so that downstream matching components receive well-formed data.

#### Acceptance Criteria

1. THE Challenge_Processor SHALL validate that primary_domain is one of the allowed domain values
2. THE Challenge_Processor SHALL validate that challenge_type is one of the allowed challenge type values
3. THE Challenge_Processor SHALL validate that core_blockers contains only standardized blocker values
4. THE Challenge_Processor SHALL validate that experience_level and company_stage are valid enum values
5. WHEN validation fails, THE Challenge_Processor SHALL log the validation error and use fallback values

### Requirement 35: Content Schema Validation

**User Story:** As a Content_Indexer, I want to validate structured Content schemas, so that the matching system can rely on consistent data quality.

#### Acceptance Criteria

1. THE Content_Indexer SHALL validate that primary_domain matches allowed domain values
2. THE Content_Indexer SHALL validate that content_format is one of the allowed format values
3. THE Content_Indexer SHALL validate that designed_for_outcome contains only valid outcome values
4. THE Content_Indexer SHALL validate that solves_blockers contains only standardized blocker values
5. WHEN validation fails, THE Content_Indexer SHALL reject the content item and log the validation error

### Requirement 36: Embedding Generation and Storage

**User Story:** As a Semantic_Matcher, I want to generate and store embeddings for challenges and content, so that semantic similarity can be computed efficiently.

#### Acceptance Criteria

1. THE Semantic_Matcher SHALL generate embeddings for Challenge problem_statement and desired_outcome_statement upon challenge submission
2. THE Content_Indexer SHALL pre-generate and store embeddings for Content summary and key_takeaways during content ingestion
3. THE Semantic_Matcher SHALL use a consistent embedding model for both challenges and content
4. THE Semantic_Matcher SHALL compute cosine similarity between challenge and content embeddings
5. WHEN embeddings cannot be generated, THE Semantic_Matcher SHALL log the error and exclude semantic scoring for that item

This file is the single source of truth for product requirements. See `q-and-a.md` for implementation decisions, Q&A, and MVP scope (e.g. access flow, context enums, matching layers, activation). See `specs/` for epic-level breakdown aligned with those decisions.
