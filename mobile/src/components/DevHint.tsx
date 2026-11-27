import { Text } from "react-native-paper";

import { strings } from "@/l10n/strings";

/** Faqat __DEV__ rejimida ko'rinadi */
export function DevHint() {
  if (!__DEV__) return null;
  return (
    <Text variant="bodySmall" style={{ textAlign: "center", opacity: 0.6, marginTop: "auto" }}>
      {strings.dev.hint}
    </Text>
  );
}