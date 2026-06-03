import { NextFunction, Request, Response } from "express";
import { parsePhoneToRemoteJid } from "../helpers/parser";
import { EVOLUTION_INSTANCE_NAME, evolutionRequest } from "../../database/evolution";
import CustomError from "../../errors/CustomError";
import { EvolutionWebhook } from "../../database/models/evolution";
import { handleMessageUpsert } from "../helpers/365";
import { EvolutionEvent } from "../interfaces/enums";

export async function getEvolutionWebhook(req: Request<{}, {}, EvolutionWebhook>, res: Response, next: NextFunction): Promise<void> {
  const { event, data } = req.body;

  try {
    console.info(`Received Evolution webhook event: ${event} with data: ${JSON.stringify(data)}`);

    switch (event) {
      case EvolutionEvent.MessagesUpsert:
        console.info(`Handling messages.upsert event: ${JSON.stringify(data)}`);
        await handleMessageUpsert(data);
        break;

      default:
        console.log(`Unhandled Evolution event: ${event}`);
        break;
    }

    res.send({ message: 'Event received successfully.' });
  } catch (error: any) {
    const finalError = new CustomError(
      500,
      'Error getting evolution webhook.',
      `Error getting evolution webhook. \n ${error?.message ?? String(error)}`,
    );
    next(finalError);
  }
}

export async function sendMessageToNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { phoneNumber, message } = req.body;

  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('phoneNumber is required');
    }
    if (!message || typeof message !== 'string') {
      throw new Error('message is required');
    }

    const remoteJid = parsePhoneToRemoteJid(phoneNumber);

    // Evolution doesn't require checking if chat exists; just send.
    await evolutionRequest('POST', `/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE_NAME)}`, {
      number: remoteJid,
      text: message,
      delay: 1200,
    });

    res.send({ message: 'Message sent successfully.' });
  } catch (error: any) {
    const finalError = new CustomError(
      500,
      'Error sending WhatsApp message.',
      `Error sending WhatsApp message. \n ${error?.message ?? String(error)}`,
    );
    next(finalError);
  }
}

