## 1.7 Stakeholders and Operational Context

The platform serves four levels of responsibility. The Platform Admin is responsible for the platform as a whole, while the Company Admin manages a single organization's workspace and membership. A Manager works with assigned employees, reviews work, schedules support, and interprets progress. An Employee completes assigned onboarding activities, asks questions, and receives feedback. These responsibilities inform the separation of global role and company role in the data model.

The distinction between a company administrator and a manager is useful operationally. Company administration includes maintaining the organization, adding members, configuring departments or cohorts, and managing shared company guidance. A manager focuses on a team: assigning activities, reviewing submissions, organizing meetings, and identifying support needs. An employee interacts with the resources and assigned work that are relevant to their own onboarding. The application still relies on accurate membership and reporting relationships; incorrect setup can result in incomplete views or access denials.

## 1.8 Project Outputs and Evaluation Boundary

The implemented outputs are a browser-based application, a relational database schema, server-side workflow actions, AI service integrations, automated logic tests, and seeded demonstration data. The main deliverable is not a trained foundation model. Gemini is called as an external service for text embeddings and generated outputs. The application's contribution is the orchestration around those calls: choosing the company data, selecting relevant context, validating responses, and presenting the result through an onboarding interface.

The evidence in this report is divided into implementation evidence and outcome evidence. Implementation evidence includes source modules, database structures, authorization checks, tests, and the successful indexing of three synthetic demo documents. Outcome evidence would require user studies, verified production content, measured completion time, answer-quality evaluation, and comparison with an existing onboarding process. The latter has not been collected, so no claims about improved retention or employee productivity are made.

## 2.7 Comparison of Related System Approaches

| Approach | Strength | Limitation addressed by Ascent |
|---|---|---|
| Shared document folder | Low-friction distribution of policies and training documents. | Does not represent task progress or manager review; the assistant adds question-led retrieval from indexed text. |
| Checklist or task board | Makes assigned work and completion status visible. | Does not normally provide company policy retrieval, assessments, or an onboarding-specific manager insight flow. |
| Learning management system | Organizes courses, learning content, and assessment records. | May not connect day-to-day onboarding tasks, company discussions, help meetings, and manager follow-up. |
| HR information system | Maintains employment records and formal HR processes. | The current project is not an HRIS and does not attempt payroll, benefits, compliance filing, or production identity provisioning. |
| General-purpose chatbot | Provides conversational access to a language model. | Without company scoping and source material, answers may be generic or unsupported; Ascent retrieves company passages and displays source titles. |
| Ascent prototype | Combines memberships, tasks, schedules, assessments, discussions, analytics, and company-scoped AI assistance. | Requires further work for file ingestion, anonymous questions, role roadmaps, scenario simulation, and production validation. |

This comparison is functional rather than a claim that the listed categories are interchangeable products. The project uses the comparison to identify the boundary of its own implementation. Ascent integrates selected onboarding workflows, but it does not replace a complete HR system, a learning content catalog, or an organization's authoritative document-management process.

## 2.8 Design Principles Derived from the Survey

The literature and the project statement suggest several design principles. First, onboarding should be represented as an ongoing process with tasks, resources, contact, and feedback rather than as a single document handoff. Second, employees and managers need different views because their responsibilities are different. Third, company identity must constrain data retrieval and mutation. Fourth, AI-generated guidance should be grounded in maintained company material and present source context. Fifth, decisions that affect assessment or employee standing should retain human review. Finally, evaluation must distinguish software correctness from organizational effectiveness.

These principles guide the implementation review. The report examines not only whether a page exists, but also whether a data model records the relevant state, whether an action enforces the proper role, whether a manager can review an AI suggestion, and whether evidence exists for the stated behavior.

## 3.8 Requirements Elicitation and Analysis

The supplied statement is the primary requirements source. It identifies company administration, role-specific onboarding plans, historical work simulations, scheduling, trainee dashboards, anonymous doubts, AI categorization, a company-specific assistant, and progress insights. Requirements were grouped by actor and workflow, then compared with application routes, server actions, schema models, and automated tests. This method creates a trace from the stated need to the delivered code and avoids treating planned work as completed functionality.

The employee journey was analyzed from access to completion. An employee must first authenticate and resolve a company membership; then see assigned work, attend sessions, complete assessments, ask for information, submit questions, and receive feedback. The manager journey begins with a company-scoped view of members and includes assignment, scheduling, review, and progress interpretation. The company administrator journey includes maintaining the workspace, members, teams, and shared policy text. The Platform Admin journey is distinct because it is not attached to a single employee team.

