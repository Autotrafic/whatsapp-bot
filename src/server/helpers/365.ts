import { EvolutionMessage } from "../../database/models/evolution";

const TARGET_GROUP_JID = "120363XXXXXXXX@g.us";

export async function handleMessageUpsert(message: EvolutionMessage) {
  const isFromMe = message.key.fromMe;
  const chatJid = message.key.remoteJid;

  console.log(`Is from me: ${message.key.fromMe} or ${isFromMe}, chatJid: ${chatJid}`);

  if (isFromMe) return;

  const isTargetGroup = chatJid === TARGET_GROUP_JID;
  const isVideoNote = isEvolutionVideoNote(message);

  if (isTargetGroup && isVideoNote) {
    await handleVideoNoteInTargetGroup(message);
  }
}

function isEvolutionVideoNote(message: EvolutionMessage): boolean {
  const video = message.message?.videoMessage;

  if (!video) return false;

  const isVideo = video.mimetype?.startsWith("video/") === true;

  /**
   * En WhatsApp, las notas de vídeo suelen llegar como videoMessage
   * con ptt: true.
   */
  const isVideoNote = video.ptt === true;

  return isVideo && isVideoNote;
}

async function handleVideoNoteInTargetGroup(message: EvolutionMessage) {
  const groupJid = message.key.remoteJid;
  const senderJid = message.key.participant;
  const messageId = message.key.id;

  console.log("Nota de vídeo recibida en el grupo objetivo:", {
    groupJid,
    senderJid,
    messageId,
  });

  /**
   * Aquí pones la acción que quieras:
   * - sumar streak
   * - guardar check-in en DB
   * - responder al grupo
   * - llamar a otro servicio
   */

  // ejemplo:
  // await addUserStreak(senderJid);
}