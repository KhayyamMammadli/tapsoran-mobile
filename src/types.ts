export type Category = { id: string; name: string };

export type RequestScope = "ALL_SELLERS" | "CATEGORY_SELLERS";

export type RequestItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
  scope: RequestScope;
  categoryId: string | null;
  category?: Category | null;
  buyerId: string;
  buyer?: { id: string; fullName: string };
  accepted?: any;
  createdAt: string;
};

export type AcceptedRequest = {
  id: string;
  requestId: string;
  sellerId: string;
  sellerNote?: string | null;
  sellerImageUrl?: string | null;
  createdAt: string;
  seller?: { id: string; fullName: string; avatarUrl?: string | null; phone?: string | null; whatsapp?: string | null };
};

export type Conversation = {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  // Included fields from API (/conversations)
  userA?: { id: string; fullName: string; role: string; avatarUrl?: string | null };
  userB?: { id: string; fullName: string; role: string; avatarUrl?: string | null };
  acceptedRequest?: any;
  messages?: Message[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  type?: "TEXT" | "IMAGE" | "AUDIO" | "SYSTEM";
  text?: string | null;
  // For IMAGE/AUDIO (served via /uploads/.. on the API host)
  mediaUrl?: string | null;
  mediaMime?: string | null;
  mediaDuration?: number | null;
  createdAt: string;
};

export type User = {
  id: string;
  role: "BUYER" | "SELLER" | "SUPER_ADMIN";
  fullName: string;
  email: string;
  // Public profile image (served via /uploads/... on the API host)
  avatarUrl?: string | null;
  tip?: string | null;
  categoryId?: string | null;
  blocked?: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type?: string | null;
  data?: any;
  readAt?: string | null;
  createdAt: string;
};