The analysis also identifies cross-cutting constraints. Every company operation needs tenant context. Any mutation needs input validation. Sensitive administrative changes should be auditable. AI access requires secret configuration and external network availability. A report or dashboard value needs a defined calculation and should not be interpreted without considering data completeness. These constraints appear in the non-functional requirements and verification plan.

## 3.9 Detailed Functional Requirements

| ID | Requirement | Primary actor | Acceptance condition | Current status |
|---|---|---|---|---|
| FR-01 | Authenticate a user and resolve their local profile | All users | Clerk identity is matched or provisioned as a local user | Implemented |
| FR-02 | Resolve an active company membership | Company user | Company pages use an active membership context | Implemented |
| FR-03 | Enforce company-role permissions on writes | Admin, Manager, Employee | Unauthorized action is rejected server-side | Implemented for protected actions |
| FR-04 | Manage departments and training cohorts | Company Admin | Company structure can be created and assigned | Implemented |
| FR-05 | Create and assign work | Manager | Selected employees receive scoped task assignments | Implemented |
| FR-06 | Submit and review employee work | Employee, Manager | Employee submission can be approved or sent for changes | Implemented |
| FR-07 | Schedule and manage onboarding meetings | Manager, Employee | Participants, timing, attendance and conflicts are represented | Implemented |
| FR-08 | Deliver structured assessment | Manager, Employee | Worksheet assignment, attempts, grading and release state are persisted | Implemented |
| FR-09 | Provide an anonymous question mechanism | Employee | Author identity is hidden from other users and protected for moderation | Not implemented; current forum is named |
| FR-10 | Categorize recurring questions | Manager | Authorized manager receives themes from eligible threads | Partially implemented with AI summary |
| FR-11 | Answer questions from company documents | Employee | Retrieved passages come from current company and answer includes source titles | Implemented for pasted text |
| FR-12 | Upload and parse policy files | Company Admin, Manager | Supported file is extracted, indexed and traceable to its source | Not implemented |
| FR-13 | Generate role- and duration-based roadmap | Company Admin, Manager | Roadmap is proposed from role and program length and can be edited | Not implemented as automatic generation |
| FR-14 | Conduct role-specific work simulation | Employee | Scenario presents a safe realistic task and captures evidence and rubric scores | Partially represented by tasks and assessments |
| FR-15 | Present progress indicators | Manager | Metrics are calculated from available task and released assessment data | Implemented with documented score weights |

Acceptance conditions are observable behaviors. They are intentionally more specific than a feature label: for example, FR-11 requires tenant scope and source titles, not merely a chat input. Requirements marked partial or not implemented remain visible in the coverage table in Chapter 5.

## 3.10 Detailed Role Workflows

### 3.10.1 Company administrator workflow

The administrator signs in, enters an active company workspace, checks membership and organization structure, and assigns the appropriate managers to employee profiles. The administrator can maintain the company knowledge text and oversee the workspace. For a demonstration, the seeded Ascent Demo Workspace has a dedicated manager-facing identity and employee-facing identity available through the private test route. The route is not linked from the public landing page. The workflow is intended for evaluation; the private test identities should not be treated as real production accounts.

Before adding a knowledge item, the administrator prepares authoritative plain text, assigns a descriptive title, and checks that it contains no secrets or unrelated personal information. After the item is indexed, the administrator checks the visible document list and asks representative questions. This verification confirms the ingestion and retrieval path is usable; it does not prove comprehensive answer quality. The current page does not accept source file uploads.

### 3.10.2 Manager workflow

The manager enters the company dashboard, reviews the team, creates tasks or worksheets, selects employees or cohorts, and sets timing and instructions. The manager creates meetings and considers any conflict warning. As employees submit work, the manager opens the review queue, checks evidence, provides feedback, and records a decision. The manager can use AI grading suggestions as a draft aid and forum summaries as a signal for follow-up, but must inspect the original answer or thread before taking action.

Manager progress review is an interpretation activity. The analytics page combines completion, delivery timing, and released assessment outcomes according to documented weights. Managers should open the source records and consider assignment difficulty, due-date changes, and missing data before acting on a score. The application does not establish that a composite metric is a validated measure of employee potential.

### 3.10.3 Employee workflow

The employee signs in, enters the company workspace, and reviews their dashboard and tasks. For each assignment, the employee reads the instructions, updates progress, and submits evidence. An assessment may be saved as a draft before submission. A manager reviews the answer and releases evaluation when ready. The employee can attend scheduled sessions, participate in named discussions, and ask the company assistant questions against indexed material.

