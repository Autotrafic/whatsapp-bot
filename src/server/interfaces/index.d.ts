interface WChat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  pinned: boolean;
  lastMessage: { viewed: boolean; fromMe: boolean; body: string };
  profilePicUrl?: string;
}

interface WMessage {
  id: { id: string; remote: string; _serialized: string; fromMe: boolean };
  chatId: string;
  body: string;
  fromMe: boolean;
  viewed: boolean | undefined;
  timestamp: number;
  type: string;
  hasMedia: boolean;
  mediaUrl: string | undefined;
  mimetype: string | undefined;
  senderId: string;
  senderPhone: string;
  contactName: string | null;
  link: { link: string; isSuspicious: boolean } | null;
  vCard: any;
  attachedContact: {
    name: string;
    phone: string;
    img: string;
  } | null;
  quotedMessage: WMessage | null;
  mentionedContacts: { id: string; user: string; name: string }[];
}
