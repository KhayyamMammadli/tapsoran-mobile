export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  Notifications: undefined;
  Preferences: undefined;
  // Chat routes are temporarily not used in navigation (feature is hidden),
  // but we keep the types to avoid breaking compiled screens/components.
  Chat: { conversationId: string };
  AdminChatDetail: { conversationId: string } | undefined;
  BuyerCreateRequest: undefined;
  BuyerRequestDetail: { requestId: string };
  SellerProfileSettings: undefined;
};

export type AuthStackParamList = {
  AuthMain: undefined;
};

export type AppStackParamList = {
  BuyerTabs: undefined;
  SellerTabs: undefined;
};
