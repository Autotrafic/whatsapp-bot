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
    lastMessage: {
      viewed: chat.lastMessage?._data?.viewed,
      fromMe: chat.lastMessage?.fromMe,
      body: chat.lastMessage?.body,
    },
    profilePicUrl,
  };
}
