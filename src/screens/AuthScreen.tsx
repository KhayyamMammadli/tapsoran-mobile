import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Linking, View } from "react-native";
import {
  Button,
  Card,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SelectField } from "../components/SelectField";
import { Screen } from "../components/Screen";
import { retryGet } from "../lib/http";
import { useAuth } from "../state/AuthContext";
import { useToast } from "../state/ToastContext";
import { Category } from "../types";
import { API_URL, policyLink } from "../config";
import { useIsFocused, useNavigation } from "@react-navigation/native";

type Mode = "login" | "register";
type Role = "BUYER" | "SELLER";

export function AuthScreen() {
  const theme = useTheme();
  const { login, requestRegisterOtp } = useAuth();
  const toast = useToast();
  const navigation = useNavigation<any>();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("BUYER");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("+994");

  const normalizeWhatsapp = (text: string) => {
    // Keep default +994 prefix for AZ numbers
    const t = String(text || "").trim();
    if (!t) return "+994";
    if (t === "+") return "+994";
    if (t.startsWith("+994")) return t;
    // If user types digits without prefix, prepend
    if (/^[0-9]/.test(t)) return `+994${t}`;
    // If user types + and digits (other), keep but if it is +994 missing, still allow.
    return t;
  };

  const digitsOnly = (s: string) => (s || "").replace(/[^0-9]/g, "");
  const hasPhone = digitsOnly(phone).length > 0;
  // "+994" alone is not a valid whatsapp entry
  const hasWhatsapp = digitsOnly(whatsapp).length > 3;

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [catLoading, setCatLoading] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);
  const [catLast, setCatLast] = useState<number | null>(null);

  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setCatErr(null);
    setCatLoading(true);
    try {
      // cache buster + no-cache headers (see retryGet)
      const data = await retryGet<Category[]>("/categories", {
        retries: 3,
        baseDelayMs: 1200,
        params: { t: Date.now() },
        timeoutMs: 60000,
      });

      // Defensive: ensure array
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      if (!categoryId && list?.[0]?.id) setCategoryId(list[0].id);
      setCatLast(Date.now());

      // If server returns empty, surface it (this is the current issue).
      if (list.length === 0) {
        setCatErr(`Server boş kateqoriya qaytardı: ${API_URL}/categories`);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.message;
      setCatErr(
        `Kateqoriyalar yüklənmədi (${status || "network"}). ${msg || ""}\n${API_URL}/categories`
      );
    } finally {
      setCatLoading(false);
    }
  }, [categoryId]);

  // Load categories when screen opens, and also when switching into Seller Register.
  useEffect(() => {
    if (!isFocused) return;
    if (mode === "register" && role === "SELLER") {
      // refresh if never loaded or older than 30s
      const stale = !catLast || Date.now() - catLast > 30_000;
      if (categories.length === 0 || stale) fetchCategories();
    }
  }, [isFocused, mode, role, fetchCategories, categories.length, catLast]);

  // Also preload once at app open (helps first-time users)
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = useMemo(() => (mode === "login" ? "Daxil ol" : "Qeydiyyat"), [mode]);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password, role);
      } else {
        const otpRes = await requestRegisterOtp({
          role,
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          ...(role === "SELLER"
            ? {
                categoryId,
                ...(hasPhone ? { phone: phone.trim() } : {}),
                ...(hasWhatsapp ? { whatsapp: whatsapp.trim() } : {}),
              }
            : {}),
        });

        // Go to OTP verification screen
        navigation.navigate("VerifyOtp", {
          email: email.trim(),
          role,
          debugCode: otpRes?.debugCode,
        });
        toast.show("Təsdiq kodu emailinizə göndərildi.");
      }
    } catch (e: any) {
      const serverErr = e?.response?.data?.error;
      const msg = e?.message;
      if (serverErr === "Unauthorized" && mode === "register") {
        setErr(
          `Unauthorized (401). Adətən API_URL səhv yazılanda olur.\n` +
            `API_URL yalnız domen olmalıdır (məs: https://...onrender.com). /api və ya /auth əlavə etmə.\n\n` +
            `Hal-hazırda: ${API_URL}`
        );
      } else if (!serverErr && msg && String(msg).toLowerCase().includes("network")) {
        setErr(`Serverə qoşulmaq olmur. API_URL: ${API_URL}`);
      } else {
        setErr(serverErr || msg || "Xəta baş verdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !!email &&
    !!password &&
    (mode === "login" ||
      (!!fullName &&
        (role !== "SELLER" || (!!categoryId && (hasPhone || hasWhatsapp)))));

  const openLegal = (type: "privacy" | "terms") => {
    Linking.openURL(policyLink(type)).catch(() => {
      Alert.alert("Xəta", "Səhifə açıla bilmədi. İnternet bağlantını yoxlayın.");
    });
  };

  return (
    <Screen>
      {/* Brand hero */}
      <View
        style={{
          borderRadius: 22,
          padding: 18,
          backgroundColor: theme.colors.primary,
          overflow: "hidden",
        }}
      >
        {/* bubbles */}
        <View
          style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: "rgba(255,255,255,0.14)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: -40,
            bottom: -50,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "rgba(255,255,255,0.10)",
          }}
        />

        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 230, height: 62, resizeMode: "contain" }}
        />

        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.88)" }}>
          Axtar • Sorğu ver • Tap
        </Text>
      </View>

      {/* Auth card */}
      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 12, paddingVertical: 16 }}>
          <SegmentedButtons
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            buttons={[
              { value: "login", label: "Giriş" },
              { value: "register", label: "Qeydiyyat" },
            ]}
          />

          <Text variant="titleMedium">{title}</Text>

          {/* Role selector (active one is highlighted) */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              mode={role === "BUYER" ? "contained" : "outlined"}
              onPress={() => setRole("BUYER")}
              icon="account"
              style={{ flex: 1, borderRadius: 16 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Alıcı
            </Button>
            <Button
              mode={role === "SELLER" ? "contained" : "outlined"}
              onPress={() => setRole("SELLER")}
              icon="store"
              style={{ flex: 1, borderRadius: 16 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Satıcı
            </Button>
          </View>

          {mode === "register" ? (
            <TextInput mode="outlined" label="Ad Soyad" value={fullName} onChangeText={setFullName} />
          ) : null}

          <TextInput mode="outlined" label="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput
            mode="outlined"
            label="Şifrə"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />

          {mode === "register" && role === "SELLER" ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Kateqoriya seç</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}>
                {catLoading ? "Kateqoriyalar yüklənir…" : `Kateqoriya sayı: ${categories.length}`}
              </Text>

              {catErr ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ color: theme.colors.error }}>{catErr}</Text>
                  <Button mode="outlined" onPress={fetchCategories} loading={catLoading}>
                    Yenilə
                  </Button>
                </View>
              ) : null}

              <SelectField
              label="Kateqoriya"
              value={categoryId}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              placeholder={catLoading ? "Yüklənir..." : "Kateqoriya seçin"}
              disabled={catLoading || categories.length === 0}
              onChange={(v) => setCategoryId(v)}
            />

              <TextInput
                mode="outlined"
                label="Əlaqə nömrəsi (telefon)"
                value={phone}
                keyboardType="phone-pad"
                onChangeText={setPhone}
              />
              <TextInput
                mode="outlined"
                label="WhatsApp nömrəsi"
                value={whatsapp}
                keyboardType="phone-pad"
                onChangeText={(t) => setWhatsapp(normalizeWhatsapp(t))}
              />
              <HelperText type="info" visible={true}>
                Satıcı üçün telefon və ya WhatsApp nömrələrindən ən az biri mütləqdir.
              </HelperText>

              {!catLoading && categories.length === 0 && !catErr ? (
                <Button mode="outlined" onPress={fetchCategories}>
                  Kateqoriyaları yenilə
                </Button>
              ) : null}
            </View>
          ) : null}

          <HelperText type="error" visible={!!err}>
            {String(err || "")}
          </HelperText>

          <Button
            mode="contained"
            loading={loading}
            disabled={!canSubmit}
            onPress={submit}
            style={{ borderRadius: 16, paddingVertical: 6 }}
          >
            {mode === "login" ? "Daxil ol" : "Qeydiyyat"}
          </Button>

          {mode === "register" ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, opacity: 0.85, lineHeight: 18 }}>
              Qeydiyyatdan keçməklə siz{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: "800" }} onPress={() => openLegal("terms")}>
                İstifadəçi qaydaları
              </Text>
              {' '}və{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: "800" }} onPress={() => openLegal("privacy")}>
                Məxfilik siyasəti
              </Text>
              {' '}ilə razılaşırsınız.
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    </Screen>
  );
}
