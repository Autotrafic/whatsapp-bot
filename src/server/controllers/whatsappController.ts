import { Request, Response, NextFunction } from 'express';
import { Chat, Message, MessageMedia } from 'whatsapp-web.js';
import CustomError from '../../errors/CustomError';
import { whatsappClient } from '../../database/whatsapp';

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

export async function sendMessageToAnyChatType(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { chatId, message } = req.body;

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
        let mediaBase64: string | null = null;

        if (msg.hasMedia) {
          try {
            const media: MessageMedia = await msg.downloadMedia();
            mediaBase64 = `data:${media.mimetype};base64,${media.data}`;
          } catch (err) {
            console.error(`Failed to download media for message ${msg.id.id}: ${err}`);
            mediaBase64 = null;
          }
        }

        return {
          id: msg.id.id,
          body: msg.body,
          fromMe: msg.id.fromMe,
          viewed: msg?._data?.viewed,
          timestamp: msg.timestamp,
          type: msg.type,
          hasMedia: msg.hasMedia,
          mediaUrl: mediaBase64,
          mimetype: msg.hasMedia ? mediaBase64?.split(';')[0].replace('data:', '') : null,
        };
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