When a source does not answer a question, the desired assistant behavior is to state that the material does not specify an answer and refer the employee to a manager. The employee can inspect returned source titles. Because forum posts are named, employees should use the discussion area only for questions appropriate to a named company forum; the current implementation does not satisfy the statement's anonymity requirement.

## 3.11 Data Flow and Process Analysis

The application has two main classes of data flow. Operational workflows move form input from a browser to a Next.js server action, through validation and authorization, into Prisma writes, and back to the page after cache revalidation. AI workflows first read company-scoped source data, call the embedding or generation provider from the server, validate the returned data, and then return a bounded result to the authorized interface. Provider credentials remain in server environment variables.

| Flow | Input | Processing | Persistent result | User-visible outcome |
|---|---|---|---|---|
| Task creation | Title, description, audience, dates | Role check, schema validation, assignment creation | Task and employee assignments | Task appears in employee and manager views |
| Task review | Submission and manager decision | Company scope and review rules | Review state and feedback | Employee sees approval or requested changes |
| Knowledge indexing | Title and pasted text | Validate, chunk, embed in batches | Company-scoped text chunks and JSON vectors | Document title appears in knowledge manager |
| Assistant question | Employee query | Embed query, cosine ranking, select top four, generate grounded response | No question history is implied by this action | Answer and source titles appear in the assistant |
| AI grading | Submission and rubric context | Manager authorization, model response parsing, mark bounds | Evaluation only after manager save | Manager reviews suggestion and decides whether to release |
| Doubt analysis | Recent eligible thread text | Company/report scope, bounded selection, JSON generation | Summary returned for review | Manager sees themes and suggested follow-up |

This process view highlights important transaction boundaries. A multi-question worksheet is created with its questions inside a database transaction so that partial creation is less likely. Knowledge chunks are written as a transaction after the embedding batch succeeds. An external provider call is not part of the database transaction; the system must handle provider failure before claiming that a complete AI-assisted operation succeeded.

## 3.12 Feasibility and Risk Analysis

Technical feasibility is supported by the existing implementation and the use of widely adopted web and database components. The principal technical risks are cross-company access errors, external AI provider failure, provider response variability, large knowledge corpora that make application-side vector comparison expensive, and incomplete coverage of proposed simulation features. These risks can be tested and mitigated, but the current prototype does not establish production-grade capacity or availability.

Operational feasibility depends on a company assigning an owner to onboarding content, maintaining role memberships, and responding to manager review queues. The system cannot keep a policy accurate if the company does not update it. It cannot provide meaningful analytics if tasks are not consistently assigned or assessed. The deployment must also account for email delivery, identity configuration, database credentials, and the availability of the AI provider.

Economic feasibility is suitable for an academic prototype because the development stack is based on open-source libraries and managed service tiers. Production cost cannot be inferred from the code alone. It will depend on active users, document volume, embedding operations, question volume, model token usage, database storage, email delivery, hosting, and support. A cost and latency study should precede a production rollout.

## 3.13 Security and Privacy Requirements

Security is considered at the identity, authorization, tenant, input, integration, and operational layers. Clerk authenticates normal users; the local membership record supplies application permissions. Protected server actions verify both role and company context. Runtime validation constrains many user inputs before writes. Gemini calls are made from server code using a secret key supplied through environment configuration. Audit events record selected administrative operations.

Privacy limitations remain. Discussion threads are named; the application does not currently provide anonymous posting. Forum text submitted for AI analysis is sent to the configured Gemini service. Knowledge content is stored as text and embeddings in the company database. A production deployment needs an approved data-processing policy, retention rules, content access review, and a review of the external provider's terms and configuration. The prototype does not claim a formal security certification or independent penetration test.

## 3.14 Chapter Summary

The analysis converts the project statement into actor-specific, testable requirements and documents which are complete, partial, or outstanding. It describes the full paths through administration, manager work, employee activity, knowledge indexing, and AI assistance. The architecture is technically feasible for a prototype, while production readiness depends on policy ownership, stronger evaluation, security review, and completion of the requirements that are currently partial.

## 4.14 Request Lifecycle and Module Boundaries

A normal application request begins in a route page or interactive React component. A read-only page obtains the authenticated user and active company context before querying through Prisma. A mutation is submitted to a server action. The action first calls an authorization helper, then validates the input, applies business rules, performs a database operation, and revalidates the route or returns structured feedback. The browser does not connect directly to PostgreSQL. This boundary keeps database credentials and AI keys on the server and gives the application a central place for authorization.

