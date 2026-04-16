import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./env.js";

export async function parseNotebookImage(filePath: string, mimeType: string, base64Data: string) {
  let text = "";

  console.log("Gemini API Key configured:", config.geminiApiKey ? "Yes (length: " + config.geminiApiKey.length + ")" : "No");

  // Try Gemini API first (if key is provided) for better handwriting recognition
  if (config.geminiApiKey && config.geminiApiKey.trim() !== "") {
    try {
      console.log("Attempting Gemini OCR...");
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Convert base64 to buffer and create image part
      const imageBuffer = Buffer.from(base64Data, "base64");
      const base64Image = imageBuffer.toString("base64");

      console.log("Sending image to Gemini (size:", base64Image.length, "bytes)");

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        "Extract all handwritten text from this image. Return ONLY the raw text content, one item per line. Do not add any formatting, explanations, or extra characters. Just the text as written."
      ]);

      text = result.response.text().trim();
      console.log("Gemini OCR result:", text);
    } catch (error) {
      console.error("Gemini OCR failed, falling back to Tesseract:", error);
      // Fall back to Tesseract
    }
  }

  // Fallback to Tesseract if no Gemini key or if Gemini failed
  if (!text || text.length === 0) {
    const ocr = await Tesseract.recognize(filePath, "eng");
    text = ocr.data.text;
    console.log("Tesseract OCR result:", text);
  }

  // Clean and structure tasks
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-*[\]\d.\s]+/, "").trim())
    .filter(Boolean);

  const tasks = lines.slice(0, 15).map((line) => {
    let priority: "high" | "medium" | "low" = "low";
    let category = "other";
    const lower = line.toLowerCase();

    // 100% free rule-based basic logic mapping
    if (lower.includes("exam") || lower.includes("test")) {
      priority = "high";
      category = "college";
    } else if (lower.includes("hackathon")) {
      priority = "high";
      category = "learning";
    } else if (lower.includes("assignment") || lower.includes("homework")) {
      priority = "medium";
      category = "college";
    } else if (lower.includes("internship")) {
      priority = "medium";
      category = "career";
    }

    return { title: line, deadline: null, category, priority };
  });

  // Sort by priority map (exams = 1, hackathon = 2, assignments = 3, etc)
  tasks.sort((a, b) => {
    const scoreA = a.priority === "high" ? 1 : a.priority === "medium" ? 2 : 3;
    const scoreB = b.priority === "high" ? 1 : b.priority === "medium" ? 2 : 3;
    return scoreA - scoreB;
  });

  return {
    tasks,
    ideas: [],
    notes: text.trim(),
    exams: []
  };
}

export async function reflectOnDiaryEntry(entry: string, name: string) {
  // Try Gemini for reflection if key is available
  if (config.geminiApiKey && config.geminiApiKey.trim() !== "") {
    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(
        `You are a supportive journal companion. The user's name is ${name}.
        Here's their diary entry: "${entry}"
        Write a brief, warm, supportive 1-2 sentence reflection. Be empathetic and encouraging.`
      );

      return result.response.text().trim();
    } catch (error) {
      console.error("Gemini reflection failed, using fallback:", error);
    }
  }

  // Fallback to rule-based reflection
  const lower = entry.toLowerCase();

  if (lower.includes("sad") || lower.includes("hard") || lower.includes("tired") || lower.includes("stressed")) {
    return `I can hear that things felt a bit heavy, ${name}. It's perfectly okay to feel tired and take a step back. Your persistence matters more than immediate perfection.`;
  } else if (lower.includes("happy") || lower.includes("excited") || lower.includes("win") || lower.includes("finished")) {
    return `That sounds like a productive and positive day, ${name}! Celebrate those wins, both big and small. You're building incredible momentum!`;
  }

  return `You showed up honestly today, ${name}, and that matters more than having a perfect day. There is real effort in your words, and even the unfinished parts still count as progress you can build on tomorrow.`;
}
