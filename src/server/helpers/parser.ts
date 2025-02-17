export async function parseMessageFromPrimitive(message: any): Promise<WMessage> {
  let mediaBase64: string | null = null;

  if (message.hasMedia) {
    try {
      const media = await message.downloadMedia();
      mediaBase64 = `data:${media.mimetype};base64,${media.data}`;
    } catch (err) {
      console.error(`Failed to download media for message ${message.id.id}: ${err}`);
      mediaBase64 = null;
    }
  }

  return {
    id: message.id.id,
    chatId: message.id.remote,
    body: message.body,
    fromMe: message.id.fromMe,
    viewed: message.hasMedia ? message.hasBeenViewed : message.ack === 3,
    timestamp: message.timestamp,
    type: message.type,
    hasMedia: message.hasMedia,
    mediaUrl: mediaBase64,
    mimetype: message.hasMedia ? mediaBase64?.split(';')[0].replace('data:', '') : null,
    senderId: message._data?.author?._serialized || message._data?.from?._serialized,
    senderPhone: message._data?.author?.user || message._data?.from?.user,
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
      fromMe: chat.lastMessage?.id?.fromMe,
      body: chat.lastMessage?.body,
    },
    profilePicUrl,
  };
}
