import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { Chat, GroupParticipant, Message, MessageMedia } from 'whatsapp-web.js';
import CustomError from '../../errors/CustomError';
import { whatsappClient } from '../../database/whatsapp';
import { parseChatFromPrimitive, parseMessageFromPrimitive, parsePhoneToRemoteJid } from '../helpers/parser';
import { MediaFile, SendMediaRequest } from '../interfaces/import';
import { cleanupFiles } from '../helpers/files';
import { extractConversationText, isSystemOrEmptyMessage } from '../helpers/funcs';
import {
  EVOLUTION_INSTANCE_NAME,
  evolutionRequest,
  extractText,
  isSystemOrEmptyEvolutionRecord,
} from '../../database/evolution';

export async function getPrimitiveChats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chats: any[] = await whatsappClient.getChats();

    if (!chats || chats.length === 0) {
      res.status(404).send({ message: 'No chats found.' });
    }

    res.send({ message: 'Chats retrieved successfully.', chats });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chats. \n ${error}`,
      `Error retrieving WhatsApp chats. \n ${error}`,
    );
    next(finalError);
  }
}

//************EVOLUTION */
export async function sendMessageToNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, message } = req.body;

  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('phoneNumber is required');
    }
    if (!message || typeof message !== 'string') {
      throw new Error('message is required');
    }

    const remoteJid = parsePhoneToRemoteJid(phoneNumber);

    // Evolution doesn't require checking if chat exists; just send.
    await evolutionRequest('POST', `/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`, {
      number: remoteJid,
      text: message,
      // optional:
      // delay: 1200,
      // linkPreview: false,
    });

    res.send({ message: 'Message sent successfully.' });
  } catch (error: any) {
    const finalError = new CustomError(
      500,
      'Error sending WhatsApp message.',
      `Error sending WhatsApp message. \n ${error?.message ?? String(error)}`,
    );
    next(finalError);
  }
}

export async function sendMessageToChat(req: SendMediaRequest, res: Response, next: NextFunction): Promise<void> {
  const body = { ...req.body };
  const files = req.files as Express.Multer.File[];
  const chatId = body.chatId;
  const message = body?.message;
  const quotedMessageId = body?.quotedMessageId;

  try {
    if ((!files || files.length === 0) && message) {
      await whatsappClient.sendMessage(chatId, message, { quotedMessageId });
      res.send({ message: `Message sent successfully.` });
      return;
    }

    const mediaFiles: MediaFile[] = files.map((file) => {
      const base64Data = fs.readFileSync(file.path, 'base64');

      return {
        filename: file.originalname,
        mimetype: file.mimetype,
        base64Data: base64Data,
      };
    });

    let isFirstFile = true;

    for (const file of mediaFiles) {
      const { base64Data, filename, mimetype } = file;

      let media: MessageMedia;

      if (base64Data && mimetype) {
        media = new MessageMedia(mimetype, base64Data, filename);
      } else {
        continue;
      }

      if (isFirstFile && message) {
        await whatsappClient.sendMessage(chatId, media, { caption: message, quotedMessageId });
        isFirstFile = false;
      } else {
        await whatsappClient.sendMessage(chatId, media, { quotedMessageId });
      }
    }

    cleanupFiles(files);

    res.send({ message: 'Message and media sent successfully!' });
  } catch (error) {
    console.error(error.message);
    const finalError = new CustomError(
      500,
      `Error sending WhatsApp message to a chat. \n ${error}`,
      `Error sending WhatsApp message to a chat. \n ${error}`,
    );
    next(finalError);
  }
}

export async function getChats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chats: any[] = await whatsappClient.getChats();

    if (!chats || chats.length === 0) {
      res.status(404).send({ message: 'No chats found.' });
    }

    const chatsWithProfileImages: WChat[] = await Promise.all(
      chats.map(async (chat) => {
        const parsedChat = await parseChatFromPrimitive(chat, whatsappClient);
        return parsedChat;
      }),
    );

    res.send({ message: 'Chats retrieved successfully.', chats: chatsWithProfileImages });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chats. \n ${error}`,
      `Error retrieving WhatsApp chats. \n ${error}`,
    );
    next(finalError);
  }
}

