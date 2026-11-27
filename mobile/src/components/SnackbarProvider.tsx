import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar } from "react-native-paper";

import { getErrorMessage } from "@/core/errors";
import { strings } from "@/l10n/strings";

type SnackbarContextValue = {
  /** Supabase/Auth xatosini o'zbekcha matnga o'girib ko'rsatadi */
  showError: (error: unknown) => void;
  showMessage: (text: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);

  const showMessage = useCallback((t: string) => setText(t), []);
  const showError = useCallback((error: unknown) => setText(getErrorMessage(error)), []);
  const value = useMemo(() => ({ showError, showMessage }), [showError, showMessage]);

  return (
    <SnackbarContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <Snackbar
          visible={text !== null}
          onDismiss={() => setText(null)}
          duration={5000}
          wrapperStyle={styles.wrapper}
          style={styles.snackbar}
          action={{ label: strings.common.close, onPress: () => setText(null) }}
        >
          {text ?? ""}
        </Snackbar>
      </View>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar SnackbarProvider ichida ishlatilishi kerak");
  return ctx;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  wrapper: { alignItems: "center" },
  snackbar: { width: "100%", maxWidth: 600 },
});