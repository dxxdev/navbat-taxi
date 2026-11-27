import { StyleSheet, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";

export function LoadingView() {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
});