import { TARGET_GROUP_JID } from "../../database/evolution";
import { EvolutionMessage } from "../../database/models/evolution";

export async function handleMessageUpsert(message: EvolutionMessage) {
  const isFromMe = message.key.fromMe;
  const chatJid = message.key.remoteJid;

  if (isFromMe) return;

  const isTargetGroup = chatJid === TARGET_GROUP_JID;
  const isVideoNote = message.messageType === "ptvMessage";

  if (isTargetGroup && isVideoNote) {
    await handleVideoNoteInTargetGroup(message);
  }
}

async function handleVideoNoteInTargetGroup(message: EvolutionMessage) {
  const groupJid = message.key.remoteJid;
  const senderJid = message.key.participantAlt;
  const messageId = message.key.id;

  console.log("Nota de vídeo recibida en el grupo objetivo:", {
    groupJid,
    senderJid,
    messageId,
  });

  /**
   * Aquí pones la acción que quieras:
   */
}