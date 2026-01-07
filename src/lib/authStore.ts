import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "br_token";
const USER_KEY = "br_user";

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

export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function setUser(user: User) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}
export async function getUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}
export async function clearUser() {
  await SecureStore.deleteItemAsync(USER_KEY);
}
