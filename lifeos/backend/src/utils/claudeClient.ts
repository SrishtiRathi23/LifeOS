import Anthropic from "@anthropic-ai/sdk";
import Tesseract from "tesseract.js";
import { env } from "./env.js";

const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const NOTEBOOK_PROMPT = `You are a task parser. The user has uploaded a photo of their handwritten notebook or to-do list.
Extract all tasks, deadlines, assignment names, exam dates, ideas, and notes visible in the image.
Return ONLY valid JSON in this exact format:
{
  "tasks": [{ "title": "string", "deadline": "string|null", "category": "string", "priority": "high|medium|low" }],
  "ideas": ["string"],
  "notes": "string",
  "exams": [{ "subject": "string", "date": "string" }]
}
Categories: college, personal, learning, health, finance, other.
For dates, use ISO format if possible, otherwise keep original text.`;

export async function parseNotebookImage(filePath: string, mimeType: string, base64Data: string) {
  if (anthropic) {
    const mediaType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
      ? (mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif")
      : "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: NOTEBOOK_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data
              }
            },
            {
              type: "text",
              text: "Parse this notebook page and return JSON only."
            }
          ]
        }
      ]
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return JSON.parse(textBlock?.text ?? "{}");
  }

  const ocr = await Tesseract.recognize(filePath, "eng");
  const lines = ocr.data.text.split("\n").map((line) => line.trim()).filter(Boolean);

  return {
    tasks: lines.slice(0, 12).map((line) => ({
      title: line.replace(/^[-*[\]\d.\s]+/, "").trim(),
      deadline: null,
      category: "other",
      priority: "medium"
    })),
    ideas: [],
    notes: ocr.data.text.trim(),
    exams: []
  };
}

export async function reflectOnDiaryEntry(entry: string, name: string) {
  if (anthropic) {
    const prompt = `You are a kind, warm journaling companion for a college student named ${name}.
Read their diary entry and write a short, genuine 2-3 sentence reflection.
Be encouraging but honest. Notice patterns, celebrate small wins, gently acknowledge struggles.
Sound like a wise supportive friend, not a therapist. Keep it under 80 words.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 180,
      system: prompt,
      messages: [{ role: "user", content: entry }]
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text?.trim() ?? "";
  }

  return "You showed up honestly today, and that matters more than having a perfect day. There is real effort in your words, and even the unfinished parts still count as progress you can build on tomorrow.";
}
