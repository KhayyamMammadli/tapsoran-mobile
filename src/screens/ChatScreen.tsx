import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Avatar, IconButton, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { RootStackParamList } from "../navigation/types";
import { api } from "../lib/api";
import { Message } from "../types";
import { getSocket } from "../lib/socket";
import { useAuth } from "../state/AuthContext";
import { usePrefs } from "../state/PreferencesContext";
import { API_URL } from "../config";
import { censorAzVulgar, hasAzVulgar } from "../utils/moderation";

const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😢",
  "😭",
  "😡",
  "👍",
  "🙏",
  "👏",
  "🔥",
  "🎉",
  "❤️",
  "💔",
  "✅",
  "❌",
];

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

function joinUrl(base: string, path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function formatSeconds(sec?: number | null) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function ChatScreen({ route }: Props) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const { chatFontFamily } = usePrefs();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  // Emoji panel + warnings
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [chatFrozenUntil, setChatFrozenUntil] = useState<string | null>(null);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState<Message | null>(null);
  const [reportReason, setReportReason] = useState("");

  // Conversation info (for WhatsApp-like header)
  const [title, setTitle] = useState<string>("Çat");
  const [subtitle, setSubtitle] = useState<string>("");
  const [otherAvatarUrl, setOtherAvatarUrl] = useState<string | null>(null);

  // Image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Attachment sheet
  const [attachOpen, setAttachOpen] = useState(false);

  // Audio recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingSec, setRecordingSec] = useState(0);
  const recTimer = useRef<any>(null);

  // Audio playback (only one at a time)
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const toggleEmoji = useCallback(() => {
    if (recording) return;
    if (emojiOpen) {
      setEmojiOpen(false);
      return;
    }
    Keyboard.dismiss();
    setEmojiOpen(true);
  }, [emojiOpen, recording]);

  const load = useCallback(async () => {
    const [mRes, cRes] = await Promise.all([
      api.get(`/conversations/${conversationId}/messages`),
      api.get(`/conversations/${conversationId}`),
    ]);
    setMsgs(mRes.data);

    const conv = cRes.data;
    const meId = user?.id;
    const other = conv?.userA?.id === meId ? conv?.userB : conv?.userA;
    const otherName = other?.fullName || "Çat";
    setTitle(otherName);
    setOtherAvatarUrl(other?.avatarUrl ?? null);
    setOtherAvatarUrl(other?.avatarUrl ?? null);

    const reqTitle = conv?.acceptedRequest?.request?.title as string | undefined;
    const catName = conv?.acceptedRequest?.request?.category?.name as string | undefined;
    const sub = reqTitle || catName || "";
    setSubtitle(sub);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [conversationId]);

  // Close emoji panel when keyboard opens (WhatsApp-like)
  useEffect(() => {
    const subShow = Keyboard.addListener("keyboardDidShow", () => setEmojiOpen(false));
    return () => {
      // @ts-ignore
      subShow?.remove?.();
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onNew = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      setMsgs((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    };

    s.on("new_message", onNew);

    const onFrozen = (p: any) => {
      if (p?.until) setChatFrozenUntil(String(p.until));
      setWarn(p?.reason ? `⛔ Çat dayandırıldı: ${p.reason}` : "⛔ Çat müvəqqəti dayandırıldı.");
    };
    const onUnfrozen = () => {
      setChatFrozenUntil(null);
      setWarn("✅ Çat bərpa olundu");
    };

    s.on("chatFrozen", onFrozen);
    s.on("chatUnfrozen", onUnfrozen);
    return () => {
      s.off("new_message", onNew);
      s.off("chatFrozen", onFrozen);
      s.off("chatUnfrozen", onUnfrozen);
    };
  }, [conversationId]);

  useEffect(() => {
    return () => {
      // Cleanup recording
      if (recTimer.current) clearInterval(recTimer.current);
      // Cleanup playback
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [recording]);

  const sendText = useCallback(async () => {
    const t = text.trim();
    if (!t) return;

    // Local UI freeze check
    if (chatFrozenUntil && new Date(chatFrozenUntil).getTime() > Date.now()) {
      setWarn(`⛔ Çat dayandırılıb. Açılma vaxtı: ${new Date(chatFrozenUntil).toLocaleString()}`);
      setText("");
      return;
    }

    if (hasAzVulgar(t)) {
      setWarn("⚠️ Vulqar ifadə aşkarlandı. Davam etsəniz hesabınız blok olunacaq və admin panelə bildiriş gedəcək.");
    }

    setText("");
    try {
      await api.post(`/conversations/${conversationId}/messages`, { text: t });
    } catch (e: any) {
      const st = e?.response?.status;
      const data = e?.response?.data;
      if (st === 423 && data?.error === "ChatFrozen") {
        if (data?.until) setChatFrozenUntil(String(data.until));
        setWarn("⛔ Çat müvəqqəti dayandırılıb. Bir az sonra yenidən yoxlayın.");
        return;
      }
      if (st === 422 && data?.error === "MessageBlocked") {
        setWarn(data?.reason ? `⛔ Mesaj bloklandı: ${data.reason}` : "⛔ Mesaj bloklandı");
        return;
      }
      alert(data?.error || "Mesaj getmədi");
    }
  }, [conversationId, text, chatFrozenUntil]);

  const openReport = useCallback((m: Message) => {
    if (m.senderId === user?.id) return;
    if (m.type === "SYSTEM") return;
    setReportMsg(m);
    setReportReason("");
    setReportOpen(true);
  }, [user?.id]);

  const sendReport = useCallback(
    async (reason: string) => {
      const r = (reason || "").trim();
      if (r.length < 3) {
        setWarn("Şikayət səbəbi ən azı 3 simvol olmalıdır");
        return;
      }

      setReportOpen(false);
      try {
        if (reportMsg) {
          await api.post("/reports", { messageId: reportMsg.id, reason: r });
        } else {
          await api.post(`/reports/conversation/${conversationId}`, { reason: r });
        }
        setWarn("✅ Şikayət göndərildi. Təşəkkürlər.");
      } catch (e: any) {
        const st = e?.response?.status;
        if (st === 409) {
          setWarn("ℹ️ Bu çat üçün artıq şikayət edilib");
          return;
        }
        setWarn(e?.response?.data?.error || "Şikayət göndərilmədi");
      } finally {
        setReportMsg(null);
      }
    },
    [reportMsg, conversationId]
  );

  const sendPickedImage = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!asset?.uri) return;

      const caption = text.trim();
      setText("");

      const name = asset.fileName || `photo-${Date.now()}.jpg`;
      const mime = asset.mimeType || "image/jpeg";

      const form = new FormData();
      // @ts-ignore
      form.append("image", { uri: asset.uri, name, type: mime });
      if (caption) form.append("text", caption);

      try {
        await api.post(`/conversations/${conversationId}/messages`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (e: any) {
        alert(e?.response?.data?.error || "Şəkil göndərilmədi");
      }
    },
    [conversationId, text]
  );

  const pickFromGallery = useCallback(async () => {
    setAttachOpen(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert("Qalereya icazəsi verilməlidir");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    await sendPickedImage(asset);
  }, [sendPickedImage]);

  const pickFromCamera = useCallback(async () => {
    setAttachOpen(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert("Kamera icazəsi verilməlidir");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    await sendPickedImage(asset);
  }, [sendPickedImage]);

  const startRecording = useCallback(async () => {
    if (recording) return;
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        alert("Mikrofon icazəsi verilməlidir");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setRecordingSec(0);
      if (recTimer.current) clearInterval(recTimer.current);
      recTimer.current = setInterval(() => setRecordingSec((s) => s + 1), 1000);
    } catch (e) {
      alert("Səs yazmaq alınmadı");
    }
  }, []);

  const stopAndSendRecording = useCallback(async () => {
    if (!recording) return;
    try {
      if (recTimer.current) clearInterval(recTimer.current);
      recTimer.current = null;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationMs = (status as any)?.durationMillis as number | undefined;

      setRecording(null);
      setRecordingSec(0);

      if (!uri) return;

      const name = `voice-${Date.now()}.m4a`;
      const mime = "audio/m4a";
      const durationSec = durationMs ? Math.max(1, Math.round(durationMs / 1000)) : Math.max(1, recordingSec);

      const form = new FormData();
      // @ts-ignore
      form.append("audio", { uri, name, type: mime });
      form.append("duration", String(durationSec));

      try {
        await api.post(`/conversations/${conversationId}/messages`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (e: any) {
        alert(e?.response?.data?.error || "Səs mesajı göndərilmədi");
      }
    } catch {
      alert("Səs mesajı hazırlamaq alınmadı");
      setRecording(null);
      setRecordingSec(0);
    }
  }, [conversationId, recording, recordingSec]);

  const onMicPressIn = useCallback(() => {
    if (text.trim()) return;
    startRecording();
  }, [startRecording, text]);

  const onMicPressOut = useCallback(() => {
    if (!recording) return;
    stopAndSendRecording();
  }, [recording, stopAndSendRecording]);

  const absoluteMedia = useCallback((m?: string | null) => (m ? joinUrl(API_URL, m) : null), []);

  const playAudio = useCallback(
    async (msg: Message) => {
      if (msg.type !== "AUDIO" || !msg.mediaUrl) return;

      const id = msg.id;
      if (playingId === id) {
        // stop
        await soundRef.current?.stopAsync().catch(() => {});
        await soundRef.current?.unloadAsync().catch(() => {});
        soundRef.current = null;
        setPlayingId(null);
        return;
      }

      // stop any previous
      await soundRef.current?.stopAsync().catch(() => {});
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;

      const uri = absoluteMedia(msg.mediaUrl);
      if (!uri) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          // @ts-ignore
          if (status?.didJustFinish) {
            setPlayingId(null);
            soundRef.current?.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        }
      );
      soundRef.current = sound;
      setPlayingId(id);
    },
    [absoluteMedia, playingId]
  );

  const bg = useMemo(() => (theme.dark ? "#0B141A" : "#F1F5F9"), [theme.dark]);
  const isTyping = !!text.trim();

  const headerBg = useMemo(() => (theme.dark ? "#1F2C34" : theme.colors.primary), [theme.dark, theme.colors.primary]);
  const headerText = "#FFFFFF";

  const headerInitials = useMemo(() => {
    const parts = (title || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [title]);

  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.senderId === user?.id;
    const type = item.type || "TEXT";

    // Creative / clean palette
    const bubbleBg = mine ? (theme.dark ? theme.colors.primary : theme.colors.primary) : theme.dark ? "#1F2C34" : theme.colors.surface;
    const textColor = mine ? "#FFFFFF" : theme.dark ? "#E9EDEF" : theme.colors.onSurface;
    const subColor = mine ? "rgba(255,255,255,0.75)" : theme.dark ? "#AEBAC1" : theme.colors.onSurfaceVariant;

    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const rawText = item.text || "";
    const vulgar = !!rawText && hasAzVulgar(rawText);
    const shownText = vulgar ? censorAzVulgar(rawText) : rawText;

    if (type === "SYSTEM") {
      return (
        <View style={styles.systemWrap}>
          <View style={[styles.systemPill, { backgroundColor: theme.dark ? "#101A20" : "#D9DDE1" }]}>
            <Text style={{ fontSize: 12, color: theme.dark ? "#E9EDEF" : "#111B21" }}>{item.text || ""}</Text>
          </View>
          {item.mediaUrl ? (
            <Pressable onPress={() => setPreviewUrl(absoluteMedia(item.mediaUrl))} style={{ marginTop: 6 }}>
              <Image
                source={{ uri: absoluteMedia(item.mediaUrl) || undefined }}
                style={{ width: 210, height: 140, borderRadius: 10, backgroundColor: "#00000010" }}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
        <View style={styles.bubbleWrap}>
          <Pressable
            onLongPress={() => openReport(item)}
            delayLongPress={350}
            style={[
              styles.bubble,
              {
                backgroundColor: bubbleBg,
                borderTopLeftRadius: mine ? 16 : 6,
                borderTopRightRadius: mine ? 6 : 16,
              },
            ]}
          >
            <View style={styles.bubbleInner}>
              {type === "IMAGE" && item.mediaUrl ? (
                <Pressable onPress={() => setPreviewUrl(absoluteMedia(item.mediaUrl))}>
                  <Image
                    source={{ uri: absoluteMedia(item.mediaUrl) || undefined }}
                    style={{ width: 240, height: 240, borderRadius: 12, backgroundColor: "#00000010" }}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : null}

              {type === "AUDIO" && item.mediaUrl ? (
                <View style={styles.audioRow}>
                  <IconButton
                    icon={playingId === item.id ? "pause" : "play"}
                    size={22}
                    onPress={() => playAudio(item)}
                    style={{ margin: 0 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontFamily: chatFontFamily, lineHeight: 18 }}>
                      Səs mesajı
                    </Text>
                    <Text style={{ color: subColor, fontSize: 12, marginTop: 2 }}>
                      {formatSeconds(item.mediaDuration || null)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {((type === "TEXT") || (rawText && type !== "SYSTEM")) && shownText ? (
                <>
                  <Text
                    style={{
                      color: vulgar ? subColor : textColor,
                      fontSize: 15,
                      fontFamily: chatFontFamily,
                      marginTop: type === "IMAGE" ? 8 : 0,
                      lineHeight: 20,
                    }}
                  >
                    {shownText}
                  </Text>
                  {vulgar ? (
                    <Text style={{ color: subColor, fontSize: 11, marginTop: 6 }}>
                      ⚠️ Vulqar söz gizlədildi
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>

            <Text style={[styles.timeAbs, { color: subColor }]}>{time}</Text>
          </Pressable>

          {/* WhatsApp-like tail */}
          <View
            pointerEvents="none"
            style={[
              styles.tail,
              mine ? styles.tailRight : styles.tailLeft,
              { backgroundColor: bubbleBg },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={["bottom"]}>
      {/* WhatsApp-like header */}
      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: Math.max(insets.top, 0) }]}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={22} onPress={() => nav.goBack()} iconColor={headerText} style={{ margin: 0 }} />

          {otherAvatarUrl ? (
            <Avatar.Image
              size={36}
              source={{ uri: absoluteMedia(otherAvatarUrl) || undefined }}
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
            />
          ) : (
            <Avatar.Text
              size={36}
              label={headerInitials}
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              labelStyle={{ color: headerText, fontWeight: "700" }}
            />
          )}

          <Pressable style={{ flex: 1, paddingLeft: 10 }} onPress={() => {}}>
            <Text numberOfLines={1} style={{ color: headerText, fontSize: 16, fontWeight: "700" }}>
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                {subtitle}
              </Text>
            ) : null}
          </Pressable>

          <IconButton
            icon="alert-circle-outline"
            size={22}
            onPress={() => {
              setReportMsg(null);
              setReportReason("");
              setReportOpen(true);
            }}
            iconColor={headerText}
            style={{ margin: 0 }}
          />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(x) => x.id}
          renderItem={renderMessage}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 14 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Emoji panel (simple WhatsApp-like) */}
        {emojiOpen && !recording ? (
          <View
            style={[
              styles.emojiPanel,
              { backgroundColor: theme.dark ? "#1F2C34" : "#FFFFFF", borderTopColor: theme.dark ? "#22313A" : "#E7E9EC" },
            ]}
          >
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setText((t) => `${t}${e}`)}
                  style={styles.emojiCell}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${e}`}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Input bar (WhatsApp-like) */}
        <View
          style={[
            styles.inputBar,
            { backgroundColor: theme.dark ? "#0B141A" : "#F0F2F5", paddingBottom: 8 + Math.max(insets.bottom, 0) },
          ]}
        >
          <View style={[styles.inputPill, { backgroundColor: theme.dark ? "#1F2C34" : "#FFFFFF" }]}>
            <IconButton icon="emoticon-outline" size={22} onPress={toggleEmoji} style={{ margin: 0 }} />

            <TextInput
              value={recording ? `Yazılır... ${formatSeconds(recordingSec)}` : text}
              onChangeText={setText}
              placeholder={recording ? "" : "Mesaj"}
              editable={!recording}
              multiline
              onFocus={() => setEmojiOpen(false)}
              style={styles.inputText}
              underlineColor="transparent"
              mode="flat"
              contentStyle={{ fontFamily: chatFontFamily, fontSize: 15, paddingTop: 10, paddingBottom: 10 }}
            />

            <IconButton icon="paperclip" size={22} onPress={() => setAttachOpen(true)} style={{ margin: 0 }} />
            <IconButton icon="camera" size={22} onPress={pickFromCamera} style={{ margin: 0 }} />
          </View>

          {isTyping ? (
            <Pressable onPress={sendText} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} accessibilityRole="button" accessibilityLabel="Göndər">
              <View pointerEvents="none">
                <IconButton icon="send" size={22} onPress={() => {}} style={{ margin: 0 }} iconColor="#FFFFFF" />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPressIn={onMicPressIn}
              onPressOut={onMicPressOut}
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }, recording && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Səs mesajı"
            >
              <View pointerEvents="none">
                <IconButton icon="microphone" size={22} onPress={() => {}} style={{ margin: 0 }} iconColor="#FFFFFF" />
              </View>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <Snackbar visible={!!warn} onDismiss={() => setWarn(null)} duration={4200}>
        {warn || ""}
      </Snackbar>

      {/* Attachment sheet */}
      <Modal visible={attachOpen} transparent animationType="fade" onRequestClose={() => setAttachOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setAttachOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.dark ? "#1F2C34" : "#FFFFFF" }]} onPress={() => {}}>
            <Text style={{ fontSize: 14, fontWeight: "700", marginBottom: 10, color: theme.dark ? "#E9EDEF" : "#111B21" }}>
              Göndər...
            </Text>
            <Pressable style={styles.sheetBtn} onPress={pickFromCamera}>
              <Text style={{ fontSize: 15, color: theme.dark ? "#E9EDEF" : "#111B21" }}>📷 Kamera</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={pickFromGallery}>
              <Text style={{ fontSize: 15, color: theme.dark ? "#E9EDEF" : "#111B21" }}>🖼️ Qalereya</Text>
            </Pressable>
            <Pressable style={[styles.sheetBtn, { justifyContent: "center" }]} onPress={() => setAttachOpen(false)}>
              <Text style={{ fontSize: 15, color: theme.colors.primary, fontWeight: "700" }}>Bağla</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report modal */}
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setReportOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.dark ? "#1F2C34" : "#FFFFFF" }]} onPress={() => {}}>
            <Text style={{ fontSize: 14, fontWeight: "700", marginBottom: 10, color: theme.dark ? "#E9EDEF" : "#111B21" }}>
              Şikayət et
            </Text>
            <Text style={{ fontSize: 12, marginBottom: 12, color: theme.dark ? "#AEBAC1" : "#667085" }}>
              Şikayətiniz admin panelə düşəcək. Qanunsuz alqı-satqı, link və ya əlaqə məlumatı paylaşımı kimi hallarda istifadə edin.
            </Text>
            <TextInput
              mode="outlined"
              label="Səbəb"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              placeholder="Məs: Scam etdi, əlaqə məlumatı istədi..."
              style={{ marginBottom: 10 }}
            />

            <Pressable style={styles.sheetBtn} onPress={() => { setReportReason("Narkotik / qanunsuz alqı-satqı"); void sendReport("Narkotik / qanunsuz alqı-satqı"); }}>
              <Text style={{ fontSize: 15, color: theme.dark ? "#E9EDEF" : "#111B21" }}>🚫 Qanunsuz alqı-satqı</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={() => { setReportReason("Əlaqə məlumatı / sosial şəbəkəyə yönləndirmə"); void sendReport("Əlaqə məlumatı / sosial şəbəkəyə yönləndirmə"); }}>
              <Text style={{ fontSize: 15, color: theme.dark ? "#E9EDEF" : "#111B21" }}>☎️ Əlaqə məlumatı / Telegram</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={() => { setReportReason("Təhqir / zorakılıq"); void sendReport("Təhqir / zorakılıq"); }}>
              <Text style={{ fontSize: 15, color: theme.dark ? "#E9EDEF" : "#111B21" }}>⚠️ Təhqir / zorakılıq</Text>
            </Pressable>

            <Pressable
              style={[styles.sheetBtn, { justifyContent: "center" }]}
              onPress={() => void sendReport(reportReason)}
            >
              <Text style={{ fontSize: 15, color: theme.colors.primary, fontWeight: "900" }}>Göndər</Text>
            </Pressable>
            <Pressable style={[styles.sheetBtn, { justifyContent: "center" }]} onPress={() => setReportOpen(false)}>
              <Text style={{ fontSize: 15, color: theme.colors.primary, fontWeight: "700" }}>Bağla</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full-screen image preview */}
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUrl(null)}>
          <View style={styles.previewCard}>
            {previewUrl ? <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" /> : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  msgRow: { flexDirection: "row", marginVertical: 4 },
  bubbleWrap: {
    maxWidth: "86%",
    position: "relative",
  },
  bubble: {
    position: "relative",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 22,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tail: {
    position: "absolute",
    width: 12,
    height: 12,
    bottom: 6,
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
    zIndex: -1,
  },
  tailLeft: { left: -5 },
  tailRight: { right: -5 },
  bubbleInner: {
    gap: 8,
  },
  timeAbs: {
    position: "absolute",
    right: 10,
    bottom: 6,
    fontSize: 11,
  },
  emojiPanel: {
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 14,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emojiCell: {
    width: "14.28%", // 7 columns
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiText: {
    fontSize: 22,
  },
  inputBar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingLeft: 4,
    paddingRight: 6,
  },
  inputText: {
    flex: 1,
    backgroundColor: "transparent",
    minHeight: 44,
    maxHeight: 120,
  },
  actionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F6FEB", // primary
    overflow: "hidden",
  },
  systemWrap: { alignItems: "center", marginVertical: 8 },
  systemPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 220 },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewCard: {
    width: "100%",
    height: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  micPressable: {
    borderRadius: 999,
    overflow: "hidden",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 22,
  },
  sheetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
});
