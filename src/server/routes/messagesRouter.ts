import express from "express";
import {
    sendFirstTouchMessage,
    searchRegexInChat,
    sendMessage,
} from "../controllers/whatsappController";

const messagesRouter = express.Router();

messagesRouter.post("/send", sendMessage);
messagesRouter.post("/first-touch-whtspp", sendFirstTouchMessage);
messagesRouter.post("/search-regex", searchRegexInChat);

export default messagesRouter;
