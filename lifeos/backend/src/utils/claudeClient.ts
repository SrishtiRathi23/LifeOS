import Tesseract from "tesseract.js";

export async function parseNotebookImage(filePath: string, mimeType: string, base64Data: string) {
  const ocr = await Tesseract.recognize(filePath, "eng");
  
  // Clean and structure tasks
  const lines = ocr.data.text
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
    notes: ocr.data.text.trim(),
    exams: []
  };
}

export async function reflectOnDiaryEntry(entry: string, name: string) {
  const lower = entry.toLowerCase();
  
  // Rule-based daily reflection templates
  if (lower.includes("sad") || lower.includes("hard") || lower.includes("tired") || lower.includes("stressed")) {
    return `I can hear that things felt a bit heavy, ${name}. It's perfectly okay to feel tired and take a step back. Your persistence matters more than immediate perfection.`;
  } else if (lower.includes("happy") || lower.includes("excited") || lower.includes("win") || lower.includes("finished")) {
    return `That sounds like a productive and positive day, ${name}! Celebrate those wins, both big and small. You're building incredible momentum!`;
  }
  
  return `You showed up honestly today, ${name}, and that matters more than having a perfect day. There is real effort in your words, and even the unfinished parts still count as progress you can build on tomorrow.`;
}
