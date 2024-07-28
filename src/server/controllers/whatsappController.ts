import { Request, Response, NextFunction } from "express";
import CustomError from "../../errors/CustomError";
import { whatsappClient } from "../../database/whatsapp";

export default async function sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { phoneNumber, message } = req.body;

    const chatId = `${phoneNumber}@c.us`;

    try {
        const chat = await whatsappClient.getChatById(chatId);

        const messages = await chat.fetchMessages({ limit: 1 });
        if (messages.length > 0) {
            res.send(`This chat contains previous messages. Previous message: ${messages[0]}`);
        } else {
            await whatsappClient.sendMessage(chatId, message);
            res.send(`Message sent successfully.`);
        }
    } catch (error) {
        const finalError = new CustomError(
            500,
            "Error sending WhatsApp message.",
            `Error sending WhatsApp message. \n ${error}`
        );
        next(finalError);
    }
};
