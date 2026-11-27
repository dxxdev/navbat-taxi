import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { strings } from "@/l10n/strings";
import { useSession } from "@/core/auth";
import { theme } from "@/core/theme";

// Haydovchi ro'yxatdan o'tishi keyingi qismda yoziladi
export default function DriverRegisterPlaceholder() {
  const theme = useTheme();

  const { session, loading, signOut } = useSession();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleMedium" style={styles.text}>
        {strings.driver.registerPlaceholder}
      </Text>
      <Button mode="text" contentStyle={styles.btn} onPress={signOut}>
        {strings.common.signOut}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 24,
  },
  text: { textAlign: "center", maxWidth: 600 },
  btn: {
    width: 200,
    padding: 12,
    fontSize: 36,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.primary
  },
});