export async function getChatById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      res.status(400).send({ message: 'Chat ID is required.' });
      return;
    }

    const chat = await whatsappClient.getChatById(chatId);

    if (!chat) {
      res.status(404).send({ message: 'Chat not found.' });
      return;
    }

    const parsedChat = await parseChatFromPrimitive(chat, whatsappClient);

    res.send({ message: 'Chat retrieved successfully.', chat: parsedChat });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chat by ID. \n ${error}`,
      `Error retrieving WhatsApp chat by ID. \n ${error}`,
    );
    next(finalError);
  }
}

export async function getPrimitiveChatMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { chatId } = req.params;

  try {
    const chat = await whatsappClient.getChatById(chatId);

    if (!chat) {
      res.status(404).send({ message: `Chat with ID ${chatId} not found.` });
      return;
    }

    const messages: any[] = await chat.fetchMessages({ limit: 50 });

    res.send({ message: 'Messages retrieved successfully.', messages });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chat messages. \n ${error}`,
      `Error retrieving WhatsApp chat messages. \n ${error}`,
    );
    next(finalError);
  }
}

//************EVOLUTION */
export async function getChatMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { chatId } = req.params;

  try {
    if (!chatId) {
      res.status(400).send({ message: 'chatId is required.' });
      return;
    }

    const remoteJid = parsePhoneToRemoteJid(decodeURIComponent(chatId));

    const evo = await evolutionRequest<EvolutionFindMessagesResponse>(
      'POST',
      `/chat/findMessages/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`,
      {
        where: { key: { remoteJid } },
        page: 1,
        offset: 50,
      },
    );

    const records = evo?.messages?.records ?? [];

    // 👉 IMPORTANT CHANGE:
    // No messages = empty array (not an error)
    if (records.length === 0) {
      res.send({
        message: 'No messages found for this chat.',
        messages: [],
      });
      return;
    }

    const messages = records.map((r) => {
      const body = extractText(r);

      return {
        id: r?.id ?? r?.key?.id ?? null,
        body,
        type: r?.messageType ?? 'conversation',
        fromMe: Boolean(r?.key?.fromMe),
        from: r?.key?.fromMe ? 'me' : remoteJid,
        to: r?.key?.fromMe ? remoteJid : 'me',
        timestamp: r?.messageTimestamp ?? null,
        remoteJid,
        pushName: r?.pushName ?? null,
      };
    });

    res.send({
      message: 'Messages retrieved successfully.',
      messages,
    });
  } catch (error: any) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chat messages. \n ${error?.message ?? String(error)}`,
      `Error retrieving WhatsApp chat messages. \n ${error?.message ?? String(error)}`,
    );
    next(finalError);
  }
}

export async function sendSeenChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { chatId } = req.params;

  try {
    const chat = await whatsappClient.getChatById(chatId);

    if (!chat) {
      res.status(404).send({ message: `Chat with ID ${chatId} not found.` });
      return;
    }

    const messages = await chat.sendSeen();

    res.send({ message: 'Seen chat sended successfully.', messages });
    return;
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error sending seen Whatsapp chat. \n ${error}`,
      `Error sending seen Whatsapp chat. \n ${error}`,
    );
    next(finalError);
  }
}

