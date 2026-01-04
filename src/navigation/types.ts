export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  Notifications: undefined;
  Preferences: undefined;
  Chat: { conversationId: string };
  AdminChatDetail: { conversationId: string } | undefined;
};

export type AuthStackParamList = {
  AuthMain: undefined;
};

export type AppStackParamList = {
  BuyerTabs: undefined;
  SellerTabs: undefined;
};
