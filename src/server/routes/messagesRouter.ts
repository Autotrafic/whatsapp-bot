import express from 'express';
import multer from 'multer';
import {
  sendFirstTouchMessage,
  searchRegexInChat,
  getChats,
  getChatMessages,
  sendSeenChat,
  sendMessageToChat,
  getChatById,
  getPrimitiveChats,
  getPrimitiveChatMessages,
  searchChatByMessageRegex,
  editMessage,
  deleteMessage,
} from '../controllers/whatsappController';
import { getEvolutionWebhook, sendMessageToNumber } from '../controllers/evolutionController';

const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 * 1024 }, dest: 'uploads/' });

const messagesRouter = express.Router();

messagesRouter.post('/send', sendMessageToNumber);
messagesRouter.post('/send-any-chat', upload.any(), sendMessageToChat);
messagesRouter.post('/first-touch-whtspp', sendFirstTouchMessage);

messagesRouter.get('/chats', getChats);
messagesRouter.get('/chats/:chatId', getChatById);
messagesRouter.get('/seen-chat/:chatId', sendSeenChat);
messagesRouter.get('/chats-primitive', getPrimitiveChats);

messagesRouter.post('/chat-messages', getChatMessages);
messagesRouter.get('/chat-messages-primitive/:chatId', getPrimitiveChatMessages);

messagesRouter.post('/search-regex', searchRegexInChat);
messagesRouter.post('/search-chats-by-message', searchChatByMessageRegex);

messagesRouter.post('/edit', editMessage);
messagesRouter.get('/delete/:messageId', deleteMessage);

messagesRouter.post('/evolution-webhook', upload.any(), getEvolutionWebhook);

export default messagesRouter;
