const vCardParser = require('vcard-parser');

export async function parseMessageFromPrimitive(
  message: any,
  isGroup?: boolean,
  participantsInfo?: { id: string; user: string; name: string }[],
  whatsappClient?: any,
): Promise<WMessage> {
  const senderId = message._data?.author?._serialized || message._data?.from?._serialized;

  let mediaBase64: string | null = null;
  let vCard: any = null;
  let attachedContact = null;
  let quotedMessage: WMessage | null = null;
  let contactName: string | null = null;
  let mentionedContacts: { id: string; user: string; name: string }[] = [];

  if (message.hasMedia) {
    try {
      const media = await message.downloadMedia();
      if (media?.mimetype) mediaBase64 = `data:${media.mimetype};base64,${media.data}`;
    } catch (err) {
      console.error(`Failed to download media for message ${message.id.id}: ${err}`);
      mediaBase64 = null;
    }
  }

  if (message.vCards.length > 0) {
    vCard = vCardParser.parse(message.vCards[0]);

    if (vCard?.tel?.[0]?.value) {
      attachedContact = {
        name: vCard?.fn?.[0]?.value,
        phone: vCard.tel[0].value,
        img: `https://ui-avatars.com/api/?name=${vCard?.fn?.[0]?.value}&background=random&color=fff`,
      };
    }
  }

  if (message.hasQuotedMsg) {
    quotedMessage = await message.getQuotedMessage();
  }

  if (isGroup) {
    const participant = participantsInfo.find((p) => p.id === senderId);
    contactName = participant ? participant.name : null;
  }

  for (const mentionedId of message.mentionedIds) {
    if (isGroup) {
      const participant = participantsInfo.find((p) => p.id === mentionedId._serialized);
      if (participant) mentionedContacts.push({ id: participant.id, user: participant.user, name: participant.name });
    } else {
      const contact = await whatsappClient.getContactById(mentionedId._serialized);
      const contactName = contact ? contact.name || contact.pushname || null : mentionedId.user;

      mentionedContacts.push({ id: mentionedId._serialized, user: mentionedId.user, name: contactName });
    }
  }

  return {
    id: message.id,
    chatId: message.id.remote,
    body: message.body,
    fromMe: message.id.fromMe,
    viewed: message.ack === 3,
    timestamp: message.timestamp,
    type: message.type,
    hasMedia: message.hasMedia,
    mediaUrl: mediaBase64,
    mimetype: message.hasMedia ? mediaBase64?.split(';')[0].replace('data:', '') : null,
    senderId,
    senderPhone: message._data?.author?.user || message._data?.from?.user,
    contactName,
    link: message.links?.[0] || null,
    vCard,
    attachedContact,
    quotedMessage,
    mentionedContacts,
  };
}

export async function parseChatFromPrimitive(chat: any, whatsappClient: any): Promise<WChat> {
  const profilePicUrl = await whatsappClient.getProfilePicUrl(chat.id._serialized).catch(() => {});

  return {
    id: chat.id._serialized,
    name: chat.name,
    isGroup: chat.id && chat.id.server == 'g.us',
    unreadCount: chat.unreadCount,
    timestamp: chat.timestamp,
    pinned: chat.pinned,
    lastMessage: {
      viewed: chat.lastMessage?._data?.viewed,
      fromMe: chat.lastMessage?.fromMe,
      body: chat.lastMessage?.body,
    },
    profilePicUrl,
  };
}

export function parsePhoneToRemoteJid(input: string): string {
  if (!input) {
    throw new Error("Phone is required");
  }

  let phone = input.trim();

  // 1️⃣ eliminar dominio whatsapp si existe
  phone = phone.replace(/@s\.whatsapp\.net|@c\.us/gi, "");

  // 2️⃣ eliminar espacios, guiones, paréntesis, etc
  phone = phone.replace(/[^\d+]/g, "");

  // 3️⃣ eliminar +
  if (phone.startsWith("+")) {
    phone = phone.slice(1);
  }

  // 4️⃣ si empieza por 00 (formato internacional)
  if (phone.startsWith("00")) {
    phone = phone.slice(2);
  }

  // 5️⃣ si es número español sin prefijo (9 dígitos)
  if (phone.length === 9) {
    phone = "34" + phone;
  }

  // 6️⃣ validación básica
  if (phone.length < 11 || phone.length > 15) {
    throw new Error("Invalid phone format");
  }

  return `${phone}@s.whatsapp.net`;
}
