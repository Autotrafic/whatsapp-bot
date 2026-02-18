type EvolutionFindMessagesResponse = {
  messages?: {
    total: number;
    pages: number;
    currentPage: number;
    records: Array<{
      id: string;
      key?: {
        id?: string;
        fromMe?: boolean;
        remoteJid?: string;
      };
      pushName?: string;
      messageType?: string;
      message?: {
        conversation?: string;
        extendedTextMessage?: { text?: string };
        imageMessage?: { caption?: string };
        videoMessage?: { caption?: string };
        documentMessage?: { caption?: string };
      };
      messageTimestamp?: number;
    }>;
  };
};
