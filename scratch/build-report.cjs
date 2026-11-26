const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const tocPageMapPath = path.join(__dirname, "toc-page-map.json");
const tocPageMap = fs.existsSync(tocPageMapPath) ? JSON.parse(fs.readFileSync(tocPageMapPath, "utf8")) : {};
const reportDir = path.join(root, "output", "report");
fs.mkdirSync(reportDir, { recursive: true });

const markdown = String.raw`# List of Tables

| Table | Title |
|---|---|
| 3.1 | Major system actors and responsibilities |
| 3.2 | Functional requirements and implementation status |
| 3.3 | Non-functional requirements |
| 4.1 | Technologies used in Ascent |
| 4.2 | Core data entities and purpose |
| 4.3 | AI-assisted features and human controls |
| 5.1 | Automated test results |
| 5.2 | Requirement coverage against the project statement |

# List of Figures

| Figure | Title |
|---|---|
| 3.1 | Logical architecture of Ascent |
| 3.2 | Company knowledge ingestion and assistant retrieval flow |
| 3.3 | Manager and employee demonstration workflow |
| 4.1 | Simplified relational data model |
| 5.1 | Verification summary for the current build |

# Symbols, Abbreviations and Nomenclature

| Term | Description |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| RBAC | Role-Based Access Control |
| RAG | Retrieval-Augmented Generation |
| ORM | Object-Relational Mapper |
| UI | User Interface |
| UX | User Experience |
| MFA | Multi-Factor Authentication |
| MCQ | Multiple-Choice Question |
| JSON | JavaScript Object Notation |
| SQL | Structured Query Language |
| PII | Personally Identifiable Information |
| MAE | Mean Absolute Error |
| RMSE | Root Mean Squared Error |
| Clerk | Managed authentication and identity service used by the application |
| Tenant | An organization and the data scope associated with it |
| Embedding | Numeric representation of text used for semantic similarity search |

# Chapter 1: Introduction

## 1.1 Background

Employee onboarding brings together account setup, company policies, role expectations, training, meetings, assignments, and feedback. In many organizations these activities are spread across email, shared folders, calendars, and informal conversations. New employees can have difficulty knowing what to do first, where to find authoritative guidance, and whom to ask when a question feels basic. Managers may also have limited visibility into work completion and recurring points of confusion.

Ascent is a web-based employee onboarding and performance platform. It gives each company a separate workspace and organizes people, departments, cohorts, tasks, meetings, assessments, discussions, and progress information within that workspace. The current implementation also includes AI-assisted features: a company-material question-answering assistant, provisional grading suggestions for written answers, and summaries of recurring forum questions.

The report uses the supplied project statement as the requirements baseline and the repository implementation as the delivery baseline. The project statement calls for role-based onboarding, practical work, anonymous questions, manager insights, and a company-specific assistant. The implementation meets many of these goals, with the differences recorded in Chapter 5.

## 1.2 Problem Statement

When onboarding depends on disconnected documents and manual follow-up, new employees may receive inconsistent guidance and managers may not see incomplete work or repeated questions in time. A single role-aware system can organize company content, assign tasks and learning activities, schedule meetings, capture questions, and provide a consistent way to review progress. The system must keep each organization’s records isolated and give each user only the actions allowed by their role.

## 1.3 Motivation

The project combines full-stack development with a practical organizational problem. It applies tenant-aware data modeling, role-based authorization, task and meeting workflows, assessments, analytics, and AI retrieval to a unified onboarding experience. The AI features are designed to support people: the assistant answers from company material, while managers retain control over grading and follow-up decisions.

## 1.4 Objectives of the Project

1. Provide separate company workspaces with membership and role-based access.
2. Let company administrators and managers organize departments, cohorts, employees, and onboarding content.
3. Let managers create and assign tasks, assessments, and meetings, then monitor submissions and progress.
4. Give employees a role-aware dashboard for assigned work, training, meetings, assessments, and discussions.
5. Support discussion, accepted answers, moderation, and escalation of questions into help sessions.
6. Provide company-scoped AI answers grounded in indexed onboarding material.
7. Provide manager-facing AI assistance for written-answer grading and recurring-question analysis.
8. Present operational progress and performance metrics in company and manager views.

## 1.5 Scope of the Project

The application is a software prototype for employee onboarding and performance management. It supports Platform Admin, Company Admin, Manager, and Employee roles. It includes tenant-scoped data access, invitation and membership workflows, task assignment and review, meetings and attendance, worksheets and evaluations, discussion threads, audit records, analytics, and three AI-assisted workflows.

The current knowledge-base interface accepts pasted text. It does not provide a file upload or PDF extraction pipeline. Work can be assigned through tasks, training activities, assessments, and historical completion records, but the application does not include a separate interactive scenario simulator. Forum threads identify their authors; anonymous posting from the project statement is not yet implemented. The application is not connected to production HR information systems or real company identity directories.

## 1.6 Significance of the Project

Ascent demonstrates how onboarding activities can be managed in a single tenant-aware application. It provides a traceable workflow from assignment to submission and review, gives managers operational indicators, and lets employees ask questions in context. The assistant can reduce the time needed to locate policy information when the answer exists in the company’s indexed material. These are prototype capabilities; their effectiveness in a live organization depends on accurate source content, access configuration, and continued human review.


### 1.7 Stakeholders and Operational Context

The platform serves four levels of responsibility. The Platform Admin is responsible for the platform as a whole, while the Company Admin manages a single organization's workspace and membership. A Manager works with assigned employees, reviews work, schedules support, and interprets progress. An Employee completes assigned onboarding activities, asks questions, and receives feedback. These responsibilities inform the separation of global role and company role in the data model.

The distinction between a company administrator and a manager is useful operationally. Company administration includes maintaining the organization, adding members, configuring departments or cohorts, and managing shared company guidance. A manager focuses on a team: assigning activities, reviewing submissions, organizing meetings, and identifying support needs. An employee interacts with the resources and assigned work that are relevant to their own onboarding. The application still relies on accurate membership and reporting relationships; incorrect setup can result in incomplete views or access denials.

### 1.8 Project Outputs and Evaluation Boundary

The implemented outputs are a browser-based application, a relational database schema, server-side workflow actions, AI service integrations, automated logic tests, and seeded demonstration data. The main deliverable is not a trained foundation model. Gemini is called as an external service for text embeddings and generated outputs. The application's contribution is the orchestration around those calls: choosing the company data, selecting relevant context, validating responses, and presenting the result through an onboarding interface.

The evidence in this report is divided into implementation evidence and outcome evidence. Implementation evidence includes source modules, database structures, authorization checks, tests, and the successful indexing of three synthetic demo documents. Outcome evidence would require user studies, verified production content, measured completion time, answer-quality evaluation, and comparison with an existing onboarding process. The latter has not been collected, so no claims about improved retention or employee productivity are made.

# Chapter 2: Literature Survey

## 2.1 Introduction to Employee Onboarding Systems

Digital onboarding systems typically combine employee records, policy access, training, checklists, scheduling, and progress tracking. A document repository alone can distribute information, but it does not show whether the employee completed required activities. A learning-management system can track courses, but it may not manage company-specific assignments, meetings, employee questions, and manager reviews in one workflow. Ascent combines these functions in a multi-role application.

## 2.2 Role-Based Access and Multi-Tenant Applications

In a multi-tenant service, each organization is a data boundary. A user may belong to one or more companies, and their permissions depend on the active company membership. Ascent stores a company identifier on the major operational records and resolves an active membership before serving company pages or performing mutations. Role checks are made in server-side authorization helpers and actions; hiding a navigation item alone is not treated as authorization.

The application distinguishes a global Platform Admin role from company-level Company Admin, Manager, and Employee roles. Managers receive scoped actions for team work and review, while employees receive personal tasks and assessment workflows. These are application roles; they are not a configurable simulation of every job family listed in the project statement.

## 2.3 Practical Work, Assessment, and Feedback

Task and assessment systems make onboarding more active by asking a new employee to complete work and receive feedback. Ascent supports operational and training tasks, historical training records, mixed worksheets, submissions, objective auto-grading, manager rubrics, resubmission, and grade release. This provides practical work and assessment workflows. A future scenario engine could add branching cases, simulated artifacts, scoring rules, and safe sandboxes for role-specific situations.

## 2.4 Retrieval-Augmented Generation for Company Guidance

Retrieval-Augmented Generation combines a retrieval step with language generation. A query is used to find relevant external passages, and those passages are supplied to a language model as context. Lewis et al. describe this approach for knowledge-intensive NLP tasks. Ascent uses a lightweight company-scoped form of this pattern: text is divided into chunks, each chunk is embedded, relevant stored chunks are ranked by cosine similarity, and the most relevant passages are supplied to Gemini with instructions to answer from that material.

This approach can make answers specific to a company’s policies without fine-tuning a model on every policy change. Its limits are also clear: retrieval quality depends on document quality and chunking, and the generated response can still be incomplete. Ascent therefore shows source titles and instructs the assistant to refer employees to a manager when the material does not contain an answer.

## 2.5 Related AI Assistance for Managers

Generative models can help summarize repeated questions and draft feedback, but consequential decisions should remain with the responsible manager. Ascent’s assessment suggestion feature returns provisional marks and feedback for written responses. The manager can review and edit the suggestions before saving an evaluation. Forum insight analysis groups open or answered threads into themes and proposes follow-up actions. These results are advisory and should be checked against the source records.

## 2.6 Research Gap and Project Position

The project statement identifies a gap between static onboarding information and practical, role-specific learning with visible manager support. Ascent addresses the coordination, task assignment, assessment, meeting, discussion, and progress portions of that gap. It also provides company-grounded AI answers and manager summaries. The gap is only partially closed: file-based policy ingestion, anonymous questions, automated role-specific roadmap generation, and a dedicated work-simulation engine remain future work.


### 2.7 Comparison of Related System Approaches

| Approach | Strength | Limitation addressed by Ascent |
|---|---|---|
| Shared document folder | Low-friction distribution of policies and training documents. | Does not represent task progress or manager review; the assistant adds question-led retrieval from indexed text. |
| Checklist or task board | Makes assigned work and completion status visible. | Does not normally provide company policy retrieval, assessments, or an onboarding-specific manager insight flow. |
| Learning management system | Organizes courses, learning content, and assessment records. | May not connect day-to-day onboarding tasks, company discussions, help meetings, and manager follow-up. |
| HR information system | Maintains employment records and formal HR processes. | The current project is not an HRIS and does not attempt payroll, benefits, compliance filing, or production identity provisioning. |
| General-purpose chatbot | Provides conversational access to a language model. | Without company scoping and source material, answers may be generic or unsupported; Ascent retrieves company passages and displays source titles. |
| Ascent prototype | Combines memberships, tasks, schedules, assessments, discussions, analytics, and company-scoped AI assistance. | Requires further work for file ingestion, anonymous questions, role roadmaps, scenario simulation, and production validation. |

This comparison is functional rather than a claim that the listed categories are interchangeable products. The project uses the comparison to identify the boundary of its own implementation. Ascent integrates selected onboarding workflows, but it does not replace a complete HR system, a learning content catalog, or an organization's authoritative document-management process.

### 2.8 Design Principles Derived from the Survey

The literature and the project statement suggest several design principles. First, onboarding should be represented as an ongoing process with tasks, resources, contact, and feedback rather than as a single document handoff. Second, employees and managers need different views because their responsibilities are different. Third, company identity must constrain data retrieval and mutation. Fourth, AI-generated guidance should be grounded in maintained company material and present source context. Fifth, decisions that affect assessment or employee standing should retain human review. Finally, evaluation must distinguish software correctness from organizational effectiveness.

These principles guide the implementation review. The report examines not only whether a page exists, but also whether a data model records the relevant state, whether an action enforces the proper role, whether a manager can review an AI suggestion, and whether evidence exists for the stated behavior.

# Chapter 3: Research Methodology and System Analysis

## 3.1 Proposed Methodology

The project follows an iterative application-development process:

1. **Requirement analysis:** identify the needs of company administrators, managers, and employees from the project statement.
2. **Domain modeling:** represent users, memberships, companies, departments, tasks, meetings, assessments, discussions, and analytics as related database entities.
3. **Authorization design:** resolve active membership and company context on the server, then apply global and company role checks.
4. **Workflow implementation:** build server-rendered pages and server actions for company administration, onboarding work, meetings, assessments, discussions, and reporting.
5. **AI integration:** connect server-side actions to Gemini for text generation and embeddings; keep retrieved knowledge scoped to the current company.
6. **Verification:** run automated unit and logic tests for validation, scoring, access boundaries, schedule conflicts, assessment safeguards, and AI text utilities.

## 3.2 System Actors

| Actor | Main responsibilities |
|---|---|
| Platform Admin | Inspect platform-level organizations and audit activity. |
| Company Admin | Manage the company workspace, membership, departments, onboarding content, tasks, assessments, and company oversight. |
| Manager | Work with assigned reports, create tasks and meetings, review submissions, and analyze recurring questions. |
| Employee | View assigned onboarding work, submit tasks and assessments, attend meetings, and participate in discussions. |

## 3.3 System Requirements

### 3.3.1 Functional Requirements

| ID | Requirement | Implemented behavior |
|---|---|---|
| FR-01 | Separate company workspaces | Company identifiers and active memberships scope company data. |
| FR-02 | Enforce role permissions | Server-side helpers and server actions enforce roles. |
| FR-03 | Manage employees and organization structure | Company pages support members, departments, and training batches. |
| FR-04 | Assign and review onboarding work | Managers assign tasks; employees submit; managers review or request changes. |
| FR-05 | Schedule meetings | Managers create and update meetings; overlap checks detect scheduling conflicts. |
| FR-06 | Deliver assessments | Worksheets support multiple question types, submission history, grading, and controlled grade release. |
| FR-07 | Support employee discussion | Named discussion threads, replies, accepted solutions, reports, moderation, and help-session conversion. |
| FR-08 | Answer company policy questions | Pasted text is indexed per company and retrieved for the onboarding assistant. |
| FR-09 | Provide AI manager assistance | Written-answer grade suggestions and recurring-question summaries are available to authorized managers. |
| FR-10 | Show progress and performance | Analytics report tasks, review state, assessment performance, trends, and rankings. |
| FR-11 | Provide anonymous forum posting | Not implemented in the current version; thread authors are associated with memberships. |
| FR-12 | Parse uploaded policy documents | Not implemented; the current knowledge page accepts pasted text. |

### 3.3.2 Non-Functional Requirements

| Category | Requirement and design response |
|---|---|
| Security | Keep provider keys server-side, protect authenticated routes, validate inputs, and enforce permissions in server actions. |
| Tenant isolation | Add company scope to company data reads and writes; tests include cross-company boundary checks. |
| Integrity | Use relational constraints, transactions for multi-row updates, and audit events for sensitive operations. |
| Usability | Provide role-specific dashboards, task lists, calendars, reviews, and visible status feedback. |
| Maintainability | Use TypeScript, modular app routes, shared validations, Prisma models, and reusable UI components. |
| Availability | Depend on the configured application host, Neon database, Clerk, and Gemini API; no production service-level target is established. |
| AI transparency | Show source document titles for assistant answers and mark manager suggestions as advisory. |

## 3.4 Feasibility Analysis

**Technical feasibility:** The project uses a conventional web stack and managed PostgreSQL database. Gemini calls are made from server-side code. The main technical constraints are external service availability, careful tenant filtering, and the current absence of a file parser or vector database extension.

**Operational feasibility:** Administrators and managers can use familiar browser workflows to invite users, organize teams, assign work, schedule meetings, and enter policy text. Employees use a dashboard rather than switching between multiple onboarding tools. A company must still supply and maintain accurate onboarding material.

**Economic feasibility:** The prototype uses managed services and an API-based model. Operating cost depends on provider plans, database usage, model traffic, email volume, and hosting. A costed production deployment has not been established in the repository.

## 3.5 System Architecture

Ascent is a Next.js application. The browser submits page requests and server actions to the Next.js server. Clerk supplies the normal user identity. The server resolves a local user, active membership, company, and role, then reads or writes company records through Prisma and Neon PostgreSQL. AI actions call Gemini from the server. The client never receives the Gemini secret key or performs database queries directly.

![Logical architecture](#figure-architecture)

## 3.6 System Workflow

The administrator creates or prepares a company workspace, defines departments and cohorts, and invites or provisions members. Managers configure assignments, assessments, meetings, and content. Employees complete assigned work, submit assessments, attend meetings, and ask questions. Managers review work, resolve discussions, and use analytics to identify delays or recurring confusion. Every company-facing operation is resolved against the active membership and company context.

### 3.6.1 Company Knowledge and Assistant Workflow

An administrator or manager enters a document title and pastes policy or onboarding text into the Knowledge Base. The server validates the length, splits the text into chunks of approximately 1,200 characters, obtains a Gemini embedding for each chunk, and stores the text and embedding with the company and creator membership. When an employee asks a question, the server embeds the query, computes cosine similarity against that company’s stored chunks, selects up to four passages, and asks Gemini to answer using only those passages. The UI displays the answer and source titles.

![Knowledge ingestion and retrieval flow](#figure-rag)

### 3.6.2 User Demonstration Flow

The demo uses a dedicated company with a Company Admin and Employee. The admin opens the direct test portal, unlocks the private simulation identities, selects the company administrator, and reviews the company Knowledge Base. The employee then enters the same test portal, selects the employee identity, and asks the Onboarding Assistant about the indexed policies. A negative question about a policy absent from the documents checks whether the assistant admits that it cannot find the answer.

![Manager and employee demonstration flow](#figure-demo)

## 3.7 System Constraints

The project requires a configured database and Clerk environment for normal authentication. AI functions require a valid Gemini API key and external API access. Test identities are local seeded users and are intended for demonstration only. Knowledge documents are plaintext entries rather than uploaded files. The standard automated suite tests application logic but does not replace browser acceptance testing, security review, or production monitoring.


### 3.8 Requirements Elicitation and Analysis

The supplied statement is the primary requirements source. It identifies company administration, role-specific onboarding plans, historical work simulations, scheduling, trainee dashboards, anonymous doubts, AI categorization, a company-specific assistant, and progress insights. Requirements were grouped by actor and workflow, then compared with application routes, server actions, schema models, and automated tests. This method creates a trace from the stated need to the delivered code and avoids treating planned work as completed functionality.

The employee journey was analyzed from access to completion. An employee must first authenticate and resolve a company membership; then see assigned work, attend sessions, complete assessments, ask for information, submit questions, and receive feedback. The manager journey begins with a company-scoped view of members and includes assignment, scheduling, review, and progress interpretation. The company administrator journey includes maintaining the workspace, members, teams, and shared policy text. The Platform Admin journey is distinct because it is not attached to a single employee team.

The analysis also identifies cross-cutting constraints. Every company operation needs tenant context. Any mutation needs input validation. Sensitive administrative changes should be auditable. AI access requires secret configuration and external network availability. A report or dashboard value needs a defined calculation and should not be interpreted without considering data completeness. These constraints appear in the non-functional requirements and verification plan.

### 3.9 Detailed Functional Requirements

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

### 3.10 Detailed Role Workflows

### 3.10.1 Company administrator workflow

The administrator signs in, enters an active company workspace, checks membership and organization structure, and assigns the appropriate managers to employee profiles. The administrator can maintain the company knowledge text and oversee the workspace. For a demonstration, the seeded Ascent Demo Workspace has a dedicated manager-facing identity and employee-facing identity available through the private test route. The route is not linked from the public landing page. The workflow is intended for evaluation; the private test identities should not be treated as real production accounts.

Before adding a knowledge item, the administrator prepares authoritative plain text, assigns a descriptive title, and checks that it contains no secrets or unrelated personal information. After the item is indexed, the administrator checks the visible document list and asks representative questions. This verification confirms the ingestion and retrieval path is usable; it does not prove comprehensive answer quality. The current page does not accept source file uploads.

### 3.10.2 Manager workflow

The manager enters the company dashboard, reviews the team, creates tasks or worksheets, selects employees or cohorts, and sets timing and instructions. The manager creates meetings and considers any conflict warning. As employees submit work, the manager opens the review queue, checks evidence, provides feedback, and records a decision. The manager can use AI grading suggestions as a draft aid and forum summaries as a signal for follow-up, but must inspect the original answer or thread before taking action.

Manager progress review is an interpretation activity. The analytics page combines completion, delivery timing, and released assessment outcomes according to documented weights. Managers should open the source records and consider assignment difficulty, due-date changes, and missing data before acting on a score. The application does not establish that a composite metric is a validated measure of employee potential.

### 3.10.3 Employee workflow

The employee signs in, enters the company workspace, and reviews their dashboard and tasks. For each assignment, the employee reads the instructions, updates progress, and submits evidence. An assessment may be saved as a draft before submission. A manager reviews the answer and releases evaluation when ready. The employee can attend scheduled sessions, participate in named discussions, and ask the company assistant questions against indexed material.

When a source does not answer a question, the desired assistant behavior is to state that the material does not specify an answer and refer the employee to a manager. The employee can inspect returned source titles. Because forum posts are named, employees should use the discussion area only for questions appropriate to a named company forum; the current implementation does not satisfy the statement's anonymity requirement.

### 3.11 Data Flow and Process Analysis

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

### 3.12 Feasibility and Risk Analysis

Technical feasibility is supported by the existing implementation and the use of widely adopted web and database components. The principal technical risks are cross-company access errors, external AI provider failure, provider response variability, large knowledge corpora that make application-side vector comparison expensive, and incomplete coverage of proposed simulation features. These risks can be tested and mitigated, but the current prototype does not establish production-grade capacity or availability.

Operational feasibility depends on a company assigning an owner to onboarding content, maintaining role memberships, and responding to manager review queues. The system cannot keep a policy accurate if the company does not update it. It cannot provide meaningful analytics if tasks are not consistently assigned or assessed. The deployment must also account for email delivery, identity configuration, database credentials, and the availability of the AI provider.

Economic feasibility is suitable for an academic prototype because the development stack is based on open-source libraries and managed service tiers. Production cost cannot be inferred from the code alone. It will depend on active users, document volume, embedding operations, question volume, model token usage, database storage, email delivery, hosting, and support. A cost and latency study should precede a production rollout.

### 3.13 Security and Privacy Requirements

Security is considered at the identity, authorization, tenant, input, integration, and operational layers. Clerk authenticates normal users; the local membership record supplies application permissions. Protected server actions verify both role and company context. Runtime validation constrains many user inputs before writes. Gemini calls are made from server code using a secret key supplied through environment configuration. Audit events record selected administrative operations.

Privacy limitations remain. Discussion threads are named; the application does not currently provide anonymous posting. Forum text submitted for AI analysis is sent to the configured Gemini service. Knowledge content is stored as text and embeddings in the company database. A production deployment needs an approved data-processing policy, retention rules, content access review, and a review of the external provider's terms and configuration. The prototype does not claim a formal security certification or independent penetration test.

### 3.14 Chapter Summary

The analysis converts the project statement into actor-specific, testable requirements and documents which are complete, partial, or outstanding. It describes the full paths through administration, manager work, employee activity, knowledge indexing, and AI assistance. The architecture is technically feasible for a prototype, while production readiness depends on policy ownership, stronger evaluation, security review, and completion of the requirements that are currently partial.

# Chapter 4: System Design and Implementation

## 4.1 Introduction

The implementation uses the Next.js App Router for the user interface and server-side application logic. React components render dashboards and interactive forms. Server actions validate submitted data, enforce role permissions, perform business operations, write audit records, send notifications where configured, and refresh relevant pages.

## 4.2 Technology Stack

| Layer | Technology | Use in Ascent |
|---|---|---|
| Web framework | Next.js 15 App Router | Pages, layouts, middleware, and server actions. |
| UI | React 19 and TypeScript 5.8 | Interactive and server-rendered components with typed application logic. |
| Styling | Tailwind CSS 3.4 | Responsive layout and shared visual system. |
| Authentication | Clerk | Normal sign-in, sign-up, and authenticated user identity. |
| Test access | Local server-side test session cookies | Password-gated demo personas for controlled evaluation. |
| Database | Neon PostgreSQL | Persistent relational company and onboarding data. |
| ORM | Prisma 6 | Typed relational queries and schema management. |
| Validation | Zod | Runtime validation for forms and action payloads. |
| AI | Gemini API | Text generation, embeddings, grading suggestions, and forum summaries. |
| Email | Resend and Nodemailer | Invitation and workflow notifications when configured. |
| Tests | Node.js test runner with tsx | Automated logic and validation checks. |

## 4.3 Application Architecture

The application separates responsibilities into route pages, interactive components, server actions, shared domain utilities, validation schemas, and Prisma models. Dashboard route groups organize pages by company, employee, manager, schedule, assessment, discussion, and analytics functions. Shared authorization helpers provide the active company context and role enforcement. The Prisma schema defines 23 relational models at the current repository snapshot.

The test portal has a direct route at /test-login, with no landing-page link. Public test personas and the private two-user company simulation are configured separately. The private identities are only sent to the portal after the server accepts the private simulation passphrase. This mechanism exists for evaluation and is not a substitute for production identity management.

## 4.4 Data Model and Database Initialization

The database uses relational records to associate users with companies through memberships. A membership carries a company role and links to an optional employee profile. Company identifiers scope departments, batches, tasks, meetings, assessments, forum records, audit events, and knowledge documents. Task assignments and assessment assignments link employees to work and preserve submission or review states.

![Simplified relational data model](#figure-data)

| Entity group | Representative models | Purpose |
|---|---|---|
| Identity and tenant | User, Company, CompanyMembership, EmployeeProfile | Resolve identity, company membership, role, and employee details. |
| Organization | Department, TrainingBatch | Organize teams and cohorts. |
| Onboarding work | Task, TaskAssignment, TaskReview | Define, assign, submit, and review operational or training work. |
| Scheduling | Meeting, MeetingParticipant, EmployeeDoubt | Coordinate sessions, attendance, and help needs. |
| Assessment | Worksheet, Question, AssessmentAssignment, AssessmentSubmission, AssessmentAnswer, AssessmentEvaluation | Author assessments and preserve attempts, answers, grading, and release state. |
| Discussion | ForumThread, ForumReply, ForumReport | Handle questions, replies, accepted solutions, reports, and moderation. |
| Knowledge and audit | CompanyKnowledgeDocument, AuditLog | Store company-scoped text chunks and administrative activity. |

## 4.5 Authentication and Authorization

Normal users authenticate through Clerk. Middleware protects application routes, and server-side helpers retrieve the current user and local database record. A company operation requires an active membership. The role-enforcement helper checks whether the active membership is permitted to perform the requested operation. The action then scopes its query by the active company identifier. This server-side pattern protects writes even when a user calls a server action without using the visible UI.

For evaluation, the application also supports password-gated local personas. The test session cookie resolves to a seeded database user. A separate private passphrase gates the two Ascent Demo Workspace identities. The landing page and sign-in page do not advertise the test route; an evaluator navigates directly to /test-login.

## 4.6 Onboarding Tasks and Workflows

Company administrators and managers create or reuse tasks, select employees or cohorts, set timing and priority, provide instructions and resources, and monitor assignment status. Employees see their personal work, update progress, submit notes or links, and can resubmit when requested. Managers use the review queue to approve work, request changes, or provide feedback. Historical training can be recorded as completed without creating pending work.

## 4.7 Meetings, Questions, and Discussion

Managers create training sessions, team meetings, one-to-ones, and help sessions. The scheduler checks for overlapping time intervals involving the organizer or participants and warns before proceeding. Participants receive invitations and can track attendance status. Unresolved doubts can be converted into help sessions.

The forum supports categories, threads, replies, accepted answers, reports, moderation, and links to related tasks, assessments, and meetings. Authors are recorded and shown. The project statement’s anonymous question requirement is therefore only partially met by the current forum; privacy-conscious summaries avoid naming employees, but the underlying thread is not anonymous.

## 4.8 Worksheets, Submissions, and Evaluation

Managers create worksheets with multiple-choice, short-answer, long-answer, and file or code URL questions. Employees can save drafts and submit attempts. Multiple-choice answers can be auto-graded. Written answers are evaluated against manager-entered rubrics. Managers can save an evaluation as a draft or release it to the employee. The application preserves prior attempts and protects correct options and unreleased grades from employee views.

An authorized manager can request provisional AI grading suggestions for written responses. The model receives the prompt, answer, rubric, and maximum marks, then returns suggested marks and feedback. The application bounds the returned marks and maps suggestions to valid questions. The manager reviews and edits the values before saving or releasing grades.

## 4.9 Company Knowledge Base and AI Assistant

The knowledge manager provides a title field and plaintext content area. The server validates the input, splits text at paragraph boundaries into bounded chunks, and requests embeddings from the Gemini embedding model configured by GEMINI_EMBEDDING_MODEL (default gemini-embedding-001). Each chunk and embedding is saved in the CompanyKnowledgeDocument table with the company ID and creator membership ID.

For a question, the server reads only documents for the current company. It embeds the question, ranks stored vectors using cosine similarity, and supplies the top four chunks to the configured text-generation model (default gemini-2.5-flash). The prompt instructs the model to use only company material, avoid inventing policy, and refer the user to a manager when the answer is absent. The result includes source titles.

The current storage field is JSON and similarity is computed in application code. Although the project statement proposed PostgreSQL vector search and document-processing libraries, the implementation does not currently use pgvector and does not extract text from uploaded PDFs or office files.

## 4.10 AI Doubt Insights and Analytics

The manager insights action analyzes up to 100 recent open or answered forum threads for the company. A manager’s analysis is limited to their direct reports. Gemini returns recurring themes, an estimated count, a short summary, and a suggested follow-up. The feature is presented as AI-generated and for manager review.

Performance analytics combine task completion, on-time delivery, and released assessment results. When both task and assessment data exist, the composite score weights assessments at 45%, task completion at 35%, and on-time delivery at 20%. With task-only data, the score uses 65% task completion and 35% on-time delivery. Insufficient data remains unranked rather than being treated as a zero score. Leaderboard ties use additional assessment and delivery metrics.

Table 4.3. AI-assisted features and human controls.

| Feature | AI output | Human control |
|---|---|---|
| Company onboarding assistant | Response grounded in retrieved company passages and source titles. | Employee can inspect source titles and ask a manager if the material is insufficient. |
| Written-answer grading support | Provisional marks and feedback for eligible written answers. | Manager checks and edits suggestions before saving or releasing grades. |
| Forum doubt insights | Themes, summaries, estimated counts, and suggested follow-up. | Manager reviews the summary before acting; no automatic employee action is taken. |

## 4.11 Audit, Notifications, and Integration

Sensitive administrative operations write audit events containing the actor, company, action, and relevant entity metadata. Invitation, task, meeting, and assessment workflows can send email through the configured provider. The application is integrated through Next.js server actions and provider APIs; the current code does not expose the FastAPI REST and WebSocket architecture proposed in the statement.

## 4.12 Implementation Limitations

1. Knowledge ingestion accepts pasted text, not direct document or PDF uploads.
2. There is no PDF extraction, OCR, or file parsing pipeline.
3. The forum is named; it does not provide anonymous thread creation.
4. There is no dedicated branching scenario simulator or isolated sandbox for simulated work.
5. Role-specific assignments are available, but automatic roadmap generation from a selected role and duration is not established.
6. Embeddings are stored as JSON and ranked in application code rather than through PostgreSQL pgvector search.
7. AI output quality depends on supplied content and provider behavior; the current test suite does not cover full Gemini question-answer requests.
8. Production deployment, external security review, backup recovery, and service-level objectives are not evidenced by the repository snapshot.

## 4.13 Chapter Summary

Ascent implements a role-aware onboarding platform around a relational company model, server-enforced authorization, and manager-to-employee workflows. Its AI layer provides company-grounded question answering and manager assistance. The implementation differs from the proposed stack in important ways and leaves several project-statement requirements for future development.


### 4.14 Request Lifecycle and Module Boundaries

A normal application request begins in a route page or interactive React component. A read-only page obtains the authenticated user and active company context before querying through Prisma. A mutation is submitted to a server action. The action first calls an authorization helper, then validates the input, applies business rules, performs a database operation, and revalidates the route or returns structured feedback. The browser does not connect directly to PostgreSQL. This boundary keeps database credentials and AI keys on the server and gives the application a central place for authorization.

The main implementation areas are organized by domain. Company routes handle organization structure and member management. Task routes and employee task pages cover assignment and submission. Schedule routes cover meetings and attendance. Assessment actions own worksheet creation, assignment, submission, grading, and resubmission. Forum routes own thread and reply workflows. Company knowledge and assistant routes own ingestion and query operations. Analytics actions calculate performance views and request AI summaries. Shared libraries provide authentication, database access, validation, audit events, email, analytics calculations, and Gemini calls.

This organization follows feature boundaries rather than a separate backend service. The same Next.js server executes page logic and server actions. The project statement proposed a FastAPI API service; the repository instead uses the Next.js server runtime. This choice simplifies the prototype deployment but means there is no independently deployed Python service or WebSocket API in the present version.

### 4.15 Database Model and Relationships

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

### 4.16 Authentication, Membership, and Authorization Implementation

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

### 4.17 Task, Training, and Historical Work Implementation

Managers create tasks with title, descriptions, instructions, task type, priority, start and due dates, and any available resource links. Assignment operations create employee-specific TaskAssignment records for selected employees. Employees use their personal task view to update progress and submit notes or links. A manager review can approve the submission, request changes, or provide feedback. A changed submission returns to the employee for correction and can be reviewed again.

Historical work is represented separately from pending tasks. This distinction lets a manager record prior experience or training completion without asking the employee to repeat the activity. Reusable task types include daily work, training activity, recurring task, template, and historical record. Assignment status moves through states such as not started, in progress, submitted, under review, changes requested, and completed. Status transitions matter to analytics because completion and lateness are calculated from assignment dates and current status.

The workflow supports practical onboarding but is not a simulator. The task description and submission record do not create an isolated work environment, synthetic ticket queue, simulated source repository, or branching response. To implement the project statement’s simulation requirement, future development would need scenario definitions, sanitized artifacts, controlled choices, evidence capture, scoring rubrics, and an explicit rule that simulated activity cannot affect production systems.

### 4.18 Meeting and Doubt Management Implementation

Meeting records include a company, organizer membership, title, meeting type, scheduled time, status, and participation information. MeetingParticipant rows associate members with events and record invitation or attendance states. The schedule action checks overlapping time ranges for the organizer and participants and returns a warning. This is an application-level conflict check; external calendars are not synchronized by the repository.

Meeting types include training session, team meeting, one-to-one, and help session. The project also models employee doubts and their status, allowing an unresolved concern to be connected to a help workflow. Discussion threads offer a more general company conversation path and include category, status, author, replies, accepted-answer state, reports, and moderation operations.

The distinction between an employee doubt and a forum thread is useful: a doubt may represent an employee’s need for manager help, while a forum thread supports shared discussion and reusable answers. The current forum associates a thread with its author and displays that identity. It does not implement anonymous posting. AI summaries do not change this fact and should not be presented as a privacy substitute.

### 4.19 Assessment Authoring, Submission, and Evaluation

Assessment authoring validates title, instructions, question types, options, max marks, and rubric fields before writing. A worksheet and its question rows are created transactionally to avoid leaving a worksheet with only some questions. Multiple-choice options and correct-option metadata are stored for the objective question path; written questions can include a rubric. The total possible marks are calculated from question maxima.

Assignment validates that the worksheet belongs to the active company and that selected employees are eligible. Employees can save drafts and submit attempts. The system preserves attempts and answer records so that the latest response can be interpreted without overwriting the full history. Objective questions can be auto-graded. Written answers are evaluated by a manager, who can save a draft or release feedback. A resubmission workflow is available when the worksheet permits it.

The optional AI grading action constructs a prompt from the question, response, rubric, and maximum mark, requests structured output, validates the response, and bounds marks to the permissible range. The suggestion is not itself an evaluation state. The manager can correct the proposed marks or text before saving. The grade-release state controls what an employee can see. This separation is important because AI output and manager decision are distinct data events.

### 4.20 Company Knowledge Ingestion and Retrieval Implementation

Knowledge entry begins with a company administrator or manager submitting a title and text. The server limits the title to 160 characters, requires at least three characters in the title and 30 characters of content, and rejects content above 50,000 characters. The text is divided into chunks with a target maximum length of 1,200 characters. Paragraph boundaries are preferred; long paragraphs are split at a nearby space when possible. Chunks are embedded in groups of up to four parallel API requests and then written to the database in a transaction.

The stored record contains company identifier, creator membership, title, text chunk, embedding JSON, and timestamps. The title is included in the text sent to the embedding endpoint, which associates the passage with a short document label. A failure during embedding prevents the content from being reported as successfully indexed. Deletion removes rows matching both the active company and title. Because chunks share the title and there is no source-file model, document-level version history is not currently represented.

On a user question, the action checks that the user has active company context and validates a question length from 3 to 1,000 characters. It loads knowledge rows only for that company, embeds the question, computes cosine similarity for each candidate, sorts candidates descending, and selects at most four passages. The generation prompt includes the company name, a constraint to answer only from supplied material, a direction to abstain when the answer is missing, and a reminder not to disclose practice assessment answers. The result returns generated text and the unique titles of the selected passages.

The implementation is a small-corpus semantic retrieval path rather than a scalable vector database design. All company embeddings are loaded for ranking in application memory. Query cost therefore grows with the number of stored chunks. A future data layer could use pgvector or a managed vector index, add retrieval thresholds and hybrid lexical search, preserve source page and section metadata, and support safe re-indexing when documents change. Those improvements need a measured corpus and evaluation set rather than assumptions about scale.

Code Snippet 4.1 shows the chunk-boundary policy used by the shared AI helper. Paragraphs are kept together while they fit. A paragraph that is longer than the limit is split near a word boundary when possible. The function is intentionally deterministic, which makes it suitable for unit testing and for repeatable ingestion of the same text.

~~~typescript
export function splitIntoChunks(text: string, maxLength = 1200): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of normalized.split(/\n{2,}/)) {
    let remaining = paragraph.trim();
    while (remaining.length > maxLength) {
      const cut = remaining.lastIndexOf(" ", maxLength);
      const index = cut > maxLength * 0.6 ? cut : maxLength;
      const part = remaining.slice(0, index).trim();
      if (current) chunks.push(current);
      chunks.push(part);
      current = "";
      remaining = remaining.slice(index).trim();
    }
    if (!remaining) continue;
    if ((current ? current.length + 2 : 0) + remaining.length > maxLength) {
      if (current) chunks.push(current);
      current = remaining;
    } else {
      current = current ? current + "\n\n" + remaining : remaining;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
~~~

Code Snippet 4.2 is the vector comparison used to rank stored passages. It rejects vectors with different dimensions and treats empty or zero-magnitude input as a zero score. This behavior prevents an invalid vector from producing a misleading numeric result. The function does not apply a relevance threshold: it always orders the available candidates and the caller takes the highest-ranked passages.

~~~typescript
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}
~~~

Code Snippet 4.3 highlights the company filter and top-four selection in the assistant action. The database query limits candidates to the current company before similarity ranking. Sorting is performed in application code, which keeps the implementation easy to understand for a small corpus. It also means memory and ranking time grow with the number of chunks stored for that company.

~~~typescript
const documents = await db.companyKnowledgeDocument.findMany({
  where: { companyId: context.company!.id },
  select: { title: true, content: true, embedding: true },
});
const queryEmbedding = await embedText(trimmedQuestion);
const matches = documents
  .map((document) => ({
    ...document,
    score: cosineSimilarity(
      queryEmbedding,
      document.embedding as number[] || [],
    ),
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 4);
~~~

The retrieved passages become the evidence context for generation. The application extracts distinct titles from the selected passages and returns those titles alongside the answer. A title is a source pointer, not a line-level citation: the current record does not retain page number, paragraph offset, or original-file location. The ingestion and retrieval design is therefore appropriate for a demonstration of grounded company Q&A, while a production knowledge service would require stronger provenance and more extensive evaluation.

### 4.21 AI Insight Actions and Output Controls

The AI integration is isolated in a shared Gemini helper. The helper reads its API key from server environment configuration, posts JSON to the model endpoint, uses a configurable embedding model with a default of gemini-embedding-001, and uses a configurable text model with a default of gemini-2.5-flash. Generation requests use low temperature and a maximum output-token limit. Empty embeddings and empty text responses produce errors. JSON generation requests ask for JSON only, then attempt a direct parse and a limited object extraction fallback.

The grading action and doubt-insight action use the shared helper but have different inputs and outputs. Grading is associated with an individual assessment and validated against mark bounds. Doubt analysis selects up to 100 recent open or answered threads for the company. If the caller is a manager, the selection is further limited to direct reports. The model is asked to produce up to six themes with a topic, estimated count, short summary, and practical suggestion. The server truncates strings and bounds counts before returning the result.

These controls bound output size and scope; they do not verify factual correctness. A generated theme may be too broad, and a count is an estimate rather than a validated count of distinct employees. The underlying threads should be reviewed before follow-up. The system does not automatically change a task, assessment grade, employee status, or policy based on generated content.

### 4.22 Analytics and Progress Calculation

Progress analytics use recorded task assignments, delivery state, and released assessments. When task and assessment data are both present, the composite formula weights assessment performance at 45 percent, task completion at 35 percent, and on-time delivery at 20 percent. For task-only records, task completion receives 65 percent and on-time delivery 35 percent. Insufficient data remains unranked instead of being interpreted as a failing score.

| Data condition | Composite calculation | Interpretation |
|---|---|---|
| Assessment and task data both available | 0.45 × assessment score + 0.35 × task completion + 0.20 × on-time delivery | Mixed measure of demonstrated assessment performance and work progress. |
| Task records only | 0.65 × task completion + 0.35 × on-time delivery | Operational completion indicator without assessment evidence. |
| Too little usable information | No ranking | The system avoids converting missing evidence into a zero. |

The weights make the score reproducible but do not make it a validated performance instrument. Task complexity can differ, assignments can be added or removed, and a manager’s grading may vary. A score should be interpreted alongside its component measures and underlying work. Before using analytics for formal decisions, an organization would need to validate the metric, define how incomplete records are handled, and review fairness across roles and cohorts.

### 4.23 Notifications, Audit, and Error Handling

The project integrates invitation and workflow notifications through configured email providers. Email is an external dependency and may not be available in every local setup. Audit helpers record selected high-impact operations with actor, company, action, entity type, entity identifier, and structured metadata. Audit records support traceability but do not by themselves provide a complete security monitoring system.

Validation failures return user-facing errors before database mutation. Provider failures are caught in AI actions and returned as an error result. Database writes that create related records use transactions where implemented. Route revalidation updates pages after successful mutation. Production hardening should standardize error codes, avoid returning provider response detail to end users, apply retry and rate-limit policies, and ensure logs never contain secret keys or unnecessary sensitive text.

### 4.24 Development and Execution Structure

The repository uses the Next.js application as the main runtime. Prisma provides the generated client and schema management for PostgreSQL. Environment files supply database, identity, email, AI model, and test-portal settings. Seed scripts create general development data and the targeted demo knowledge corpus. The local execution path therefore requires the application dependencies, a reachable configured database, a synchronized schema, and the environment values needed for the feature being demonstrated.

The knowledge seeder is separate from the general application seed and is designed for the three demonstration documents. After database schema synchronization, it creates or refreshes searchable chunks for the Ascent Demo Workspace. Keeping demo knowledge seeding separate avoids making the normal user seed responsible for external AI calls. A repeatable seed path is useful for evaluation because it allows the assistant corpus to be restored without manually re-entering each item.

### 4.25 Chapter Summary

This chapter traces the implementation from request handling and relational modeling through authorization, tasks, schedules, assessments, company knowledge, AI insights, and analytics. It identifies exact delivered mechanisms and their present boundaries. The main design strengths are server-side authorization, explicit workflow records, manager review, and company-scoped knowledge retrieval. The main technical constraints are pasted-text ingestion, application-side vector search, named discussions, and the absence of an isolated simulation engine.

# Chapter 5: Results and Discussion

## 5.1 Experimental Setup

The results in this chapter combine the repository’s automated test suite with a successful knowledge-ingestion operation on the configured development database. Tests use the Node.js test runner and tsx. The knowledge demonstration uses the Ascent Demo Workspace, the Gemini API, and the company knowledge table. No benchmark dataset or production user study is included.

## 5.2 Automated Test Results

| Measure | Result |
|---|---:|
| Automated tests executed | 69 |
| Passed | 69 |
| Failed | 0 |
| Skipped | 0 |
| Test suites | 25 |

![Verification summary](#figure-results)

The suite verifies utility and business logic, not every user-interface path. Coverage includes knowledge chunking and cosine similarity, analytics formulas, assessment input validation and grade-release safeguards, forum lifecycles and tenant boundaries, schedule conflict detection, and test persona configuration. It does not constitute a full browser end-to-end test or model-quality evaluation.

## 5.3 Company Knowledge Ingestion Result

Three fictional onboarding documents were indexed for the Ascent Demo Workspace: a first-week guide, information-security and device rules, and an IT support, remote-work, and time-off FAQ. The indexing operation completed with three searchable chunks, one per document. The database schema was synchronized to add the knowledge table before the write. This confirms that the database and Gemini embedding path were reachable during ingestion. It does not measure retrieval precision or answer accuracy across a test set.

## 5.4 Functional Verification

The platform provides working flows for multi-role access, onboarding task assignment, employee submissions, manager review, assessment creation and grading, meeting scheduling, forum discussion, analytics, and AI-assisted support. The automated tests give evidence for important rules such as schedule overlap handling, latest-attempt scoring, tenant isolation, and withholding unreleased grades.

The manager and employee demonstration can be run using the private simulation identities. The manager can inspect indexed content under Company Knowledge Base. The employee can ask the assistant questions such as “What onboarding tasks should I finish by the end of my fifth working day?” or “How quickly should I report a suspected phishing message?” An unsupported question such as “How many annual leave days do I get?” checks whether the assistant admits that the indexed material does not specify the answer.

## 5.5 Requirement Coverage

| Project statement requirement | Status | Evidence in current implementation |
|---|---|---|
| Company workspaces and role-based access | Implemented | Company memberships, active company context, and server-side role checks. |
| Manager organization and employee oversight | Implemented | Member, department, cohort, task, schedule, and analytics pages. |
| Personalized employee onboarding workflow | Implemented | Employee dashboard, assigned tasks, meetings, assessments, and work status. |
| Task and historical work support | Partially implemented | Tasks and historical training records exist; a separate scenario simulator does not. |
| Manager schedules and meeting management | Implemented | Meeting types, invitations, attendance, and overlap warnings. |
| Courses and training | Partially implemented | Training tasks and assessments exist; a distinct course catalog or LMS is not established. |
| Anonymous doubt forum | Not implemented | Forum threads store and display authors. |
| AI classification and manager summaries | Partially implemented | AI groups recent threads into themes; it does not automatically assign forum categories. |
| Company-specific policy assistant | Implemented for pasted text | Tenant-scoped embeddings, retrieval, generation, and source titles. |
| Upload policy files and parse documents | Not implemented | Knowledge form is a title plus pasted text; no file parser. |
| Progress and performance insights | Implemented | Task, assessment, delivery, trends, and leaderboard metrics. |
| Preconfigured HR, software, and issue-handling simulation tracks | Partially implemented | General roles, departments, tasks, and assessments exist; predefined role-specific simulation templates do not. |

## 5.6 Discussion of Results

The automated results support the correctness of selected business rules and utility functions. They do not prove that all UI workflows work under every identity configuration. The successful ingestion operation demonstrates that the knowledge schema and embedding generation can write a small, curated dataset. Since there are only three demo chunks and no labeled retrieval benchmark, no retrieval-accuracy or response-quality percentage is claimed.

The architecture is suitable for a demonstration and further iteration. Production use would require stronger operational evidence: browser end-to-end coverage, authorization review, prompt-injection testing against uploaded content, document parsing validation, model-quality evaluation, cost and latency tracking, backups, and deployment configuration.

## 5.7 Chapter Summary

The test suite passed all 69 tests in the latest run. A three-document company knowledge corpus was indexed successfully. The strongest verified capabilities are the workflow logic and the knowledge ingestion utilities. Full browser and AI-answer quality testing remains future validation work.


### 5.8 Test Design and Coverage Interpretation

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

The following acceptance cases are recommended for a controlled manual run. They are specified here to make the test boundary actionable; unless identified in the automated test totals above, they must not be interpreted as already executed.

| ID | Test setup and action | Expected result | Execution status |
|---|---|---|---|
| A01 | Sign in as a Company Admin and open company members | Only the active company membership and its members are shown | Browser acceptance recommended |
| A02 | Sign in as an Employee and directly invoke a manager-only action | The server rejects the operation even if the request bypasses the UI | Integration/security acceptance recommended |
| A03 | Create a task for one employee, submit evidence, and request a change as the manager | The manager feedback is retained and the employee can submit a revision | Browser acceptance recommended |
| A04 | Create an assessment, save an employee draft, submit, and keep the manager evaluation unreleased | The employee can edit the draft before submission and cannot see an unreleased grade | Browser acceptance recommended |
| A05 | Add one of the demo knowledge entries and ask a question with an explicit answer | The assistant returns a relevant response and the expected source title | Live AI smoke test recommended |
| A06 | Ask the assistant about annual-leave entitlement, absent from the demo corpus | The response acknowledges missing evidence and refers the employee to a manager | Live AI quality check recommended |
| A07 | Prepare two companies with similarly titled knowledge records and query from each membership | Each answer and source list uses only the active company’s records | Security acceptance recommended |
| A08 | Create overlapping meetings for one participant and then adjust the time | A conflict warning appears for the overlap and no warning appears for a non-overlap | Browser acceptance recommended |

For each manual run, record the build revision, date, role, company context, initial database state, action steps, expected behavior, observed behavior, and outcome. Store screenshots only when they do not expose names, emails, secrets, or private policy text. If a case fails, capture a redacted error message, create a defect linked to the requirement identifier, and rerun the same case after the change. The AI checks should also store the model configuration and exact question so that a later prompt or model change can be evaluated against the same case.

### 5.9 Demonstration Dataset and Knowledge Ingestion Result

The Ascent Demo Workspace contains three synthetic company documents: a First Week Guide, Information Security and Device Rules, and an IT Support/Remote Work/Time Off FAQ. The targeted seed operation produced three searchable chunks, one per document, after the knowledge table schema was synchronized. This demonstrates that the database write path and Gemini embedding request were reachable in the configured environment during the ingestion operation.

The dataset was deliberately small and covers concrete onboarding facts. Suggested positive questions include the tasks expected by the end of the fifth working day, the onboarding buddy, how to handle an unexpected multi-factor prompt, the reporting window for a suspected phishing message, and the normal IT-request response expectation. A separate negative question asks for annual-leave entitlement, which is intentionally absent from the seeded text. This positive/negative pair is useful for a manual grounding check because a complete assistant should return source-supported answers for the positive cases and acknowledge missing evidence for the negative case.

The indexing result is not an answer-quality benchmark. The number of indexed chunks does not measure retrieval precision, recall, groundedness, factuality, latency, or model consistency. A proper evaluation should record the query, expected source passage, retrieved passages, generated answer, source title, abstention result, and reviewer judgment for each case. It should be repeated after any change to chunking, embedding model, prompt, retrieval method, or generation model.

### 5.10 Functional Results by User Journey

| Journey | Implemented result | Evidence and boundary |
|---|---|---|
| Administrator prepares the company | Membership, departments, cohorts, knowledge text, and administrative views are represented. | Routes and schema are present; file upload and automated roadmap generation remain absent. |
| Manager assigns work | Tasks and worksheets can be created, assigned, and reviewed; meetings can be scheduled. | Automated logic supports core paths; browser acceptance across all roles remains advisable. |
| Employee completes onboarding activity | Personal task, meeting, assessment, and discussion views are available. | Workflow state is represented; no production HR provisioning is integrated. |
| Manager reviews performance | Analytics use task and assessment activity and leave sparse data unranked. | Formula tests exist; no user study validates this as a performance measure. |
| Employee asks company policy question | Pasted text can be embedded, retrieved within company scope, and used as generation context. | Three demo documents were indexed; end-to-end answer quality was not benchmarked. |
| Manager uses AI assistance | Written-answer suggestions and thread themes can be generated for review. | AI outputs remain advisory; model output is not a final grade or automatic action. |

The results support a conclusion that the prototype has functioning application logic for the major workflow categories. They do not support a conclusion that every user journey is free of interface defects or that AI assistance is consistently correct. The difference matters: functional integration is a necessary milestone, while usability and model quality require separate testing.

### 5.11 Requirement Coverage and Gap Analysis

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

### 5.12 Threats to Validity

The evaluation uses a single repository snapshot and a small synthetic knowledge corpus. Automated tests cover selected logic, not every UI route or external service response. Gemini output can vary, so an answer observed once cannot establish repeatable quality. Demo data is fictional and does not represent a representative employee population. Performance analytics have not been validated against manager ratings or onboarding outcomes. These factors limit generalization and prevent claims about real-world effectiveness.

The requirements comparison also involves interpretation. A general task may partially support a role-specific activity but does not satisfy an interactive simulator requirement. A named discussion can support questions but does not satisfy anonymity. To reduce ambiguity, this report names the implemented mechanism and the missing property separately rather than assigning full completion based on a similar label.

### 5.13 Chapter Summary

The project passes the latest recorded automated suite and successfully indexed a small set of demo knowledge documents. The tested logic supports several key workflows, including validation, scoring, schedule conflicts, and tenant-aware operations. The evidence does not include browser end-to-end coverage, production monitoring, or a labeled evaluation of Gemini responses. Requirement coverage is therefore substantial but partial, with file ingestion, anonymity, automatic roadmaps, and simulation remaining significant gaps.

# Chapter 6: Conclusion, Summary and Future Scope

## 6.1 Project Summary

Ascent is a multi-tenant employee onboarding and performance platform built with Next.js, React, TypeScript, Neon PostgreSQL, Prisma, Clerk, and Gemini. It brings company administration, onboarding work, meetings, assessments, discussion, analytics, and AI assistance into a role-aware workspace. Server-side company context and authorization are central to its design.

## 6.2 Conclusion

The project delivers a substantial prototype for organizing employee onboarding and manager follow-up. It provides structured work and review, schedule management, assessment workflows, discussion tools, analytics, and company-specific AI answers. Unit-level verification and the seeded company demonstration show the main data and utility paths are functioning. The project statement’s goals around document uploads, anonymous questions, and dedicated work simulation are not yet fully met and should be completed before the system is described as a full implementation of that statement.

## 6.3 Limitations

The current knowledge interface requires text to be pasted manually and does not preserve original file attachments or document versions. The assistant uses JSON-stored embeddings with in-process cosine similarity and has not been evaluated against a formal benchmark. Forum authors are visible. The work-simulation experience is composed from tasks and assessments rather than a scenario engine. Production security, performance, availability, and deployment claims require independent testing.

## 6.4 Future Scope

1. Add secure PDF, DOCX, and other document upload with extraction, validation, versioning, and deletion controls.
2. Add a proper semantic-search index, including PostgreSQL pgvector if chosen, with company-scoped retrieval and migration tooling.
3. Add configurable anonymous questions with manager workflows that protect author identity while maintaining abuse controls.
4. Build a scenario-based work-simulation module with branching situations, role-specific tasks, evidence submissions, and manager rubrics.
5. Generate onboarding roadmaps from role, department, and program duration, while allowing managers to review and edit the result.
6. Add a test corpus for retrieval quality, answer grounding, unsupported questions, prompt injection, and cross-company isolation.
7. Add browser-based end-to-end tests, deployment automation, monitoring, backups, and operational runbooks.
8. Evaluate privacy, retention, AI provider settings, latency, and per-company usage costs before production rollout.

## 6.5 Contribution to Organizational Development

Ascent supports more consistent onboarding by connecting policies, tasks, meetings, assessments, employee questions, and manager oversight. The AI functions can make company guidance easier to search and summarize repeated questions. These contributions are demonstrative; measurable improvements in completion time, employee confidence, or retention would require a real deployment and a user study.


### 6.6 Recommended Development Roadmap

The next phase should begin with requirements closure rather than additional AI features. First, implement a role-and-duration roadmap model that managers can edit before publishing. Second, build a controlled historical-work simulation with sanitized artifacts and a scoring rubric. Third, design anonymous question handling with clear disclosure, moderation controls, and privacy review. These changes address central requirements in the original statement.

The next phase of AI work should improve the ingestion and evaluation pipeline. Add file upload with type and size validation, safe text extraction, source metadata, version replacement, and deletion. Add a retrieval threshold and a vector index after measuring the expected corpus size. Build a gold question set with answerable, ambiguous, conflicting, and unanswerable examples. Evaluate retrieved evidence and generated response separately, and include prompt-injection and tenant-isolation cases.

Before production use, run browser end-to-end tests for each role; perform a security review of every server action; define retention, consent, and data-processing rules; exercise backups and restoration; and measure latency, provider cost, and rate limits. A pilot should collect user feedback and task completion evidence, with a comparison against the organization’s current onboarding process. These steps would turn a demonstrator into an evidence-based product evaluation.

### 6.7 Contribution to Sustainable Development Goals

The project has a direct connection to organizational learning and workplace development rather than to a measured sustainability outcome. Its platform can help make onboarding information and learning activities more accessible, which is relevant to quality education and skills development as a broad objective. However, the application does not measure energy use, emissions, or environmental impact and should not claim direct contribution to climate targets.

Its potential societal value lies in supporting clearer role expectations and access to information for new employees. Whether this improves well-being, inclusion, or retention must be established through real deployment and ethical evaluation. A future pilot should include accessibility, language, and privacy considerations so the platform does not create barriers for employees who need different formats or communication methods.

# Chapter 7: References

1. Project team, “Role-Based Smart Employee Onboarding and Work Simulation Platform: Project Statement,” supplied project statement, 2026.
2. P. Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,” *Advances in Neural Information Processing Systems*, 2020. [Online]. Available: https://arxiv.org/abs/2005.11401
3. Vercel, “Next.js App Router Documentation.” [Online]. Available: https://nextjs.org/docs/app
4. Meta Open Source, “React Documentation.” [Online]. Available: https://react.dev/learn
5. Clerk, “Clerk Middleware for Next.js.” [Online]. Available: https://clerk.com/docs/reference/nextjs/clerk-middleware
6. Prisma, “Prisma ORM v6 Documentation.” [Online]. Available: https://www.prisma.io/docs/orm/v6
7. Neon, “Neon Documentation.” [Online]. Available: https://neon.com/docs
8. Google AI for Developers, “Gemini API Embeddings.” [Online]. Available: https://ai.google.dev/gemini-api/docs/embeddings
9. Google AI for Developers, “Gemini API Text Generation.” [Online]. Available: https://ai.google.dev/gemini-api/docs/text-generation

10. E. Fr�g�li, B. Jenner, and P. Gustavsson, "Effectiveness of formal onboarding for facilitating organizational socialization: A systematic review," PLoS ONE, vol. 18, no. 2, e0281823, 2023. doi: 10.1371/journal.pone.0281823.

## Appendix A: Important Project Files

| File or directory | Purpose |
|---|---|
| src/app/dashboard | Dashboard routes for administration, employee work, managers, schedule, assessments, forum, analytics, and assistant. |
| src/lib/auth.ts | User resolution, active company context, and role enforcement. |
| src/lib/ai/gemini.ts | Gemini requests, chunking, and cosine similarity. |
| src/app/dashboard/company/knowledge | Company knowledge management and employee assistant actions. |
| src/app/dashboard/assessments/actions.ts | Worksheet, assignment, submission, evaluation, and AI grading actions. |
| src/app/dashboard/analytics/actions.ts | Manager AI analysis of recurring forum questions. |
| prisma/schema.prisma | Relational schema for the platform. |
| prisma/seed.ts | Development seed data, including the demo company identities. |
| prisma/seed-demo-knowledge.ts | Targeted, repeatable ingestion of the three demo knowledge documents. |
| tests/ | Automated unit and logic tests. |

## Appendix B: Demo Execution and Sample Questions

1. Start the application with the project’s development command and confirm the database and required environment variables are configured.
2. Open /test-login directly; this route is intentionally not linked from the landing or sign-in pages.
3. Unlock the private simulation identities using the server-configured passphrase and choose the Company Admin in Ascent Demo Workspace.
4. Open **Company → Knowledge Base** to review the indexed document titles.
5. Sign out of the demo identity, return to /test-login, and choose the Employee in the same company.
6. Open **Onboarding Assistant** and ask questions covered by the indexed company documents.

Suggested questions:

- What onboarding tasks should I finish by the end of my fifth working day?
- Who is my onboarding buddy, and who approves my priorities?
- What should I do if I receive an unexpected MFA prompt?
- How quickly should I report suspected phishing, and what details should I include?
- How long should I expect a normal IT request to take?
- How far ahead should I enter planned time off, and where?
- What should I use when accessing internal tools remotely from an untrusted network?
- How many annual leave days do I get? The demo documents do not specify this; the assistant should say it cannot find the answer and direct the employee to a manager.

## Appendix C: Sample Test Scenarios

| Scenario | Expected behavior |
|---|---|
| Employee asks about a policy covered by one document | A concise answer with the relevant source title. |
| Employee asks a policy question absent from the documents | Assistant states it could not find the answer and directs the employee to a manager. |
| Employee asks about another company’s documents | No cross-company document should be retrieved. |
| Manager requests a written-answer grading suggestion | Suggested marks and feedback are displayed for manager review; the manager retains the final decision. |
| A task or assessment is submitted | The relevant status changes and the manager can review the submission. |
| Two meetings overlap for a participant | The scheduler warns about the conflict before the manager proceeds. |

## Appendix D: Environment Configuration Categories

The application uses environment variables for Clerk credentials, database URLs, Gemini API access and model names, email provider credentials, and test-portal passphrases. Secret values must remain in the local environment or deployment secret store and must not be written into this report or committed to source control.

`;

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function inline(value) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function mdToHtml(source) {
  const lines = source.trim().split(/\r?\n/);
  let html = "";
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith("~~~")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("~~~")) code.push(lines[i++]);
      if (i < lines.length) i++;
      html += `<figure class="code-figure"><pre><code>${escapeHtml(code.join("\n"))}</code></pre></figure>`;
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = lines[i].trim().split("|").slice(1, -1).map((cell) => cell.trim());
        if (!row.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(row);
        i++;
      }
      if (rows.length) {
        html += '<div class="table-wrap"><table><thead><tr>' + rows[0].map((cell) => `<th>${inline(cell)}</th>`).join("") + "</tr></thead><tbody>";
        for (const row of rows.slice(1)) html += "<tr>" + rows[0].map((_, index) => `<td>${inline(row[index] || "")}</td>`).join("") + "</tr>";
        html += "</tbody></table></div>";
      }
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2];
      const id = slug(title);
      html += `<h${level} id="${id}">${inline(title)}</h${level}>`;
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      html += "<ul>";
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        html += `<li>${inline(lines[i].trim().slice(2))}</li>`;
        i++;
      }
      html += "</ul>";
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      html += "<ol>";
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        html += `<li>${inline(lines[i].trim().replace(/^\d+\.\s/, ""))}</li>`;
        i++;
      }
      html += "</ol>";
      continue;
    }
    let paragraph = line;
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*]\s|\d+\.\s|\|)/.test(lines[i].trim())) {
      paragraph += " " + lines[i].trim();
      i++;
    }
    html += `<p>${inline(paragraph)}</p>`;
  }
  return html;
}

