import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

// O'rindiqlar sonini +/- tugmalari bilan o'zgartirish.
export function Stepper({ label, value, min, max, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="bodyLarge">{label}</Text>
      <View style={styles.row}>
        <IconButton
          icon="minus"
          mode="contained-tonal"
          size={28}
          style={styles.btn}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
          accessibilityLabel="-"
        />
        <Text variant="headlineMedium" style={styles.value}>
          {value}
        </Text>
        <IconButton
          icon="plus"
          mode="contained-tonal"
          size={28}
          style={styles.btn}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
          accessibilityLabel="+"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  btn: { width: 52, height: 52, margin: 0 },
  value: { minWidth: 48, textAlign: "center" },
});