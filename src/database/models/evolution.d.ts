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

export interface EvolutionWebhook {
  event: string;
  instance: string;
  data: EvolutionMessage;
  destination?: string;
  date_time?: string;
  sender?: string;
  server_url?: string;
  apikey?: string;
}

export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participantAlt?: string;
  };

  pushName?: string;

  message?: {
    conversation?: string;

    extendedTextMessage?: {
      text: string;
    };

    imageMessage?: {
      caption?: string;
      mimetype?: string;
      url?: string;
    };

    videoMessage?: {
      caption?: string;
      mimetype?: string;
      url?: string;
      ptt?: boolean;
    };

    audioMessage?: {
      mimetype?: string;
      seconds?: number;
      ptt?: boolean;
      url?: string;
    };

    documentMessage?: {
      fileName?: string;
      mimetype?: string;
      url?: string;
    };
  };

  messageType?: string;
  messageTimestamp?: number;
  owner?: string;
  source?: string;
}