const figureArchitecture = `<figure class="diagram" id="figure-architecture"><svg viewBox="0 0 980 390" role="img" aria-label="Logical architecture: user browser, authentication and authorization, Next.js application services, Neon PostgreSQL, Gemini AI, and email provider"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#718096"/></marker></defs><rect x="16" y="25" width="180" height="92" rx="14" fill="#edf3fa" stroke="#7591b0"/><text x="106" y="60" text-anchor="middle" class="svg-title">Browser</text><text x="106" y="84" text-anchor="middle" class="svg-copy">React dashboards</text><text x="106" y="103" text-anchor="middle" class="svg-copy">and forms</text><rect x="240" y="25" width="210" height="92" rx="14" fill="#fff2e9" stroke="#d88358"/><text x="345" y="59" text-anchor="middle" class="svg-title">Identity and access</text><text x="345" y="83" text-anchor="middle" class="svg-copy">Clerk + local test session</text><text x="345" y="102" text-anchor="middle" class="svg-copy">active company + role</text><rect x="500" y="25" width="220" height="92" rx="14" fill="#eef5ef" stroke="#77987d"/><text x="610" y="59" text-anchor="middle" class="svg-title">Next.js server</text><text x="610" y="83" text-anchor="middle" class="svg-copy">App Router + Server Actions</text><text x="610" y="102" text-anchor="middle" class="svg-copy">validation + business rules</text><rect x="770" y="25" width="190" height="92" rx="14" fill="#edf3fa" stroke="#7591b0"/><text x="865" y="59" text-anchor="middle" class="svg-title">Neon PostgreSQL</text><text x="865" y="83" text-anchor="middle" class="svg-copy">Prisma relational models</text><text x="865" y="102" text-anchor="middle" class="svg-copy">company-scoped records</text><path d="M196 70 H238" stroke="#718096" stroke-width="2" marker-end="url(#arrow)"/><path d="M450 70 H498" stroke="#718096" stroke-width="2" marker-end="url(#arrow)"/><path d="M720 70 H768" stroke="#718096" stroke-width="2" marker-end="url(#arrow)"/><rect x="345" y="245" width="260" height="94" rx="14" fill="#f3effa" stroke="#9c83b8"/><text x="475" y="280" text-anchor="middle" class="svg-title">Gemini API</text><text x="475" y="305" text-anchor="middle" class="svg-copy">embeddings + generated text</text><text x="475" y="324" text-anchor="middle" class="svg-copy">server-only API calls</text><rect x="690" y="245" width="240" height="94" rx="14" fill="#f5f5f2" stroke="#9b9b8b"/><text x="810" y="280" text-anchor="middle" class="svg-title">Email providers</text><text x="810" y="305" text-anchor="middle" class="svg-copy">Resend / SMTP</text><text x="810" y="324" text-anchor="middle" class="svg-copy">invitations and notices</text><path d="M600 117 C600 175 480 178 480 243" fill="none" stroke="#718096" stroke-width="2" marker-end="url(#arrow)"/><path d="M855 117 C855 180 800 184 800 243" fill="none" stroke="#718096" stroke-width="2" marker-end="url(#arrow)"/><text x="18" y="184" class="svg-small">Requests enter the server; the server authorizes by membership and company before reading or writing data.</text></svg><figcaption>Figure 3.1. Logical architecture of Ascent.</figcaption></figure>`;
const figureRag = `<figure class="diagram" id="figure-rag"><svg viewBox="0 0 980 250" role="img" aria-label="Knowledge text is split into chunks and embedded, then stored with company scope; employee questions are embedded, matched to top passages, and sent with context to the language model"><defs><marker id="arrow2" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#718096"/></marker></defs><g fill="#edf3fa" stroke="#7591b0"><rect x="15" y="30" width="150" height="68" rx="12"/><rect x="205" y="30" width="150" height="68" rx="12"/><rect x="395" y="30" width="170" height="68" rx="12"/><rect x="605" y="30" width="160" height="68" rx="12"/><rect x="805" y="30" width="160" height="68" rx="12"/></g><g class="svg-title" text-anchor="middle"><text x="90" y="59">Policy text</text><text x="280" y="59">Chunk text</text><text x="480" y="59">Gemini embeddings</text><text x="685" y="59">Company database</text><text x="885" y="59">Top passages</text></g><g class="svg-copy" text-anchor="middle"><text x="90" y="80">pasted by admin</text><text x="280" y="80">about 1,200 chars</text><text x="480" y="80">one per chunk</text><text x="685" y="80">text + JSON vector</text><text x="885" y="80">similarity ranking</text></g><path d="M165 64 H203 M355 64 H393 M565 64 H603 M765 64 H803" stroke="#718096" stroke-width="2" marker-end="url(#arrow2)"/><g fill="#fff2e9" stroke="#d88358"><rect x="115" y="150" width="170" height="68" rx="12"/><rect x="360" y="150" width="180" height="68" rx="12"/><rect x="615" y="150" width="175" height="68" rx="12"/><rect x="830" y="150" width="135" height="68" rx="12"/></g><g class="svg-title" text-anchor="middle"><text x="200" y="178">Employee question</text><text x="450" y="178">Query embedding</text><text x="702" y="178">Gemini answer</text><text x="897" y="178">Answer + sources</text></g><g class="svg-copy" text-anchor="middle"><text x="200" y="199">current company only</text><text x="450" y="199">same embedding model</text><text x="702" y="199">context-bound prompt</text><text x="897" y="199">to employee UI</text></g><path d="M285 184 H358 M540 184 H613 M790 184 H828" stroke="#718096" stroke-width="2" marker-end="url(#arrow2)"/><path d="M685 100 C685 131 480 127 450 148" fill="none" stroke="#8e73a8" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arrow2)"/><text x="27" y="236" class="svg-small">Storage and retrieval are scoped by companyId; the current implementation ranks JSON vectors in application code.</text></svg><figcaption>Figure 3.2. Company knowledge ingestion and assistant retrieval flow.</figcaption></figure>`;
const figureDemo = `<figure class="diagram" id="figure-demo"><svg viewBox="0 0 980 210" role="img" aria-label="Admin prepares company information and onboarding tasks; employee completes work and asks the assistant; manager reviews submissions and insights"><defs><marker id="arrow3" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#718096"/></marker></defs><rect x="20" y="48" width="260" height="115" rx="14" fill="#fff2e9" stroke="#d88358"/><text x="150" y="80" class="svg-title" text-anchor="middle">Company Admin / Manager</text><text x="150" y="108" class="svg-copy" text-anchor="middle">Configure workspace, add material,</text><text x="150" y="128" class="svg-copy" text-anchor="middle">assign tasks, schedule sessions</text><text x="150" y="148" class="svg-copy" text-anchor="middle">review work and AI insights</text><rect x="360" y="48" width="260" height="115" rx="14" fill="#edf3fa" stroke="#7591b0"/><text x="490" y="80" class="svg-title" text-anchor="middle">Ascent company workspace</text><text x="490" y="108" class="svg-copy" text-anchor="middle">tenant scope + server RBAC</text><text x="490" y="128" class="svg-copy" text-anchor="middle">tasks, schedule, assessments,</text><text x="490" y="148" class="svg-copy" text-anchor="middle">forum, knowledge and analytics</text><rect x="700" y="48" width="260" height="115" rx="14" fill="#eef5ef" stroke="#77987d"/><text x="830" y="80" class="svg-title" text-anchor="middle">Employee</text><text x="830" y="108" class="svg-copy" text-anchor="middle">Complete assigned work, attend</text><text x="830" y="128" class="svg-copy" text-anchor="middle">sessions, submit assessments,</text><text x="830" y="148" class="svg-copy" text-anchor="middle">ask policy and onboarding questions</text><path d="M280 105 H358" stroke="#718096" stroke-width="2" marker-end="url(#arrow3)"/><path d="M620 105 H698" stroke="#718096" stroke-width="2" marker-end="url(#arrow3)"/><path d="M700 180 C545 205 350 205 280 180" fill="none" stroke="#718096" stroke-width="2" marker-end="url(#arrow3)"/><text x="490" y="204" class="svg-small" text-anchor="middle">Submissions and questions return to the manager through review and insight workflows.</text></svg><figcaption>Figure 3.3. Manager and employee demonstration workflow.</figcaption></figure>`;
const figureData = `<figure class="diagram" id="figure-data"><svg viewBox="0 0 940 220" role="img" aria-label="Company has users through memberships, memberships own profiles, employees receive tasks and assessments, and company owns schedule, forum, audit, and knowledge data"><defs><marker id="arrow4" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#718096"/></marker></defs><g fill="#edf3fa" stroke="#7591b0"><rect x="25" y="24" width="155" height="56" rx="10"/><rect x="255" y="24" width="190" height="56" rx="10"/><rect x="520" y="24" width="165" height="56" rx="10"/><rect x="755" y="24" width="160" height="56" rx="10"/></g><g class="svg-title" text-anchor="middle"><text x="102" y="58">Company</text><text x="350" y="58">Membership</text><text x="602" y="58">User / Profile</text><text x="835" y="58">Department</text></g><path d="M180 52 H253 M445 52 H518 M685 52 H753" stroke="#718096" stroke-width="2" marker-end="url(#arrow4)"/><g fill="#eef5ef" stroke="#77987d"><rect x="115" y="138" width="170" height="58" rx="10"/><rect x="385" y="138" width="170" height="58" rx="10"/><rect x="655" y="138" width="240" height="58" rx="10"/></g><g class="svg-title" text-anchor="middle"><text x="200" y="173">Task / Assignment</text><text x="470" y="173">Assessment / Submission</text><text x="775" y="173">Meeting / Forum / Knowledge / Audit</text></g><path d="M350 82 C350 118 200 105 200 136 M350 82 C350 118 470 105 470 136 M100 82 C100 117 775 102 775 136" fill="none" stroke="#718096" stroke-width="2" marker-end="url(#arrow4)"/></svg><figcaption>Figure 4.1. Simplified relational data model; detailed fields and relations are defined in Prisma.</figcaption></figure>`;
const figureResults = `<figure class="diagram" id="figure-results"><div class="result-grid"><div><strong>69</strong><span>tests executed</span></div><div><strong>69</strong><span>passed</span></div><div><strong>0</strong><span>failed</span></div><div><strong>3</strong><span>demo documents indexed</span></div><div><strong>3</strong><span>searchable chunks</span></div></div><figcaption>Figure 5.1. Verification summary for the current build.</figcaption></figure>`;

