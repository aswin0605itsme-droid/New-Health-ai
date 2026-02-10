import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { AnalysisResult, MapResult } from "../types";

// Initialize Gemini Client with standard Legacy SDK
// Ensure VITE_GEMINI_API_KEY is set in your environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("API Key is missing! Make sure VITE_GEMINI_API_KEY is set in .env");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Analyzes a medical lab report image using Gemini 1.5 Pro.
 */
export const analyzeLabReport = async (
  base64Image: string, 
  mimeType: string
): Promise<AnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: "You are a helpful and knowledgeable medical AI assistant. Analyze the provided lab report."
    });

    const prompt = `Analyze this medical lab report image.
            
    **STRICT FORMATTING RULE**: Do NOT use paragraphs. Use ONLY bullet points for all explanations.

    1. **Key Biomarkers**:
       - List key values.
       - Compare them to standard ranges.
    
    2. **Abnormalities**:
       - Highlight values outside the normal range (High/Low).
    
    3. **Interpretation**:
       - Explain what these results indicate in simple terms.
    
    4. **🩺 Tailored Health Action Plan**:
       - 🥗 **Diet**: Specific foods to include/avoid.
       - 🏃 **Lifestyle**: Activity suggestions.
       - 📅 **Follow-up**: Re-testing recommendations.
       
    5. **📋 Summary Table**:
       - Create a markdown table: [Test Name, Value, Status, Recommended Action].
    
    Be professional, empathetic, and reassuring. Always advise consulting a doctor.`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return {
      text: text || "I couldn't analyze the document. Please try again with a clearer image.",
    };
  } catch (error) {
    console.error("Error analyzing report:", error);
    throw error;
  }
};

/**
 * Starts a chat session about the lab report.
 */
export const createChatSession = (base64Image: string, mimeType: string): ChatSession => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: "You are a helpful and knowledgeable medical AI assistant. You have access to the user's lab report. Answer their follow-up questions clearly and safely using strictly bullet points. Do NOT use paragraphs. Do not provide medical diagnoses or prescriptions. Always encourage seeing a professional."
  });

  return model.startChat({
    history: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Here is my lab report. Please be ready to answer questions about it."
          }
        ]
      },
      {
        role: 'model',
        parts: [
          {
            text: "I have reviewed your lab report. I'm ready to answer your questions about the values, what they mean, and general health advice."
          }
        ]
      }
    ]
  });
};

/**
 * Sends a message to the active chat session.
 */
export const sendChatMessage = async (chat: ChatSession, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text() || "I didn't understand that.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};

/**
 * Finds nearest medical center and generates a route description.
 * Note: Legacy SDK doesn't natively support the Google Maps tool as easily as the new SDK.
 * We will use text generation to guide the user and provide a static map link.
 */
export const findMedicalCenter = async (latitude: number, longitude: number): Promise<MapResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `I am at latitude: ${latitude}, longitude: ${longitude}. 
    Find a general medical center or hospital that would be typically nearest to these coordinates (simulate a search based on location data). 
    Provide the name and address. 
    Then, generate a fun, text-based emoji route description (e.g., Turn left ⬅️, Go straight 🚗) from my location to there. Keep the route concise.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Since we don't have the grounded Maps tool in this legacy SDK version easily, 
    // we return the text guidance and no dynamic grounding chunks.
    // The UI will handle the fallback map display.
    return {
      text: text || "I couldn't find a medical center nearby.",
      chunks: [],
    };
  } catch (error) {
    console.error("Map error:", error);
    throw error;
  }
};