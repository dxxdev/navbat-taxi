import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

import { getErrorMessage } from "@/core/errors";
import { useMyDriver } from "@/data/driver";
import { strings } from "@/l10n/strings";

export default function DriverStatusScreen() {
  const { data, isLoading, isError, error, refetch, isFetching } = useMyDriver();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (isError) {
    return (
      <View style={styles.center}>
        <View style={styles.content}>
          <Text variant="bodyLarge">{getErrorMessage(error)}</Text>
          <Button mode="contained" onPress={() => refetch()} contentStyle={styles.btnContent}>
            {strings.driver.refresh}
          </Button>
        </View>
      </View>
    );
  }
  if (!data) return <Redirect href="/driver/register" />;
  if (data.status === "approved") return <Redirect href="/driver" />;

  const blocked = data.status === "blocked";
  return (
    <View style={styles.center}>
      <View style={styles.content}>
        <Text variant="headlineSmall">
          {blocked ? strings.driver.statusBlockedTitle : strings.driver.statusPendingTitle}
        </Text>
        <Text variant="bodyLarge">
          {blocked ? strings.driver.statusBlockedText : strings.driver.statusPendingText}
        </Text>
        {!blocked ? (
          <Button
            mode="contained"
            icon="refresh"
            loading={isFetching}
            disabled={isFetching}
            onPress={() => refetch()}
            contentStyle={styles.btnContent}
          >
            {strings.driver.refresh}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  content: { width: "100%", maxWidth: 600, gap: 16 },
  btnContent: { minHeight: 52 },
});