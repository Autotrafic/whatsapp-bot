import express from "express";
import {
    sendFirstTouchMessage,
    searchRegexInChat,
    sendMessage,
    getClientChats,
    getChatMessages,
} from "../controllers/whatsappController";

const messagesRouter = express.Router();

messagesRouter.post("/send", sendMessage);

messagesRouter.get("/chats", getClientChats);
messagesRouter.get("/chat-messages/:chatId", getChatMessages);

messagesRouter.post("/first-touch-whtspp", sendFirstTouchMessage);

messagesRouter.post("/search-regex", searchRegexInChat);

export default messagesRouter;
