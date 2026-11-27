import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Umumiy ekran: web'da kontent kengligi 600 px bilan cheklanadi va markazlanadi */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24 },
  inner: { width: "100%", maxWidth: 600, flexGrow: 1, gap: 16 },
});