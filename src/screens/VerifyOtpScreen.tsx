import React from "react";
import { View } from "react-native";
import { Button, Card, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Screen } from "../components/Screen";
import { useAuth } from "../state/AuthContext";
import { useToast } from "../state/ToastContext";

type RouteParams = {
  email: string;
  role?: "BUYER" | "SELLER";
  debugCode?: string;
};

export function VerifyOtpScreen() {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verifyRegisterOtp, resendRegisterOtp } = useAuth();

  const { email, debugCode } = (route.params || {}) as RouteParams;

  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [cooldown, setCooldown] = React.useState(30);

  React.useEffect(() => {
    setCooldown(30);
  }, [email]);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onVerify = async () => {
    setErr(null);
    const c = code.trim();
    if (c.length < 4) {
      setErr("Kodu daxil edin");
      return;
    }

    setLoading(true);
    try {
      await verifyRegisterOtp(String(email || "").trim(), c);
      toast.show("Qeydiyyat təsdiqləndi");
      // AuthContext will auto-navigate to app after token is set.
    } catch (e: any) {
      const serverErr = e?.response?.data?.error;
      const msg = e?.message;
      const raw = String(serverErr || msg || "Xəta baş verdi");

      // User-friendly mapping for common errors
      const low = raw.toLowerCase();
      if (low.includes("expired")) setErr("Kodun vaxtı bitib. Yenidən göndərin.");
      else if (low.includes("invalid code") || low.includes("invalid") || low.includes("yanlış")) setErr("Kod yanlışdır.");
      else if (low.includes("too many")) setErr("Çox cəhd etdiniz. Yeni kod istəyin.");
      else if (low.includes("otp not")) setErr("Kod tapılmadı. Yenidən kod göndərin.");
      else setErr(raw);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    setErr(null);
    setResendLoading(true);
    try {
      const res = await resendRegisterOtp(String(email || "").trim());
      setCooldown(30);
      toast.show("Yeni kod göndərildi");
      if (res?.debugCode) {
        toast.show(`Debug OTP: ${res.debugCode}`);
      }
    } catch (e: any) {
      const serverErr = e?.response?.data?.error;
      const msg = e?.message;
      setErr(String(serverErr || msg || "Xəta baş verdi"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Screen>
      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 12, paddingVertical: 16 }}>
          <Text variant="titleMedium">Email təsdiqi</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            {email ? (
              <>Emailinizə təsdiq kodu göndərildi: <Text style={{ fontWeight: "800" }}>{email}</Text></>
            ) : (
              "Email tapılmadı. Geri qayıdıb yenidən yoxlayın."
            )}
          </Text>

          {debugCode ? (
            <HelperText type="info" visible={true}>
              Debug OTP: {debugCode}
            </HelperText>
          ) : null}

          <TextInput
            mode="outlined"
            label="OTP kod"
            value={code}
            onChangeText={(t) => setCode((t || "").replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
          />

          <HelperText type="error" visible={!!err}>
            {String(err || "")}
          </HelperText>

          <Button
            mode="contained"
            loading={loading}
            disabled={!email || code.trim().length < 4}
            onPress={onVerify}
            style={{ borderRadius: 16, paddingVertical: 6 }}
          >
            Təsdiqlə
          </Button>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Button
              mode="outlined"
              onPress={onResend}
              loading={resendLoading}
              disabled={cooldown > 0 || !email}
              style={{ flex: 1, borderRadius: 16 }}
            >
              {cooldown > 0 ? `Yenidən göndər (${cooldown})` : "Kodu yenidən göndər"}
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={{ borderRadius: 16 }}
            >
              Geri
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Screen>
  );
}
