import { StyleSheet, View } from "react-native";
import { Chip, HelperText, TextInput } from "react-native-paper";

import { formatNumber, formatSom } from "@/core/format";
import { strings } from "@/l10n/strings";

type Props = {
  text: string;
  onChangeText: (text: string) => void;
  min: number;
  max: number;
  error?: string;
};

// Narx maydoni + tez tanlov chiplari (min / o'rtacha / max)
export function FareField({ text, onChangeText, min, max, error }: Props) {
  const mid = Math.round((min + max) / 2 / 1000) * 1000;
  const quick = Array.from(new Set([min, mid, max])).sort((a, b) => a - b);

  return (
    <View>
      <TextInput
        mode="outlined"
        keyboardType="number-pad"
        value={text === "" ? "" : formatNumber(Number(text))}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, ""))}
        right={<TextInput.Affix text={strings.driver.fareUnit} />}
        error={!!error}
        style={styles.input}
      />
      <HelperText type={error ? "error" : "info"} visible>
        {error ?? `${formatSom(min)} – ${formatSom(max)}`}
      </HelperText>
      <View style={styles.chips}>
        {quick.map((v) => (
          <Chip
            key={v}
            selected={text === String(v)}
            onPress={() => onChangeText(String(v))}
            style={styles.chip}>
            {v === mid && v !== min && v !== max
              ? `${strings.driver.fareMid}: ${formatNumber(v)}`
              : formatNumber(v)}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { fontSize: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 40 },
});