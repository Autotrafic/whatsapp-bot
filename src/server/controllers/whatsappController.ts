import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { Chat, Message, MessageMedia } from 'whatsapp-web.js';
import CustomError from '../../errors/CustomError';
import { whatsappClient } from '../../database/whatsapp';
import { parseMessageFromPrimitive } from '../helpers/parser';
import { MediaFile, SendMediaRequest } from '../interfaces/import';
import { cleanupFiles } from '../helpers/files';

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, message } = req.body;

  const chatId = `${phoneNumber}@c.us`;

  try {
    await whatsappClient.sendMessage(chatId, message);
    res.send({ message: `Message sent successfully.` });
  } catch (error) {
    const finalError = new CustomError(
      500,
      'Error sending WhatsApp message.',
      `Error sending WhatsApp message. \n ${error}`
    );
    next(finalError);
  }
}

export async function sendMessageToChat(req: SendMediaRequest, res: Response, next: NextFunction): Promise<void> {
  const body = { ...req.body };
  const files = req.files as Express.Multer.File[];
  const chatId = body.chatId;
  const message = body?.message;

  try {
    if ((!files || files.length === 0) && message) {
      await whatsappClient.sendMessage(chatId, message);
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
        await whatsappClient.sendMessage(chatId, media, { caption: message });
        isFirstFile = false;
      } else {
        await whatsappClient.sendMessage(chatId, media);
      }
    }

    cleanupFiles(files);

    res.send({ message: 'Message and media sent successfully!' });
  } catch (error) {
    console.error(error.message);
    const finalError = new CustomError(
      500,
      `Error sending WhatsApp message to a chat. \n ${error}`,
      `Error sending WhatsApp message to a chat. \n ${error}`
    );
    next(finalError);
  }
}
export async function getClientChats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chats: any[] = await whatsappClient.getChats();

    if (!chats || chats.length === 0) {
      res.status(404).send({ message: 'No chats found.' });
    }

    const chatsWithProfileImages: WChat[] = await Promise.all(
      chats.map(async (chat) => {
        const profilePicUrl = await whatsappClient.getProfilePicUrl(chat.id._serialized).catch(() => {});
        return {
          id: chat.id._serialized,
          name: chat.name,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          timestamp: chat.timestamp,
          lastMessage: { viewed: chat.lastMessage?._data?.viewed, body: chat.lastMessage?.body },
          profilePicUrl,
        };
      })
    );

    res.send({ message: 'Chats retrieved successfully.', chats: chatsWithProfileImages });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chats. \n ${error}`,
      `Error retrieving WhatsApp chats. \n ${error}`
    );
    next(finalError);
  }
}

export async function getChatMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { chatId } = req.params;

  try {
    const chat = await whatsappClient.getChatById(chatId);

    if (!chat) {
      res.status(404).send({ message: `Chat with ID ${chatId} not found.` });
      return;
    }

    const messages: any[] = await chat.fetchMessages({ limit: 50 });

    const messagesWithMedia = await Promise.all(
      messages.map(async (msg) => {
        const parsedMessage = await parseMessageFromPrimitive(msg);

        return parsedMessage;
      })
    );

    res.send({ message: 'Messages retrieved successfully.', messages: messagesWithMedia });
  } catch (error) {
    const finalError = new CustomError(
      500,
      `Error retrieving WhatsApp chat messages. \n ${error}`,
      `Error retrieving WhatsApp chat messages. \n ${error}`
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
      `Error sending seen Whatsapp chat. \n ${error}`
    );
    next(finalError);
  }
}

export async function sendFirstTouchMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, message } = req.body;

  const chatId = `${phoneNumber}@c.us`;

  try {
    const chat = await whatsappClient.getChatById(chatId);

    const messages = await chat.fetchMessages({ limit: 1 });
    if (messages.length > 0) {
      res.send(`This chat contains previous messages. Previous message: ${messages[0]}`);
    } else {
      await whatsappClient.sendMessage(chatId, message);
      res.send({ message: `Message sent successfully.` });
    }
  } catch (error) {
    const finalError = new CustomError(
      500,
      'Error sending WhatsApp message.',
      `Error sending WhatsApp message. \n ${error}`
    );
    next(finalError);
  }
}

export async function searchRegexInChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, searchString, limit = 100 } = req.body;
  const chatId = `${phoneNumber}@c.us`;

  try {
    const chat = await whatsappClient.getChatById(chatId);
    const messages = (await chat.fetchMessages()) as Message[];

    const foundMessages = messages.slice(-limit).filter((message) => message.body.includes(searchString));

    res.status(200).send({ existsEquivalences: foundMessages.length > 0 ? true : false });
  } catch (error) {
    const finalError = new CustomError(
      500,
      'Error searching in WhatsApp messages.',
      `Error searching in WhatsApp messages. \n ${error}`
    );
    next(finalError);
  }
}
