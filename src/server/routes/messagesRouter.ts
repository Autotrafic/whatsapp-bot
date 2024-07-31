import express from "express";
import {
    sendMessage,
    searchRegexInChat,
} from "../controllers/whatsappController";

const messagesRouter = express.Router();

messagesRouter.post("/first-touch-whtspp", sendMessage);
messagesRouter.post("/search-regex", searchRegexInChat);

export default messagesRouter;
