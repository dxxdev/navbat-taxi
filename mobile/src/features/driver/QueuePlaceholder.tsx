import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Snackbar, Text } from "react-native-paper";

import { useLeaveQueue } from "@/data/driverQueue";
import { strings } from "@/l10n/strings";

// 11-qismda to'liq navbat ekraniga almashtiriladi
export function QueuePlaceholder() {
  const leave = useLeaveQueue();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function onLeave() {
    setConfirm(false);
    leave.mutate(undefined, { onError: (e) => setMessage(e.message) });
  }

  return (
    <View style={styles.center}>
      <Text variant="headlineMedium">{strings.driver.inQueue}</Text>
      <Button
        mode="outlined"
        loading={leave.isPending}
        disabled={leave.isPending}
        contentStyle={styles.btnContent}
        onPress={() => setConfirm(true)}>
        {strings.driver.leave}
      </Button>

      <Portal>
        <Dialog visible={confirm} onDismiss={() => setConfirm(false)}>
          <Dialog.Title>{strings.driver.leaveTitle}</Dialog.Title>
          <Dialog.Content>
            <Text>{strings.driver.leaveText}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(false)}>{strings.driver.cancel}</Button>
            <Button onPress={onLeave}>{strings.driver.confirmLeave}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={message !== null} onDismiss={() => setMessage(null)}>
        {message ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  btnContent: { minHeight: 52, paddingHorizontal: 16 },
});