The main implementation areas are organized by domain. Company routes handle organization structure and member management. Task routes and employee task pages cover assignment and submission. Schedule routes cover meetings and attendance. Assessment actions own worksheet creation, assignment, submission, grading, and resubmission. Forum routes own thread and reply workflows. Company knowledge and assistant routes own ingestion and query operations. Analytics actions calculate performance views and request AI summaries. Shared libraries provide authentication, database access, validation, audit events, email, analytics calculations, and Gemini calls.

This organization follows feature boundaries rather than a separate backend service. The same Next.js server executes page logic and server actions. The project statement proposed a FastAPI API service; the repository instead uses the Next.js server runtime. This choice simplifies the prototype deployment but means there is no independently deployed Python service or WebSocket API in the present version.

## 4.15 Database Model and Relationships

The Prisma schema defines 23 application models in the current snapshot. Relational constraints connect users to company memberships, memberships to employee profiles, and operational records to their owning company. Most company-level objects use a company identifier directly; employee-specific actions use a membership relationship. The following catalog summarizes the domain responsibilities.

| Domain | Models | Relationship and use |
|---|---|---|
| Identity and tenancy | User, Company, CompanyMembership | User can have a membership in a company; the membership stores company role and status. |
| Organization | EmployeeProfile, Department, TrainingBatch | Profile extends a membership and can reference a department, cohort, and manager membership. |
| Task management | Task, TaskAssignment, TaskReview, HistoricalTrainingRecord | Task definition is separated from individual assignment, submission/review state, and prior completed experience. |
| Scheduling and help | Meeting, MeetingParticipant, EmployeeDoubt | Meeting owns event details; participant rows track invited users and attendance; employee doubt records its help lifecycle. |
| Assessment | Worksheet, Question, AssessmentAssignment, AssessmentSubmission, AssessmentAnswer, AssessmentEvaluation | Worksheet and ordered questions are assigned to employees; attempts, answers, and manager evaluations preserve separate state. |
| Discussion | ForumThread, ForumReply, ForumReport | Thread stores the author and status; replies support discussion; reports support moderation. |
| Knowledge and audit | CompanyKnowledgeDocument, AuditLog | Knowledge passages are tied to a company and creator membership; audit events record selected actions and actors. |

The CompanyMembership model is central to authorization. It connects a provider-backed user to a company, stores a role and status, and has relations to the user’s company-specific profile and authored work. EmployeeProfile holds employment and onboarding context such as department, batch, manager, start date, and onboarding status. That separation avoids placing company-specific role details directly on a global user identity.

The task domain separates a reusable Task from TaskAssignment. This permits one task to be associated with multiple employees while each assignment has its own progress. TaskReview captures a manager decision and feedback. The assessment domain uses a similar separation: a Worksheet and Question define reusable assessment content; AssessmentAssignment targets an employee; AssessmentSubmission and AssessmentAnswer represent the attempt; AssessmentEvaluation records reviewer output and release state. These relationships make the workflow auditable and preserve the difference between authoring, answering, and evaluating.

The schema uses cascading deletion for several tenant-owned relationships and nullable relations for some managerial or creator references. Such behavior should be reviewed carefully before production. A company deletion, membership removal, or manager deactivation can affect linked records. Data retention requirements may require soft deletion or archival rather than cascading deletion. The current report describes schema behavior, not a claim that a production records policy is finalized.

## 4.16 Authentication, Membership, and Authorization Implementation

Normal sign-in uses Clerk. When a signed-in identity is first encountered, the server finds the local user by Clerk identifier, links an existing invitation record by email where appropriate, or creates a local user. The resulting local user includes company memberships. A request to a company feature resolves an active membership, then returns the company identifier, membership identifier, role, and platform-admin status as the authorization context.

The role helper checks the requested company membership and allowed roles before returning a protected context. A Platform Admin has a separate global override for platform management functions. A company administrator or manager receives only the operations permitted by their company role. The test-session path is separate: a local cookie identifies a seeded user for the demonstration. The private portal is not advertised through the landing page, and credentials are read from server configuration rather than embedded in the public interface.

| Checkpoint | Question answered | Example failure behavior |
|---|---|---|
| Authentication | Is there a recognized Clerk or test-session identity? | Redirect to sign-in or reject the request. |
| Local profile | Does a matching application user exist? | Link an invited email or create a local record. |
| Membership | Is the user active in the requested company? | Redirect to onboarding or deny access. |
| Role | Is the membership role allowed for this action? | Return a forbidden error from the server action. |
| Tenant query | Is the database query constrained by the active company? | No cross-company row is returned or changed. |

