"use server";

import { revalidatePath } from "next/cache";
import { CompanyRole } from "@prisma/client";
import { db } from "@/lib/db";
import { enforceRole, requireActiveCompanyContext } from "@/lib/auth";
import { embedText, generateText, splitIntoChunks, cosineSimilarity } from "@/lib/ai/gemini";

export async function addKnowledgeDocumentAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN, CompanyRole.MANAGER]);
  const title = String(formData.get("title") || "").trim().slice(0, 160);
  const content = String(formData.get("content") || "").trim();
  if (title.length < 3 || content.length < 30 || content.length > 50000) {
    return { error: "Enter a title and material between 30 and 50,000 characters." };
  }

  try {
    const chunks = splitIntoChunks(content);
    const embeddings: number[][] = [];
    for (let start = 0; start < chunks.length; start += 4) {
      embeddings.push(...await Promise.all(
        chunks.slice(start, start + 4).map((chunk) => embedText(`${title}\n${chunk}`)),
      ));
    }
    await db.$transaction(chunks.map((chunk, index) => db.companyKnowledgeDocument.create({
      data: {
        companyId: context.company!.id,
        creatorMembershipId: context.membership!.id,
        title,
        content: chunk,
        embedding: embeddings[index],
      },
    })));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not index this material." };
  }

  revalidatePath("/dashboard/company/knowledge");
  return { success: true };
}

export async function deleteKnowledgeDocumentAction(title: string) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN, CompanyRole.MANAGER]);
  await db.companyKnowledgeDocument.deleteMany({ where: { companyId: context.company!.id, title } });
  revalidatePath("/dashboard/company/knowledge");
  return { success: true };
}

export async function askOnboardingAssistantAction(question: string) {
  const context = await requireActiveCompanyContext();
  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length < 3 || trimmedQuestion.length > 1000) {
    return { error: "Enter a question between 3 and 1,000 characters." };
  }
  try {
    const documents = await db.companyKnowledgeDocument.findMany({
      where: { companyId: context.company!.id },
      select: { title: true, content: true, embedding: true },
    });
    if (!documents.length) return { error: "Your company has not added onboarding material yet." };
    const queryEmbedding = await embedText(trimmedQuestion);
    const matches = documents
      .map((document) => ({ ...document, score: cosineSimilarity(queryEmbedding, document.embedding as number[] || []) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    const sources = [...new Set(matches.map((match) => match.title))];
    const contextText = matches.map((match) => `SOURCE: ${match.title}\n${match.content}`).join("\n\n---\n\n");
    const answer = await generateText(
      `You are Ascent, an onboarding assistant for ${context.company!.name}. Answer using only the provided company material. If it does not contain the answer, say you could not find it and direct the employee to their manager. Do not invent policies or reveal answers to practice assessments. Keep the response concise.\n\nCOMPANY MATERIAL:\n${contextText}\n\nEMPLOYEE QUESTION:\n${trimmedQuestion}`,
    );
    return { answer, sources };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The assistant could not answer right now." };
  }
}
