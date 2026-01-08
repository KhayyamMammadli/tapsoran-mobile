import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { SelectField } from "./SelectField";
import { api } from "../lib/api";
import { useToast } from "../state/ToastContext";

export type ReportUserDialogProps = {
  visible: boolean;
  onDismiss: () => void;
  targetUser: { id: string; fullName?: string | null; email?: string | null };
  requestId?: string | null;
};

const REASONS = [
  "Fırıldaqçılıq",
  "Saxta sorğu / saxta elan",
  "Qanunsuz məhsul",
  "Təhqir / etikadan kənar davranış",
  "Spam",
  "Digər",
];

export function ReportUserDialog({ visible, onDismiss, targetUser, requestId }: ReportUserDialogProps) {
  const theme = useTheme();
  const toast = useToast();

  const options = useMemo(() => REASONS.map((x) => ({ label: x, value: x })), []);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/complaints", {
        targetUserId: targetUser.id,
        reason,
        details: details.trim() || undefined,
        requestId: requestId || undefined,
      });
      toast.show("Şikayət göndərildi");
      setDetails("");
      onDismiss();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Şikayət göndərilmədi";
      toast.show(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => (!loading ? onDismiss() : null)}
        style={{ borderRadius: 22 }}
      >
        <Dialog.Title>Şikayət et</Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}>
            Kimdən: <Text style={{ fontWeight: "800" }}>{targetUser.fullName || "İstifadəçi"}</Text>
          </Text>

          <SelectField label="Səbəb" value={reason} onChange={setReason} options={options} />

          <View style={{ height: 10 }} />
          <TextInput
            mode="outlined"
            label="Əlavə qeyd (istəyə bağlı)"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            Ləğv et
          </Button>
          <Button
            mode="contained"
            onPress={submit}
            loading={loading}
            disabled={loading || !reason}
            style={{ borderRadius: 14 }}
          >
            Göndər
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