The client interface can improve discoverability by hiding unavailable actions, but the server action remains the security decision point. Reviews should inspect both page loaders and mutations because a secure page can still call an incorrectly scoped action. Test coverage should use a user from a second company and attempt reads and writes, not only verify that links are hidden.

## 4.17 Task, Training, and Historical Work Implementation

Managers create tasks with title, descriptions, instructions, task type, priority, start and due dates, and any available resource links. Assignment operations create employee-specific TaskAssignment records for selected employees. Employees use their personal task view to update progress and submit notes or links. A manager review can approve the submission, request changes, or provide feedback. A changed submission returns to the employee for correction and can be reviewed again.

Historical work is represented separately from pending tasks. This distinction lets a manager record prior experience or training completion without asking the employee to repeat the activity. Reusable task types include daily work, training activity, recurring task, template, and historical record. Assignment status moves through states such as not started, in progress, submitted, under review, changes requested, and completed. Status transitions matter to analytics because completion and lateness are calculated from assignment dates and current status.

The workflow supports practical onboarding but is not a simulator. The task description and submission record do not create an isolated work environment, synthetic ticket queue, simulated source repository, or branching response. To implement the project statement’s simulation requirement, future development would need scenario definitions, sanitized artifacts, controlled choices, evidence capture, scoring rubrics, and an explicit rule that simulated activity cannot affect production systems.

## 4.18 Meeting and Doubt Management Implementation

Meeting records include a company, organizer membership, title, meeting type, scheduled time, status, and participation information. MeetingParticipant rows associate members with events and record invitation or attendance states. The schedule action checks overlapping time ranges for the organizer and participants and returns a warning. This is an application-level conflict check; external calendars are not synchronized by the repository.

Meeting types include training session, team meeting, one-to-one, and help session. The project also models employee doubts and their status, allowing an unresolved concern to be connected to a help workflow. Discussion threads offer a more general company conversation path and include category, status, author, replies, accepted-answer state, reports, and moderation operations.

The distinction between an employee doubt and a forum thread is useful: a doubt may represent an employee’s need for manager help, while a forum thread supports shared discussion and reusable answers. The current forum associates a thread with its author and displays that identity. It does not implement anonymous posting. AI summaries do not change this fact and should not be presented as a privacy substitute.

## 4.19 Assessment Authoring, Submission, and Evaluation

Assessment authoring validates title, instructions, question types, options, max marks, and rubric fields before writing. A worksheet and its question rows are created transactionally to avoid leaving a worksheet with only some questions. Multiple-choice options and correct-option metadata are stored for the objective question path; written questions can include a rubric. The total possible marks are calculated from question maxima.

Assignment validates that the worksheet belongs to the active company and that selected employees are eligible. Employees can save drafts and submit attempts. The system preserves attempts and answer records so that the latest response can be interpreted without overwriting the full history. Objective questions can be auto-graded. Written answers are evaluated by a manager, who can save a draft or release feedback. A resubmission workflow is available when the worksheet permits it.

The optional AI grading action constructs a prompt from the question, response, rubric, and maximum mark, requests structured output, validates the response, and bounds marks to the permissible range. The suggestion is not itself an evaluation state. The manager can correct the proposed marks or text before saving. The grade-release state controls what an employee can see. This separation is important because AI output and manager decision are distinct data events.

## 4.20 Company Knowledge Ingestion and Retrieval Implementation

Knowledge entry begins with a company administrator or manager submitting a title and text. The server limits the title to 160 characters, requires at least three characters in the title and 30 characters of content, and rejects content above 50,000 characters. The text is divided into chunks with a target maximum length of 1,200 characters. Paragraph boundaries are preferred; long paragraphs are split at a nearby space when possible. Chunks are embedded in groups of up to four parallel API requests and then written to the database in a transaction.

The stored record contains company identifier, creator membership, title, text chunk, embedding JSON, and timestamps. The title is included in the text sent to the embedding endpoint, which associates the passage with a short document label. A failure during embedding prevents the content from being reported as successfully indexed. Deletion removes rows matching both the active company and title. Because chunks share the title and there is no source-file model, document-level version history is not currently represented.

