// services/api.ts

export interface AnalysisRequest {
  history: string;
  examination: string;
  files: File[];
  audioBlob: Blob | null;
  apiKey: string;
  model: string; // e.g., gemini-2.5-pro or gemini-2.5-flash
  donateData: boolean;
}

export interface AnalysisResponse {
  analysis: string;
  decisionMaking: string;
  managementPlan: string;
}

// Convert File/Blob to Base64 for the Gemini API
const fileToGenerativePart = async (file: File | Blob, mimeType: string): Promise<{inlineData: {data: string, mimeType: string}}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64DataOnly = base64data.split(',')[1];
      resolve({
        inlineData: {
          data: base64DataOnly,
          mimeType
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const runIntegratedAnalysis = async (request: AnalysisRequest): Promise<string> => {
  if (!request.apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  // 1. Construct prompt
  let promptText = `You are a highly advanced Multi-Modal Diagnostic Co-Pilot Medical AI.
Your task is to analyze the provided clinical data (History, Examination, Diagnostics, Scans, Audio constraints) and output a structured, integrated clinical report using Markdown.
Format your output with the following major sections exactly (using ## headings): 
## Integrated Analysis
## Decision Making
## Management & Treatment Plan

`;

  if (request.history.trim()) {
    promptText += `### History:\n${request.history}\n\n`;
  }
  if (request.examination.trim()) {
    promptText += `### Examination:\n${request.examination}\n\n`;
  }

  // 2. Prepare parts array for Gemini
  const parts: any[] = [{ text: promptText }];

  // Prepare images/pdfs
  for (const file of request.files) {
    const part = await fileToGenerativePart(file, file.type);
    parts.push(part);
  }

  // Prepare audio
  if (request.audioBlob) {
    const part = await fileToGenerativePart(request.audioBlob, request.audioBlob.type);
    parts.push(part);
  }

  // 3. Optional: Simulate Data Donation Pipeline (Log to console/backend for continuous code model training)
  if (request.donateData) {
    console.log("[Continuous Learning Model]: Archiving anonymized query for next-gen model training pipeline.", {
      historyLength: request.history.length,
      examLength: request.examination.length,
      fileCount: request.files.length,
      audioAttached: !!request.audioBlob
    });
    // In a real production app, this would be a POST to your data lake API endpoint
  }

  // 4. Call Gemini API endpoint
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`;
  
  const payload = {
    contents: [
      {
        role: "user",
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.2, // Low temp for clinical reliability
      maxOutputTokens: 2048,
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errParts = await response.json();
      throw new Error(errParts.error?.message || "Failed to fetch from LLM API");
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No response generated.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
       throw new Error("Network error or CORS issue. Try using a proxy or ensure API key is valid.");
    }
    throw error;
  }
};
