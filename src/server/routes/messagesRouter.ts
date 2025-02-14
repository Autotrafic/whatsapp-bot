import express from 'express';
import multer from 'multer';
import {
  sendFirstTouchMessage,
  searchRegexInChat,
  sendMessage,
  getClientChats,
  getChatMessages,
  sendSeenChat,
  sendMessageToChat,
} from '../controllers/whatsappController';

const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 * 1024 }, dest: 'uploads/' });

const messagesRouter = express.Router();

messagesRouter.post('/send', sendMessage);
messagesRouter.post('/send-any-chat', upload.any(), sendMessageToChat);

messagesRouter.get('/chats', getClientChats);
messagesRouter.get('/chat-messages/:chatId', getChatMessages);
messagesRouter.get('/seen-chat/:chatId', sendSeenChat);

messagesRouter.post('/first-touch-whtspp', sendFirstTouchMessage);

messagesRouter.post('/search-regex', searchRegexInChat);

export default messagesRouter;
