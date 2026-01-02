export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Chat: { conversationId: string };
  Requests: undefined;
};

export type AuthStackParamList = {
  AuthMain: undefined;
};

export type AppStackParamList = {
  BuyerTabs: undefined;
  SellerTabs: undefined;
};