On a user question, the action checks that the user has active company context and validates a question length from 3 to 1,000 characters. It loads knowledge rows only for that company, embeds the question, computes cosine similarity for each candidate, sorts candidates descending, and selects at most four passages. The generation prompt includes the company name, a constraint to answer only from supplied material, a direction to abstain when the answer is missing, and a reminder not to disclose practice assessment answers. The result returns generated text and the unique titles of the selected passages.

The implementation is a small-corpus semantic retrieval path rather than a scalable vector database design. All company embeddings are loaded for ranking in application memory. Query cost therefore grows with the number of stored chunks. A future data layer could use pgvector or a managed vector index, add retrieval thresholds and hybrid lexical search, preserve source page and section metadata, and support safe re-indexing when documents change. Those improvements need a measured corpus and evaluation set rather than assumptions about scale.

## 4.21 AI Insight Actions and Output Controls

The AI integration is isolated in a shared Gemini helper. The helper reads its API key from server environment configuration, posts JSON to the model endpoint, uses a configurable embedding model with a default of gemini-embedding-001, and uses a configurable text model with a default of gemini-2.5-flash. Generation requests use low temperature and a maximum output-token limit. Empty embeddings and empty text responses produce errors. JSON generation requests ask for JSON only, then attempt a direct parse and a limited object extraction fallback.

The grading action and doubt-insight action use the shared helper but have different inputs and outputs. Grading is associated with an individual assessment and validated against mark bounds. Doubt analysis selects up to 100 recent open or answered threads for the company. If the caller is a manager, the selection is further limited to direct reports. The model is asked to produce up to six themes with a topic, estimated count, short summary, and practical suggestion. The server truncates strings and bounds counts before returning the result.

These controls bound output size and scope; they do not verify factual correctness. A generated theme may be too broad, and a count is an estimate rather than a validated count of distinct employees. The underlying threads should be reviewed before follow-up. The system does not automatically change a task, assessment grade, employee status, or policy based on generated content.

## 4.22 Analytics and Progress Calculation

Progress analytics use recorded task assignments, delivery state, and released assessments. When task and assessment data are both present, the composite formula weights assessment performance at 45 percent, task completion at 35 percent, and on-time delivery at 20 percent. For task-only records, task completion receives 65 percent and on-time delivery 35 percent. Insufficient data remains unranked instead of being interpreted as a failing score.

| Data condition | Composite calculation | Interpretation |
|---|---|---|
| Assessment and task data both available | 0.45 × assessment score + 0.35 × task completion + 0.20 × on-time delivery | Mixed measure of demonstrated assessment performance and work progress. |
| Task records only | 0.65 × task completion + 0.35 × on-time delivery | Operational completion indicator without assessment evidence. |
| Too little usable information | No ranking | The system avoids converting missing evidence into a zero. |

The weights make the score reproducible but do not make it a validated performance instrument. Task complexity can differ, assignments can be added or removed, and a manager’s grading may vary. A score should be interpreted alongside its component measures and underlying work. Before using analytics for formal decisions, an organization would need to validate the metric, define how incomplete records are handled, and review fairness across roles and cohorts.

## 4.23 Notifications, Audit, and Error Handling

The project integrates invitation and workflow notifications through configured email providers. Email is an external dependency and may not be available in every local setup. Audit helpers record selected high-impact operations with actor, company, action, entity type, entity identifier, and structured metadata. Audit records support traceability but do not by themselves provide a complete security monitoring system.

Validation failures return user-facing errors before database mutation. Provider failures are caught in AI actions and returned as an error result. Database writes that create related records use transactions where implemented. Route revalidation updates pages after successful mutation. Production hardening should standardize error codes, avoid returning provider response detail to end users, apply retry and rate-limit policies, and ensure logs never contain secret keys or unnecessary sensitive text.

## 4.24 Development and Execution Structure

The repository uses the Next.js application as the main runtime. Prisma provides the generated client and schema management for PostgreSQL. Environment files supply database, identity, email, AI model, and test-portal settings. Seed scripts create general development data and the targeted demo knowledge corpus. The local execution path therefore requires the application dependencies, a reachable configured database, a synchronized schema, and the environment values needed for the feature being demonstrated.

The knowledge seeder is separate from the general application seed and is designed for the three demonstration documents. After database schema synchronization, it creates or refreshes searchable chunks for the Ascent Demo Workspace. Keeping demo knowledge seeding separate avoids making the normal user seed responsible for external AI calls. A repeatable seed path is useful for evaluation because it allows the assistant corpus to be restored without manually re-entering each item.

## 4.25 Chapter Summary

