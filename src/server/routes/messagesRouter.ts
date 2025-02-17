import express from 'express';
import multer from 'multer';
import {
  sendFirstTouchMessage,
  searchRegexInChat,
  sendMessageToNumber,
  getChats,
  getChatMessages,
  sendSeenChat,
  sendMessageToChat,
  getChatById,
  getPrimitiveChats,
  getPrimitiveChatMessages,
} from '../controllers/whatsappController';

const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 * 1024 }, dest: 'uploads/' });

const messagesRouter = express.Router();

messagesRouter.post('/send', sendMessageToNumber);
messagesRouter.post('/send-any-chat', upload.any(), sendMessageToChat);
messagesRouter.post('/first-touch-whtspp', sendFirstTouchMessage);

messagesRouter.get('/chats', getChats);
messagesRouter.get('/chats/:chatId', getChatById);
messagesRouter.get('/seen-chat/:chatId', sendSeenChat);
messagesRouter.get('/chats-primitive', getPrimitiveChats);

messagesRouter.get('/chat-messages/:chatId', getChatMessages);
messagesRouter.get('/chat-messages-primitive/:chatId', getPrimitiveChatMessages);

messagesRouter.post('/search-regex', searchRegexInChat);

export default messagesRouter;
