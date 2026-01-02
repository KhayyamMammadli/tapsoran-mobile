export type Category = { id: string; name: string };

export type RequestScope = "ALL_SELLERS" | "CATEGORY_SELLERS";

export type RequestItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
  scope: RequestScope;
  categoryId: string;
  category?: Category;
  buyerId: string;
  buyer?: { id: string; fullName: string };
  accepted?: any;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type User = {
  id: string;
  role: "BUYER" | "SELLER" | "SUPER_ADMIN";
  fullName: string;
  email: string;
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
  readAt?: string | null;
  createdAt: string;
};