//************EVOLUTION */
export async function sendFirstTouchMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, message } = req.body;

  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('phoneNumber is required');
    }
    if (!message || typeof message !== 'string') {
      throw new Error('message is required');
    }

    const remoteJid = parsePhoneToRemoteJid(phoneNumber);

    // 1) Mirar últimos mensajes en el chat (si hay algo "significativo", NO enviamos)
    const history = await evolutionRequest<EvolutionFindMessagesResponse>(
      'POST',
      `/chat/findMessages/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`,
      {
        where: { key: { remoteJid } },
        page: 1,
        offset: 20,
      },
    );

    const records = history?.messages?.records ?? [];
    const meaningful = records.filter((r) => !isSystemOrEmptyEvolutionRecord(r));

    if (meaningful.length > 0) {
      const first = meaningful[0];
      const preview = extractConversationText(first).slice(0, 200);

      res.send({
        info: 'This chat contains previous messages.',
        previousSample: {
          id: first?.id,
          type: first?.messageType,
          remoteJid,
          bodyPreview: preview,
        },
      });
      return;
    }

    // 2) Enviar el primer mensaje (first touch)
    await evolutionRequest('POST', `/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`, {
      number: remoteJid, // Evolution acepta remoteJid en "number" según tu doc
      text: message,
      // options opcionales:
      // delay: 1200,
      // linkPreview: false,
    });

    res.send({ message: 'Message sent successfully.' });
  } catch (error: any) {
    const finalError = new CustomError(
      500,
      'Error sending WhatsApp message.',
      `Error sending WhatsApp message.\n${error?.message ?? String(error)}`,
    );
    next(finalError);
  }
}

//************EVOLUTION */
export async function searchRegexInChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, searchString, limit = 100 } = req.body;

  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('phoneNumber is required');
    }
    if (!searchString || typeof searchString !== 'string') {
      throw new Error('searchString is required');
    }

    const remoteJid = parsePhoneToRemoteJid(phoneNumber);

    // Evolution: paginado con page + offset
    // offset = número de registros por página (según doc)
    const offset = Math.min(Math.max(Number(limit) || 100, 1), 500);

    const evo = await evolutionRequest<EvolutionFindMessagesResponse>(
      'POST',
      `/chat/findMessages/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`,
      {
        where: { key: { remoteJid } },
        page: 1,
        offset,
      },
    );

    const records = evo?.messages?.records ?? [];

    // Buscar texto (tu función original hacía includes, no regex real)
    const exists = records.some((r) => extractConversationText(r).includes(searchString));

    res.status(200).send({ existsEquivalences: exists });
  } catch (error: any) {
    const finalError = new CustomError(
      500,
      `Error searching in WhatsApp messages. \n ${error?.message ?? String(error)}`,
      `Error searching in WhatsApp messages. \n ${error?.message ?? String(error)}`,
    );
    next(finalError);
  }
}

export async function searchChatByMessageRegex(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { searchString } = req.body;
  try {
    const foundMessages: Message[] = await whatsappClient.searchMessages(searchString);

    const chatsIds = foundMessages.map((message) => message.id.remote);

    res.status(200).send({ chatsContainingMessage: chatsIds });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error searching in WhatsApp messages. \n ${error.message}`,
      `Error searching in WhatsApp messages. \n ${error.message}`,
    );
    next(finalError);
  }
}

export async function editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { messageId, newMessage } = req.body;

  try {
    const message = await whatsappClient.getMessageById(messageId);

    if (!message) {
      return next(new CustomError(404, 'Message not found.', 'No message found with the provided ID.'));
    }

    const editedMessage = await message.edit(newMessage);

    if (!editedMessage) {
      return next(new CustomError(500, 'Failed to edit message.', 'Message could not be edited.'));
    }

    res.send({ message: 'Message edited successfully.', editedMessage });
  } catch (error) {
    const finalError = new CustomError(
      500,
      'Error editing WhatsApp message.',
      `Error editing WhatsApp message. \n ${error}`,
    );
    next(finalError);
  }
}

export async function deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { messageId } = req.params;

  try {
    const message = await whatsappClient.getMessageById(messageId);

    if (!message) {
      return next(new CustomError(404, 'Message not found.', 'No message found with the provided ID.'));
    }

    await message.delete(true);

    res.send({ message: 'Message deleted successfully.' });
  } catch (error) {
    const finalError = new CustomError(
      500,
      'Error deleting WhatsApp message.',
      `Error deleting WhatsApp message. \n ${error}`,
    );
    next(finalError);
  }
}
