interface WChat {
    id: string;
    name: string;
    isGroup: boolean;
    unreadCount: number;
    timestamp: number;
    lastMessage: { viewed: boolean; body: string };
    profileImg?: string;
  }