This chapter traces the implementation from request handling and relational modeling through authorization, tasks, schedules, assessments, company knowledge, AI insights, and analytics. It identifies exact delivered mechanisms and their present boundaries. The main design strengths are server-side authorization, explicit workflow records, manager review, and company-scoped knowledge retrieval. The main technical constraints are pasted-text ingestion, application-side vector search, named discussions, and the absence of an isolated simulation engine.

## 5.8 Test Design and Coverage Interpretation

The reported automated run executed 69 tests across 25 suites, with 69 passing and none failing. The suite focuses on deterministic application logic. Covered areas include knowledge chunking and cosine similarity, analytics calculations, assessment validation and grade-release safeguards, forum lifecycle and tenant boundaries, schedule-conflict logic, and configuration of the test personas. These tests provide evidence that the covered functions behave as expected for their input cases.

| Test category | What is checked | What the result does not prove |
|---|---|---|
| Knowledge utilities | Chunk boundaries and vector similarity behavior | Answer correctness from the live Gemini model or source attribution quality |
| Authorization and tenant rules | Role and company boundary conditions in tested helpers/actions | Absence of every access-control defect in all routes |
| Assessment workflow | Validation, scoring, attempt selection, and unreleased grade protection | Usability of every assessment page or fairness of all model suggestions |
| Scheduling | Detection of overlapping time intervals | Synchronization with a user’s external calendar |
| Forum and analytics | Status changes, scope rules, score and summary utility behavior | Anonymous posting or statistical validity of manager insights |
| Demo configuration | Private test identity setup and access rules | Suitability of test accounts for production use |

Unit and logic tests run quickly and isolate business rules, but they do not exercise the full browser. Browser acceptance testing should cover sign-in, company selection, visible navigation, form validation, success and error states, and the handoff from manager to employee. Integration testing should exercise the configured database and provider calls. AI quality evaluation should use labeled questions and expected evidence rather than merely checking that the API returns text.

## 5.9 Demonstration Dataset and Knowledge Ingestion Result

The Ascent Demo Workspace contains three synthetic company documents: a First Week Guide, Information Security and Device Rules, and an IT Support/Remote Work/Time Off FAQ. The targeted seed operation produced three searchable chunks, one per document, after the knowledge table schema was synchronized. This demonstrates that the database write path and Gemini embedding request were reachable in the configured environment during the ingestion operation.

The dataset was deliberately small and covers concrete onboarding facts. Suggested positive questions include the tasks expected by the end of the fifth working day, the onboarding buddy, how to handle an unexpected multi-factor prompt, the reporting window for a suspected phishing message, and the normal IT-request response expectation. A separate negative question asks for annual-leave entitlement, which is intentionally absent from the seeded text. This positive/negative pair is useful for a manual grounding check because a complete assistant should return source-supported answers for the positive cases and acknowledge missing evidence for the negative case.

The indexing result is not an answer-quality benchmark. The number of indexed chunks does not measure retrieval precision, recall, groundedness, factuality, latency, or model consistency. A proper evaluation should record the query, expected source passage, retrieved passages, generated answer, source title, abstention result, and reviewer judgment for each case. It should be repeated after any change to chunking, embedding model, prompt, retrieval method, or generation model.

## 5.10 Functional Results by User Journey

| Journey | Implemented result | Evidence and boundary |
|---|---|---|
| Administrator prepares the company | Membership, departments, cohorts, knowledge text, and administrative views are represented. | Routes and schema are present; file upload and automated roadmap generation remain absent. |
| Manager assigns work | Tasks and worksheets can be created, assigned, and reviewed; meetings can be scheduled. | Automated logic supports core paths; browser acceptance across all roles remains advisable. |
| Employee completes onboarding activity | Personal task, meeting, assessment, and discussion views are available. | Workflow state is represented; no production HR provisioning is integrated. |
| Manager reviews performance | Analytics use task and assessment activity and leave sparse data unranked. | Formula tests exist; no user study validates this as a performance measure. |
| Employee asks company policy question | Pasted text can be embedded, retrieved within company scope, and used as generation context. | Three demo documents were indexed; end-to-end answer quality was not benchmarked. |
| Manager uses AI assistance | Written-answer suggestions and thread themes can be generated for review. | AI outputs remain advisory; model output is not a final grade or automatic action. |

The results support a conclusion that the prototype has functioning application logic for the major workflow categories. They do not support a conclusion that every user journey is free of interface defects or that AI assistance is consistently correct. The difference matters: functional integration is a necessary milestone, while usability and model quality require separate testing.

