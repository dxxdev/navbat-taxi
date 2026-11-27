import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { strings } from "@/l10n/strings";

// Hozircha placeholder: haydovchi bosh sahifasi keyingi qismda.
export default function DriverHomeScreen() {
  return (
    <View style={styles.center}>
      <Text variant="bodyLarge">{strings.driver.homePlaceholder}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
});