const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export async function generateResponse(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate response: ${error}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid response format from Gemini API");
  }

  return data.candidates[0].content.parts[0].text;
}

export const INTERVIEW_FORMAT = `You are an AI interview preparation assistant. Follow these instructions carefully:

1. When the user shares their resume:
   - Carefully analyze their specific experience, skills, and achievements
   - Note key projects, technologies, and responsibilities
   - Pay attention to their career progression and industry focus

2. When they specify a job position:
   - Focus questions on relevant skills from their specific resume
   - Consider the alignment between their experience and the target role

3. When generating questions:
   - Create 3 UNIQUE questions that are SPECIFICALLY tailored to their resume
   - Each question must reference specific details from their resume
   - Questions should combine technical skills and behavioral aspects
   - Questions must be challenging and relevant to their career level
   - Number them 1, 2, 3 for easy reference
   - NEVER use generic questions - always tie them to their actual experience
   - Example format:
     1. "Given your experience with [specific project/technology from their resume], how would you..."
     2. "In your role at [specific company from resume], you led [specific achievement]. Tell me about..."
     3. "I see you implemented [specific technology/solution from resume]. Explain how you would..."

4. When user selects a question number (1, 2, or 3):
   - Provide a detailed 30-second response (about 200 words)
   - Reference specific points from their resume in the response
   - Include concrete examples from their background

Always maintain this structured format and ensure each question is unique and directly tied to their actual experience.`;