import React, { useMemo, useState } from "react";
import { View } from "react-native";
import {
  List,
  Modal,
  Portal,
  Searchbar,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

export type SelectOption = { label: string; value: string; description?: string | null };

type Props = {
  label: string;
  value: string | null | undefined;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  errorText?: string | null;
  onChange: (value: string) => void;
};

/**
 * A lightweight, dependency-free select field.
 *
 * NOTE: React Native Paper's TextInput can sometimes swallow press events on Android
 * when editable={false}. We wrap it with TouchableRipple to ensure the modal opens.
 */
export function SelectField({
  label,
  value,
  options,
  placeholder = "Seçin...",
  disabled,
  errorText,
  onChange,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label || "").toLowerCase().includes(q));
  }, [options, query]);

  const openModal = () => {
    if (!disabled) setOpen(true);
  };

  return (
    <>
      <TouchableRipple onPress={openModal} disabled={disabled} borderless>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={selected?.label || ""}
            placeholder={placeholder}
            disabled={disabled}
            editable={false}
            right={<TextInput.Icon icon="chevron-down" />}
            error={!!errorText}
          />
        </View>
      </TouchableRipple>

      {errorText ? <Text style={{ color: theme.colors.error, marginTop: 6 }}>{errorText}</Text> : null}

      <Portal>
        <Modal
          visible={open}
          onDismiss={() => {
            setOpen(false);
            setQuery("");
          }}
          contentContainerStyle={{
            margin: 16,
            borderRadius: 18,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surfaceVariant,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>{label}</Text>
            <Searchbar placeholder="Axtar..." value={query} onChangeText={setQuery} />
          </View>

          <View style={{ maxHeight: 420 }}>
            {filtered.map((o) => {
              const active = o.value === value;
              return (
                <List.Item
                  key={o.value}
                  title={o.label}
                  description={o.description || undefined}
                  left={(props) => (
                    <List.Icon {...props} icon={active ? "check-circle" : "circle-outline"} />
                  )}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                />
              );
            })}

            {filtered.length === 0 ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Nəticə tapılmadı.</Text>
              </View>
            ) : null}
          </View>
        </Modal>
      </Portal>
    </>
  );
}
