import React, { createContext, useContext, useMemo, useState } from "react";
import { Portal, Snackbar } from "react-native-paper";

type ToastOpts = {
  /** ms. Defaults to 3200 */
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastApi = {
  show: (message: string, opts?: ToastOpts) => void;
  hide: () => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("ToastContext missing");
  return v;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [actionLabel, setActionLabel] = useState<string | undefined>(undefined);
  const [onAction, setOnAction] = useState<(() => void) | undefined>(undefined);
  const [duration, setDuration] = useState<number>(3200);

  const api = useMemo<ToastApi>(
    () => ({
      show: (msg, opts) => {
        setMessage(String(msg || ""));
        setDuration(typeof opts?.duration === "number" ? opts!.duration : 3200);
        setActionLabel(opts?.actionLabel);
        setOnAction(() => opts?.onAction);
        setVisible(true);
      },
      hide: () => setVisible(false),
    }),
    []
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <Portal>
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={duration}
          action={
            actionLabel
              ? {
                  label: actionLabel,
                  onPress: () => {
                    try {
                      onAction?.();
                    } finally {
                      setVisible(false);
                    }
                  },
                }
              : undefined
          }
        >
          {message}
        </Snackbar>
      </Portal>
    </Ctx.Provider>
  );
}
