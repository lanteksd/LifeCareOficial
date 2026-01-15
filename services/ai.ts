
import { GoogleGenAI } from "@google/genai";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Inicializa a IA com a chave da API do ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Envia um prompt para a Gemini e salva a resposta no histórico do usuário no Firestore.
 * @param prompt Pergunta ou comando para a IA
 * @param uid ID do usuário logado (Firebase Auth UID)
 */
export async function salvarRespostaIA(prompt: string, uid: string) {
  try {
    // Gera o conteúdo usando o modelo flash (mais rápido e eficiente)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const textResponse = response.text;

    if (!textResponse) {
      throw new Error("Não foi possível gerar uma resposta.");
    }

    // Salva no Firestore no caminho especificado: users/{uid}/historico/ia_response
    // Nota: setDoc sobrescreve o documento se o ID for fixo ("ia_response"). 
    // Se desejar histórico acumulativo, considere usar addDoc ou IDs baseados em timestamp.
    await setDoc(doc(db, "users", uid, "historico", "ia_response"), {
      pergunta: prompt,
      resposta: textResponse,
      data: new Date().toISOString()
    });
    
    return textResponse;
  } catch (error) {
    console.error("Erro ao processar e salvar resposta da IA:", error);
    throw error;
  }
}
