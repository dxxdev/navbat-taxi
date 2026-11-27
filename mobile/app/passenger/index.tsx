import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "@/core/supabase";
import { useProfile } from "@/data/profile";
import { strings } from "@/l10n/strings";

export default function PassengerHome() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear(); // keyingi foydalanuvchiga eski kesh ko'rinmasin
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium">
          {strings.passenger.welcome(profile?.full_name ?? "")}
        </Text>
        <Button mode="outlined" onPress={onSignOut} contentStyle={styles.buttonContent}>
          {strings.passenger.signOut}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", paddingHorizontal: 16 },
  content: { width: "100%", maxWidth: 600, gap: 24 },
  buttonContent: { height: 56 },
});