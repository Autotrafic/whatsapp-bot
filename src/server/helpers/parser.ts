const vCardParser = require('vcard-parser');

export async function parseMessageFromPrimitive(message: any): Promise<WMessage> {
  let mediaBase64: string | null = null;
  let vCard: any = null;
  let attachedContact = null;

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

  return {
    id: message.id.id,
    chatId: message.id.remote,
    body: message.body,
    fromMe: message.id.fromMe,
    viewed: message.ack === 3,
    timestamp: message.timestamp,
    type: message.type,
    hasMedia: message.hasMedia,
    mediaUrl: mediaBase64,
    mimetype: message.hasMedia ? mediaBase64?.split(';')[0].replace('data:', '') : null,
    senderId: message._data?.author?._serialized || message._data?.from?._serialized,
    senderPhone: message._data?.author?.user || message._data?.from?.user,
    link: message.links?.[0] || null,
    vCard,
    attachedContact,
  };
}

export async function parseChatFromPrimitive(chat: any, whatsappClient: any): Promise<WChat> {
  const profilePicUrl = await whatsappClient.getProfilePicUrl(chat.id._serialized).catch(() => {});

  return {
    id: chat.id._serialized,
    name: chat.name,
    isGroup: chat.isGroup,
    unreadCount: chat.unreadCount,
    timestamp: chat.timestamp,
    lastMessage: {
      viewed: chat.lastMessage?._data?.viewed,
      fromMe: chat.lastMessage?.fromMe, // Not working properly by Wweb.js
      body: chat.lastMessage?.body,
    },
    profilePicUrl,
  };
}
