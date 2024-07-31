import { Request, Response, NextFunction } from "express";
import { Message } from "whatsapp-web.js";
import CustomError from "../../errors/CustomError";
import { whatsappClient } from "../../database/whatsapp";

export async function sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { phoneNumber, message } = req.body;

    const chatId = `${phoneNumber}@c.us`;

    try {
        await whatsappClient.sendMessage(chatId, message);
        res.send(`Message sent successfully.`);
    } catch (error) {
        const finalError = new CustomError(
            500,
            "Error sending WhatsApp message.",
            `Error sending WhatsApp message. \n ${error}`
        );
        next(finalError);
    }
}

export async function sendFirstTouchMessage(
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
            res.send(
                `This chat contains previous messages. Previous message: ${messages[0]}`
            );
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
}

export async function searchRegexInChat(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { phoneNumber, searchString } = req.body;
    const chatId = `${phoneNumber}@c.us`;

    try {
        const chat = await whatsappClient.getChatById(chatId);
        const messages = (await chat.fetchMessages()) as Message[];

        const foundMessages = messages.filter((message) =>
            message.body.includes(searchString)
        );

        if (foundMessages.length > 0) {
            res.status(200).send({ existsEquivalences: true });
        } else {
            res.status(404).send({ existsEquivalences: false });
        }
    } catch (error) {
        const finalError = new CustomError(
            500,
            "Error searching in WhatsApp messages.",
            `Error searching in WhatsApp messages. \n ${error}`
        );
        next(finalError);
    }
}
