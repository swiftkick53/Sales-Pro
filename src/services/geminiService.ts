
import { GoogleGenAI } from "@google/genai";

export async function analyzeLeadImage(base64Image: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Analyze this image of a tradesperson's profile, website, or social media. 
    Provide 3 high-impact "Sales Hooks" or "Pain Points" that a HomeStars sales rep can use to build rapport or highlight a need for HomeStars verification.
    Focus on things like:
    - Missing reviews or low rating
    - Unprofessional branding
    - Lack of clear "Verified" status
    - Missed opportunities for high-end work
    - Visual quality of previous work
    
    Format the output as a bulleted list of 3 items. Be concise and persuasive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
    });

    return response.text || "Unable to analyze image. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI analysis failed. Check your API configuration.";
  }
}

export async function getObjectionOvercome(objection: string, stage: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `
    You are the "Maple Syrup Millionaires" Sales Assistant. Your philosophy is built on consultative selling, high-value positioning, and the "Winning Formula" for HomeStars.
    
    STRICT RULES:
    1. Provide ONLY the overcomes. 
    2. NO intro, NO conversational filler, NO outro (e.g., don't say "Here is a script" or "Good luck").
    3. Use direct, punchy, consultative language.
    4. Focus on the Upfront Contract, Value over Price, and the "Verified" status.

    Task: Overcome the following objection at the "${stage}" stage.
    Objection: "${objection}"
    
    Structure:
    - **The Pivot**: [1 sentence acknowledgment/redirect]
    - **The Script**: "[Exact word-for-word script]"
    - **The Next Question**: [Question to regain control]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate the overcome now.",
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini Objection Error:", error);
    const msg = error?.message || String(error);
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return "Rate limit hit. Wait 30-60 seconds and try again.";
    }
    if (!process.env.API_KEY || process.env.API_KEY === '') {
      return "API key missing. Check your .env.local configuration.";
    }
    return "Coach unavailable. Revert to ROI math.";
  }
}
