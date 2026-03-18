import axios, { AxiosInstance } from 'axios';
import { extractConversationText } from '../server/helpers/funcs';

export const EVOLUTION_API = 'http://n8n-evolution-api.kt2mnn.easypanel.host/';
export const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
export const EVOLUTION_INSTANCE_KEY = '81AD499C570C-4A86-8A40-DEA3678AC514';
export const EVOLUTION_INSTANCE_NAME = 'AutoTrafic';

const evolutionClient: AxiosInstance = axios.create({
  baseURL: EVOLUTION_API,
  headers: {
    'Content-Type': 'application/json',
    apikey: EVOLUTION_API_KEY,
  },
  timeout: 30000,
});

export async function evolutionRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
): Promise<T> {
  try {
    const response = await evolutionClient.request<T>({
      url: endpoint,
      method,
      data,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Evolution API error:', error?.response?.data || error);
    throw new Error('Evolution API request failed');
  }
}

export function isSystemOrEmptyEvolutionRecord(
  record: EvolutionFindMessagesResponse["messages"]["records"][number]
): boolean {
  const text = extractConversationText(record).trim();
  return text.length === 0;
}

export function extractText(record: EvolutionFindMessagesResponse["messages"]["records"][number]): string {
  return (
    record?.message?.conversation ??
    record?.message?.extendedTextMessage?.text ??
    record?.message?.imageMessage?.caption ??
    record?.message?.videoMessage?.caption ??
    record?.message?.documentMessage?.caption ??
    ""
  );
}