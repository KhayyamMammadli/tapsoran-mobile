import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, View } from "react-native";
import {
  Button,
  Card,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
  Chip,
} from "react-native-paper";
import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { useAuth } from "../state/AuthContext";
import { Category } from "../types";
import { API_URL } from "../config";

type Mode = "login" | "register";
type Role = "BUYER" | "SELLER";

export function AuthScreen() {
  const theme = useTheme();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("BUYER");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data);
        if (res.data?.[0]?.id) setCategoryId(res.data[0].id);
      } catch {
        // ignore
      }
    })();
  }, []);

  const title = useMemo(() => (mode === "login" ? "Daxil ol" : "Qeydiyyat"), [mode]);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password, role);
      } else {
        await register({
          role,
          fullName: fullName.trim(),
          email: email.trim(),
          password,          ...(role === "SELLER" ? { categoryId } : {}),
        });

        // After a successful registration, DO NOT auto-login.
        // Switch to login form so user can choose role and sign in.
        setMode("login");
        setFullName("");
        setPassword("");
        Alert.alert(
          "Uğurlu",
          "Qeydiyyat tamamlandı. İndi login səhifəsindən daxil olun.",
          [{ text: "OK" }]
        );
      }
    } catch (e: any) {
      const serverErr = e?.response?.data?.error;
      const msg = e?.message;
      if (!serverErr && msg && String(msg).toLowerCase().includes("network")) {
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
    (mode === "login" || (!!fullName && (role !== "SELLER" || !!categoryId)));

  return (
    <Screen>
      {/* Brand hero */}
      <View
        style={{
          borderRadius: 24,
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
      <Card mode="elevated" style={{ borderRadius: 24 }}>
        <Card.Content style={{ gap: 12, paddingVertical: 16 }}>
          <SegmentedButtons
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            buttons={[
              { value: "login", label: "Login" },
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
              style={{ flex: 1, borderRadius: 14 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Alıcı
            </Button>
            <Button
              mode={role === "SELLER" ? "contained" : "outlined"}
              onPress={() => setRole("SELLER")}
              icon="store"
              style={{ flex: 1, borderRadius: 14 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Satıcı
            </Button>
          </View>

          {mode === "register" ? (
            <TextInput mode="outlined" label="Ad Soyad" value={fullName} onChangeText={setFullName} />
          ) : null}

          <TextInput mode="outlined" label="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput mode="outlined" label="Şifrə" secureTextEntry value={password} onChangeText={setPassword} />

          {mode === "register" && role === "SELLER" ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Kateqoriya seç</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    selected={categoryId === c.id}
                    onPress={() => setCategoryId(c.id)}
                    selectedColor={theme.colors.primary}
                  >
                    {c.name}
                  </Chip>
                ))}
              </View>
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

          <Text style={{ opacity: 0.55, color: theme.colors.onSurfaceVariant }}>
            API_URL: {API_URL}
          </Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}
