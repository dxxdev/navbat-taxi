import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu, Text } from "react-native-paper";

import { useSession } from "@/core/auth";
import { useProfile } from "@/data/profile";
import { strings } from "@/l10n/strings";

export function DriverHeader() {
  const { signOut } = useSession();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    setOpen(false);
    await signOut();
    qc.clear(); // boshqa hisob eski ma'lumotni ko'rmasligi uchun
  }

  return (
    <View style={styles.row}>
      <Text variant="titleLarge" numberOfLines={1} style={styles.name}>
        {profile?.full_name ?? ""}
      </Text>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button mode="outlined" onPress={() => setOpen(true)}>
            {strings.driver.menu}
          </Button>
        }>
        <Menu.Item onPress={onLogout} title={strings.driver.logout} />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1 },
});