## 5.11 Requirement Coverage and Gap Analysis

| Requirement from statement | Current delivery | Remaining work to claim full coverage |
|---|---|---|
| Role-based company onboarding | Company memberships, roles, administration, and employee views | Validate all page/action combinations and add configurable roles if required |
| Role-specific roadmaps | General tasks, assessments, training records, and cohorts | Build editable roadmap templates keyed by role and duration |
| Historical work simulation | Assignable practical tasks and assessments | Add sanitized scenario artifacts, branching decisions, sandbox, and simulation scoring |
| Meeting, course, and task schedule | Meeting and task workflows; training activity support | Add a dedicated course catalog or formal learning-content workflow if required |
| Anonymous doubts | Named forum and employee doubt records | Design identity masking, moderation, reporting, consent, and privacy safeguards |
| AI categorization of questions | AI-generated themes for eligible threads | Evaluate theme accuracy, duplicate handling, bias, and manager usefulness |
| Assistant using company resources | RAG over pasted text with company filtering and source titles | Add file ingestion, source locations, thresholds, evaluation corpus, and scalable vector index |
| Progress and performance insights | Task and released assessment indicators with explicit weighting | Validate measurement meaning and fairness using real onboarding outcomes |
| Prototype deployment | Local and configured development environment | Document production hosting, monitoring, backup, restore, rate limits, and incident response |

The table shows that feature completion is not binary. For example, practical tasks exist, but the scenario-based simulation requested by the statement does not. AI question themes exist, but an empirical evaluation of theme quality does not. This implementation gap analysis is the principal result of comparing the stated scope with repository evidence.

## 5.12 Threats to Validity

The evaluation uses a single repository snapshot and a small synthetic knowledge corpus. Automated tests cover selected logic, not every UI route or external service response. Gemini output can vary, so an answer observed once cannot establish repeatable quality. Demo data is fictional and does not represent a representative employee population. Performance analytics have not been validated against manager ratings or onboarding outcomes. These factors limit generalization and prevent claims about real-world effectiveness.

The requirements comparison also involves interpretation. A general task may partially support a role-specific activity but does not satisfy an interactive simulator requirement. A named discussion can support questions but does not satisfy anonymity. To reduce ambiguity, this report names the implemented mechanism and the missing property separately rather than assigning full completion based on a similar label.

## 5.13 Chapter Summary

The project passes the latest recorded automated suite and successfully indexed a small set of demo knowledge documents. The tested logic supports several key workflows, including validation, scoring, schedule conflicts, and tenant-aware operations. The evidence does not include browser end-to-end coverage, production monitoring, or a labeled evaluation of Gemini responses. Requirement coverage is therefore substantial but partial, with file ingestion, anonymity, automatic roadmaps, and simulation remaining significant gaps.

## 6.6 Recommended Development Roadmap

The next phase should begin with requirements closure rather than additional AI features. First, implement a role-and-duration roadmap model that managers can edit before publishing. Second, build a controlled historical-work simulation with sanitized artifacts and a scoring rubric. Third, design anonymous question handling with clear disclosure, moderation controls, and privacy review. These changes address central requirements in the original statement.

The next phase of AI work should improve the ingestion and evaluation pipeline. Add file upload with type and size validation, safe text extraction, source metadata, version replacement, and deletion. Add a retrieval threshold and a vector index after measuring the expected corpus size. Build a gold question set with answerable, ambiguous, conflicting, and unanswerable examples. Evaluate retrieved evidence and generated response separately, and include prompt-injection and tenant-isolation cases.

Before production use, run browser end-to-end tests for each role; perform a security review of every server action; define retention, consent, and data-processing rules; exercise backups and restoration; and measure latency, provider cost, and rate limits. A pilot should collect user feedback and task completion evidence, with a comparison against the organization’s current onboarding process. These steps would turn a demonstrator into an evidence-based product evaluation.

## 6.7 Contribution to Sustainable Development Goals

The project has a direct connection to organizational learning and workplace development rather than to a measured sustainability outcome. Its platform can help make onboarding information and learning activities more accessible, which is relevant to quality education and skills development as a broad objective. However, the application does not measure energy use, emissions, or environmental impact and should not claim direct contribution to climate targets.

Its potential societal value lies in supporting clearer role expectations and access to information for new employees. Whether this improves well-being, inclusion, or retention must be established through real deployment and ethical evaluation. A future pilot should include accessibility, language, and privacy considerations so the platform does not create barriers for employees who need different formats or communication methods.
