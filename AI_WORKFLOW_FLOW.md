# Ascent AI Workflow Flow

This document describes the implemented company knowledge assistant and manager AI tools.

## 1. Add company onboarding material

Company admins and managers can add source material at **Dashboard > Knowledge Base**.

```mermaid
flowchart TD
    A[Company Admin or Manager signs in] --> B[Open Knowledge Base]
    B --> C[Enter document title and paste text]
    C --> D{Title and text valid?}
    D -- No --> E[Show validation error]
    D -- Yes --> F[Server checks role and active company]
    F --> G[Split text into chunks up to 1200 characters]
    G --> H[Gemini embedding API creates an embedding per chunk]
    H --> I[(PostgreSQL: CompanyKnowledgeDocument)]
    I --> J[Material appears in indexed documents list]
```

**Input details:** the title must contain at least 3 characters; pasted text must contain 30 to 50,000 characters. The app splits material into chunks and limits embedding requests to batches of four. Each chunk stores its title, text, embedding, company ID, and creator membership ID. Records are scoped to the active company.

**Current limitation:** material is pasted as text; PDF or Word upload and automatic document extraction are not included.

## 2. Employee asks the onboarding assistant

```mermaid
flowchart TD
    A[Employee signs in] --> B[Open AI Onboarding Help]
    B --> C[Enter a question]
    C --> D[Server checks active company and question]
    D --> E[Create question embedding with Gemini]
    E --> F[Load that company's knowledge chunks]
    F --> G[Rank chunks with cosine similarity]
    G --> H[Select the four closest chunks]
    H --> I[Send question and retrieved source text to Gemini]
    I --> J[Generate answer grounded in supplied material]
    J --> K[Show answer and source titles]
```

The assistant is instructed to use only retrieved company material, say when it cannot find an answer, and avoid giving away practice assessment answers. If the company has not added material, the app asks the employee to contact their manager. Gemini output is advisory and can still be wrong, so the response includes a reminder to verify it against the source or with a manager.

## 3. Manager gets written-answer grading suggestions

```mermaid
flowchart TD
    A[Manager opens Assessments] --> B[Open a submitted assessment]
    B --> C[Choose Suggest written-answer grades]
    C --> D[Server verifies company and direct-report scope]
    D --> E[Send written questions, rubrics, and answers to Gemini]
    E --> F[Receive provisional marks and feedback]
    F --> G[Clamp marks to each question's maximum]
    G --> H[Populate editable evaluation form]
    H --> I{Manager reviews and chooses next step}
    I -- Edit or save draft --> J[Manager saves draft]
    I -- Release --> K[Manager releases evaluation]
```

Only short-answer and long-answer responses are sent for suggestions. Suggestions are not saved or released automatically. Managers must review them; they can edit every score and comment before saving or releasing.

## 4. Manager reviews recurring forum questions

```mermaid
flowchart TD
    A[Manager opens Analytics and Rankings] --> B[Choose Analyze questions]
    B --> C[Server verifies manager or company-admin role]
    C --> D[Load recent open and answered forum threads]
    D --> E{Caller is a manager?}
    E -- Yes --> F[Limit threads to direct reports]
    E -- No, company admin --> G[Use company-scoped threads]
    F --> H[Send thread text without author identity to Gemini]
    G --> H
    H --> I[Group recurring topics and draft follow-ups]
    I --> J[Show themes, counts, summaries, and suggestions]
```

Analysis covers up to 100 recent open or answered threads. It excludes employee names and emails from the prompt. Results are suggestions for managers, not saved decisions.

## Architecture overview

```mermaid
flowchart LR
    subgraph Browser
      A[Knowledge Base form]
      B[Employee assistant]
      C[Assessment evaluation dialog]
      D[Manager analytics]
    end

    subgraph Next.js server
      E[Clerk identity and active company context]
      F[Role checks and server actions]
      G[Knowledge chunking and retrieval]
      H[Prompt construction and response validation]
    end

    subgraph Services
      I[(PostgreSQL via Prisma)]
      J[Gemini embedding API]
      K[Gemini generation API]
    end

    A --> E --> F --> G --> J
    J --> G --> I
    B --> E --> F --> G --> I
    G --> J
    G --> H --> K --> B
    C --> E --> F --> I --> H --> K
    K --> C
    D --> E --> F --> I --> H --> K
    K --> D
```

## To run these flows

1. Set `GEMINI_API_KEY` in `.env`.
2. Make sure the PostgreSQL database is reachable.
3. Apply the Prisma schema with `npx prisma db push` if the knowledge table has not been created.
4. Start the app with `npm run dev`.
5. Add company material, then ask an employee question to exercise the retrieval flow.

Relevant implementation: `src/lib/ai/gemini.ts`, `src/app/dashboard/company/knowledge/`, `src/app/dashboard/assistant/`, `src/app/dashboard/assessments/actions.ts`, and `src/app/dashboard/analytics/`.