const diagramReplacements = {
  "<p>![Logical architecture](#figure-architecture)</p>": figureArchitecture,
  "<p>![Knowledge ingestion and retrieval flow](#figure-rag)</p>": figureRag,
  "<p>![Manager and employee demonstration flow](#figure-demo)</p>": figureDemo,
  "<p>![Simplified relational data model](#figure-data)</p>": figureData,
  "<p>![Verification summary](#figure-results)</p>": figureResults,
};
let body = mdToHtml(markdown);
for (const [placeholder, figure] of Object.entries(diagramReplacements)) body = body.replace(placeholder, figure);

const cover = `<section class="cover"><div class="cover-kicker">MAHARAJA AGRASEN INSTITUTE OF TECHNOLOGY</div><div class="cover-department">Department of Computer Science and Technology</div><div class="cover-mark">MINOR PROJECT REPORT</div><h1>Ascent</h1><h2>Role-Based Smart Employee Onboarding and Work Simulation Platform</h2><p class="cover-subtitle">Submitted in partial fulfillment of the requirements for the degree of</p><p class="degree">Bachelor of Technology<br>in Computer Science and Technology</p><div class="cover-columns"><div><span>Submitted by</span><p>[Student Name] ([Enrollment Number])</p><p>[Student Name] ([Enrollment Number])</p><p>[Student Name] ([Enrollment Number])</p></div><div><span>Project guide</span><p>[Project Guide Name]</p><p>[Designation]</p></div></div><div class="cover-footer"><p>Department of Computer Science and Technology</p><p>Maharaja Agrasen Institute of Technology, New Delhi</p><p>Academic Session 2026</p></div></section>`;
const certificate = `<section class="front-page"><div class="institution">MAHARAJA AGRASEN INSTITUTE OF TECHNOLOGY<br><span>Department of Computer Science and Technology</span></div><h1>Certificate</h1><p>This is to certify that the minor project report entitled <strong>“Ascent: Role-Based Smart Employee Onboarding and Work Simulation Platform”</strong> is submitted by the students named on the title page. The work was carried out under the guidance of the undersigned and is submitted in partial fulfillment of the requirements for the Bachelor of Technology degree in Computer Science and Technology.</p><p>The project report describes the design, implementation, and verification status of the Ascent employee onboarding platform.</p><div class="signature-row"><div><span>Project Guide</span><strong>[Project Guide Name]</strong><small>Signature and date</small></div><div><span>Head of Department</span><strong>[Head of Department]</strong><small>Signature and date</small></div></div><div class="signature-row single"><div><span>Place and date</span><strong>New Delhi, 2026</strong></div></div></section>`;
const abstract = `<section class="front-page"><h1>Abstract</h1><p>Employee onboarding requires coordination among company administrators, managers, and new employees. Policies, tasks, training, meetings, assessments, and questions are often spread across separate tools, making it difficult to maintain a consistent process and see where support is needed. Ascent is a multi-tenant web application that organizes these activities in company workspaces with role-based access.</p><p>The platform supports company membership, departments, training batches, task assignment and review, meeting schedules, worksheets, submissions, employee discussions, audit records, and performance analytics. Its AI layer uses the Gemini API for three advisory workflows: retrieval-grounded answers from company onboarding material, provisional grading suggestions for written assessment answers, and summaries of recurring forum questions. For the onboarding assistant, managers paste text into a company knowledge page; the server chunks the content, creates embeddings, stores them with the company identifier, retrieves relevant passages for an employee query, and sends those passages to a language model. Source titles are returned with the answer.</p><p>The implementation uses Next.js, React, TypeScript, Clerk, Prisma, and Neon PostgreSQL. The latest automated test run passed 69 of 69 tests. Three fictional company documents were successfully indexed as three searchable chunks in the Ascent Demo Workspace. The current version does not provide PDF upload and extraction, anonymous forum posting, or a separate scenario-simulation engine. These gaps and the limits of the verification are documented in this report.</p><p class="keywords"><strong>Keywords:</strong> employee onboarding, multi-tenant systems, role-based access control, retrieval-augmented generation, Gemini, performance analytics</p></section>`;
const acknowledgement = `<section class="front-page"><h1>Acknowledgement</h1><p>The project team expresses sincere gratitude to <strong>[Project Guide Name]</strong> for guidance and feedback during the design and development of this project. The team also acknowledges the faculty members and department for their academic support.</p><p>The team thanks the users and evaluators whose requirements informed the onboarding workflows, and the maintainers of the open-source frameworks and services used in the implementation.</p><p class="signature-note">Project Team<br>[Student Names]</p></section>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ascent Minor Project Report</title><style>
@page{size:A4;margin:20mm 19mm 20mm;@bottom-center{content:"Ascent | Page " counter(page);font:9pt Arial,sans-serif;color:#65748a}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:#202c3a;background:#fff;font:12pt/1.5 "Times New Roman",serif}a{color:#365e86;text-decoration:none}a:hover{text-decoration:underline}p{margin:0 0 10pt;text-align:justify;orphans:3;widows:3}h1,h2,h3{font-family:"Times New Roman",serif;color:#17324e;page-break-after:avoid}h1{font-size:23pt;line-height:1.2;margin:0 0 15pt}h2{font-size:15pt;line-height:1.25;margin:18pt 0 8pt}h3{font-size:11.5pt;margin:13pt 0 5pt}strong{color:#243d57}code{font:9pt Consolas,monospace;background:#f2f4f6;padding:1px 3px;border-radius:3px}.cover{height:257mm;display:flex;flex-direction:column;align-items:center;text-align:center;page-break-after:always;padding:12mm 7mm 4mm}.cover-kicker{font-size:13pt;letter-spacing:1.3px;font-weight:700;color:#1e344a}.cover-department{font-size:10pt;color:#56677a;margin-top:7pt}.cover-mark{margin-top:28mm;font-size:11pt;font-weight:700;letter-spacing:2px;color:#bf6544}.cover h1{font-size:40pt;letter-spacing:.5px;margin:7mm 0 2mm}.cover h2{font:18pt/1.32 Georgia,serif;max-width:150mm;margin:3mm auto 10mm;color:#233c57}.cover-subtitle{font-size:10pt;margin:2mm 0}.degree{font-family:Georgia,serif;font-size:13pt;text-align:center;line-height:1.5;margin:0}.cover-columns{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:18mm;text-align:left;margin-top:20mm;padding:0 12mm}.cover-columns span{font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#ba6749;font-weight:700}.cover-columns p{margin:6pt 0;text-align:left}.cover-footer{margin-top:auto;font-size:9pt;color:#5c6876}.cover-footer p{text-align:center;margin:3pt}.front-page{min-height:245mm;page-break-after:always;padding-top:8mm}.institution{text-align:center;font-weight:700;letter-spacing:.6px;line-height:1.7;margin:0 0 24mm}.institution span{font-size:9.5pt;font-weight:400;letter-spacing:0}.signature-row{display:flex;justify-content:space-between;gap:20mm;margin:36mm 5mm 0}.signature-row.single{margin-top:20mm}.signature-row div{display:flex;flex-direction:column;min-width:55mm;gap:5pt}.signature-row span,.signature-row small{font-size:9pt;color:#68778a}.signature-row strong{margin-top:18mm}.signature-note{margin-top:35mm;text-align:right;font-weight:700}.keywords{margin-top:18pt;font-size:9.5pt}.front-page h1{margin-bottom:22pt}.front-page > p{font-size:11pt;line-height:1.75;margin-bottom:14pt}.front-page .keywords{font-size:9.5pt}.toc{page-break-after:always}.toc h1{margin-bottom:17pt}.toc ul{list-style:none;padding:0;columns:2;column-gap:12mm}.toc li{margin:0 0 7pt;break-inside:avoid;font-size:9.5pt}.toc li a{color:#263d55}.toc li:first-child,.toc li:nth-child(2),.toc li:nth-child(3){font-weight:700}.content h1{font-size:22pt;border-bottom:0;margin-top:0}.content h1:not(:first-child){page-break-before:always;padding-top:4mm}.content h2{page-break-after:avoid}.content h3{page-break-after:avoid}ul,ol{margin:2pt 0 11pt;padding-left:22pt}li{margin:0 0 4pt}.table-wrap{margin:9pt 0 14pt;overflow:visible}table{border-collapse:collapse;width:100%;font-size:8.7pt;line-height:1.35;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid}th{background:#17324e;color:white;text-align:left;font-weight:700;padding:7pt 7pt;border:1px solid #17324e}td{padding:6pt 7pt;border:1px solid #d4dbe2;vertical-align:top}tbody tr:nth-child(even){background:#f5f7f9}figure{margin:14pt 0 17pt;page-break-inside:avoid}figure.diagram svg{display:block;width:100%;height:auto;background:#fbfcfd;border:1px solid #e1e6eb;border-radius:8px;padding:8pt}figcaption{text-align:center;font-size:8.5pt;color:#66758a;margin-top:5pt}.svg-title{font:700 15px Arial,sans-serif;fill:#18324c}.svg-copy{font:12px Arial,sans-serif;fill:#425466}.svg-small{font:11px Arial,sans-serif;fill:#65748a}.result-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7pt}.result-grid div{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:74pt;border:1px solid #d5dee7;background:#f3f6f9;border-radius:8px;padding:8pt}.result-grid strong{font:26pt Georgia,serif;color:#17324e}.result-grid span{font-size:8pt;text-align:center;color:#596a7a}.content > p:first-child{margin-top:0}.content h1[id="chapter-1-introduction"],.content h1[id="chapter-2-literature-survey"],.content h1[id="chapter-3-research-methodology-and-system-analysis"],.content h1[id="chapter-4-system-design-and-implementation"],.content h1[id="chapter-5-results-and-discussion"],.content h1[id="chapter-6-conclusion-summary-and-future-scope"],.content h1[id="chapter-7-references"]{margin-top:0}.content #table-of-contents{page-break-before:always}.content #list-of-tables,.content #list-of-figures,.content #symbols-abbreviations-and-nomenclature{page-break-before:always}.content #chapter-1-introduction{page-break-before:always}.content h2[id="appendix-a-important-project-files"]{page-break-before:always}.source-note{color:#6b7785;font-size:8.5pt}
</style></head><body>${cover}${certificate}${abstract}${acknowledgement}<section class="front-page toc"><h1>Table of Contents</h1><div class="toc-body"></div></section><main class="content">${body}</main><script>const pageNumbers=${JSON.stringify(tocPageMap)};const toc=document.querySelector('.toc-body');const links=[...document.querySelectorAll('.content h1[id],.content h2[id]')].map(h=>({id:h.id,text:h.textContent,level:h.tagName==='H1'?1:2}));const table=document.createElement('table');table.className='toc-table';table.innerHTML='<thead><tr><th class="toc-num">S. No.</th><th>Contents</th><th class="toc-page">Page No.</th></tr></thead><tbody></tbody>';const rows=table.querySelector('tbody');for(const item of links){const tr=document.createElement('tr');if(item.level===1)tr.className='toc-chapter';const prefix=item.text.match(/^(Chapter\s+\d+|Appendix\s+[A-Z]|\d+(?:\.\d+)?)/i);const num=document.createElement('td');num.className='toc-num';num.textContent=prefix?prefix[0]:'';const title=document.createElement('td');title.className='toc-title';const a=document.createElement('a');a.href='#'+item.id;a.textContent=item.text;title.appendChild(a);const page=document.createElement('td');page.className='toc-page';page.textContent=pageNumbers[item.id]||'';tr.append(num,title,page);rows.appendChild(tr);}toc.appendChild(table);</script></body></html>`;

const finalHtml = html.replace("</style>", ".toc{padding-top:0}.toc h1{margin-bottom:8pt}.toc-table{font-size:9.2pt;line-height:1.18}.toc-table td{padding:3pt 6pt;border:0}.toc-table th{background:#fff;color:#222;border:0;border-bottom:1px solid #222;padding:4pt;text-transform:uppercase;font-size:8.8pt}.toc-num{width:24mm;white-space:nowrap}.toc-page{text-align:right;width:18mm;white-space:nowrap}.toc-table tr.toc-chapter td{font-weight:700;padding-top:6pt}.toc-table a{color:#222}.code-figure{margin:10pt 0;page-break-inside:avoid}.code-figure pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f6f8;border-left:3px solid #bf6544;padding:8pt;font:8pt/1.35 Consolas,monospace;color:#202c3a}.content h2[id=\"appendix-a-important-project-files\"]{page-break-before:always}</style>");
fs.writeFileSync(path.join(reportDir, "Ascent_Minor_Project_Report.html"), finalHtml, "utf8");
console.log(path.join(reportDir, "Ascent_Minor_Project_Report.html"));
