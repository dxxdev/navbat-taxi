import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

// Katta +/- tugmali stepper
export function SeatStepper({ value, min, max, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Button
        mode="contained-tonal"
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        contentStyle={styles.btnContent}
        labelStyle={styles.label}
        accessibilityLabel="-">
        −
      </Button>
      <Text variant="displaySmall" style={styles.value}>
        {value}
      </Text>
      <Button
        mode="contained-tonal"
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        contentStyle={styles.btnContent}
        labelStyle={styles.label}
        accessibilityLabel="+">
        +
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  btnContent: { minHeight: 56, minWidth: 80 },
  label: { fontSize: 28, lineHeight: 34 },
  value: { minWidth: 48, textAlign: "center" },
});