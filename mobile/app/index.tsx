import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

import { ScreenContainer } from "@/components/ScreenContainer";
import { config, isSupabaseKeyMissing } from "@/core/config";
import { supabase } from "@/core/supabase";
import { buttonContentStyle } from "@/core/theme";
import { strings } from "@/l10n/strings";

// Ulanishni tekshirish: sessiya saqlagichi ishlaydimi + Auth servisi javob beradimi
async function checkConnection(): Promise<boolean> {
  if (isSupabaseKeyMissing) return false;
  const { error } = await supabase.auth.getSession();
  if (error) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${config.supabaseUrl}/auth/v1/health`, {
      headers: { apikey: config.supabasePublishableKey },
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function HomeScreen() {
  const theme = useTheme();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["connection"],
    queryFn: checkConnection,
    retry: false,
  });

  const connected = data === true;
  const statusText = isFetching
    ? strings.connection.checking
    : connected
      ? strings.connection.connected
      : strings.connection.disconnected;
  const statusColor = isFetching
    ? theme.colors.outline
    : connected
      ? "#16A34A"
      : theme.colors.error;

  return (
    <ScreenContainer style={styles.container}>
      <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: "800" }}>
        {strings.appName}
      </Text>

      <View style={styles.statusRow}>
        <Text variant="titleMedium">{strings.connection.label}:</Text>
        {isFetching ? (
          <ActivityIndicator size="small" />
        ) : (
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
        )}
        <Text variant="titleMedium" style={{ color: statusColor }}>
          {statusText}
        </Text>
      </View>

      {isSupabaseKeyMissing && (
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          {strings.connection.keyMissing}
        </Text>
      )}

      <Button
        mode="contained"
        contentStyle={buttonContentStyle}
        onPress={() => refetch()}
        disabled={isFetching}
      >
        {strings.connection.retry}
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center", gap: 20 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});