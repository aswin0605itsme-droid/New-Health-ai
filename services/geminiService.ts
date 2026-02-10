import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, MapResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a medical lab report image using Gemini 3 Pro with Thinking Mode.
 */
export const analyzeLabReport = async (
  base64Image: string, 
  mimeType: string
): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this medical lab report image.
            
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
            
            Be professional, empathetic, and reassuring. Always advise consulting a doctor.`
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for deep analysis
      },
    });

    return {
      text: response.text || "I couldn't analyze the document. Please try again with a clearer image.",
    };
  } catch (error) {
    console.error("Error analyzing report:", error);
    throw error;
  }
};

/**
 * Starts a chat session about the lab report.
 */
export const createChatSession = (base64Image: string, mimeType: string): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a helpful and knowledgeable medical AI assistant. You have access to the user's lab report. Answer their follow-up questions clearly and safely using strictly bullet points. Do NOT use paragraphs. Do not provide medical diagnoses or prescriptions. Always encourage seeing a professional.",
    },
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
export const sendChatMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response = await chat.sendMessage({ message });
    return response.text || "I didn't understand that.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};

/**
 * Finds nearest medical center and generates a route description using Gemini 2.5 Flash + Google Maps Tool.
 */
export const findMedicalCenter = async (latitude: number, longitude: number): Promise<MapResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the nearest medical center or hospital to my current location. Provide the name and address. Then, generate a fun, text-based emoji route description (e.g., Turn left ⬅️, Go straight 🚗) from my location to there. Keep the route concise.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude
            }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return {
      text: response.text || "I couldn't find a medical center nearby.",
      chunks: chunks as any,
    };
  } catch (error) {
    console.error("Map error:", error);
    throw error;
  }
};