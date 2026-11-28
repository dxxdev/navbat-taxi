import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDriverQueue } from "@/data/driverQueue";
import { DriverHeader } from "@/features/driver/DriverHeader";
import DriverQueueScreen from "@/features/driver/DriverQueueScreen";
import { PublishScreen } from "@/features/driver/PublishScreen";

export default function DriverHome() {
  const queue = useDriverQueue();

  let body: ReactNode;
  if (queue.isLoading) {
    body = <ActivityIndicator size="large" style={styles.loader} />;
  } else if (queue.isError || queue.data) {
    // Xato bo'lsa ham navbat ekrani ochiladi: u xatoni va "Yangilash" tugmasini o'zi ko'rsatadi
    body = <DriverQueueScreen />;
  } else {
    body = <PublishScreen />;
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
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  body: { flex: 1 },
  loader: { marginTop: 48 },
});