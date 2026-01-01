
import { GoogleGenAI, Type } from "@google/genai";

// Create a new instance inside each call to ensure fresh configuration
export const analyzeTransaction = async (description: string, accounts: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex accounting reasoning and PGC mapping
      model: "gemini-3-pro-preview",
      contents: `Com base no PGC (Plano Geral de Contabilidade) de Angola e nesta lista de contas: ${accounts.join(', ')}, sugira a conta de débito e crédito mais adequada para esta transação: "${description}". Responda apenas com o código da conta e uma breve explicação em português.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            debitCode: { type: Type.STRING },
            creditCode: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["debitCode", "creditCode", "explanation"]
        }
      }
    });
    
    // Access response.text property directly
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
};

export const getFinancialAdvice = async (financialSummary: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex financial consultancy
      model: "gemini-3-pro-preview",
      contents: `Atue como um consultor financeiro sênior em Angola. Analise estes dados financeiros (Balanço/DR): ${financialSummary}. Forneça 3 sugestões estratégicas baseadas na realidade econômica de Angola (ex: inflação, impostos AGT, gestão de tesouraria). Responda em formato de lista Markdown.`,
    });
    // Access response.text property directly
    return response.text || "Não foi possível gerar conselhos financeiros no momento.";
  } catch (error) {
    console.error("Advice error:", error);
    return "Não foi possível gerar conselhos financeiros no momento.";
  }
};
