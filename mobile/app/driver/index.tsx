import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

import { useDriverQueue } from "@/data/driverQueue";
import { DriverHeader } from "@/features/driver/DriverHeader";
import { PublishScreen } from "@/features/driver/PublishScreen";
import { QueuePlaceholder } from "@/features/driver/QueuePlaceholder";
import { strings } from "@/l10n/strings";

export default function DriverHome() {
  const queue = useDriverQueue();

  let body;
  if (queue.isPending) {
    body = <ActivityIndicator style={styles.center} />;
  } else if (queue.isError) {
    body = (
      <View style={styles.center}>
        <Text>{strings.driver.loadError}</Text>
        <Button onPress={() => queue.refetch()}>{strings.driver.retry}</Button>
      </View>
    );
  } else if (queue.data === null) {
    body = <PublishScreen />;
  } else {
    body = <QueuePlaceholder />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Web'da kontent kengligi 600 px bilan cheklanadi va markazlanadi */}
      <View style={styles.container}>
        <DriverHeader />
        <View style={styles.body}>{body}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 16, paddingTop: 8 },
  body: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
});