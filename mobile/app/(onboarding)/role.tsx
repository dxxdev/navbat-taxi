import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { useSession } from "@/core/auth";
import { strings } from "@/l10n/strings";

// Placeholder: 6-qismda yoziladi
export default function RoleScreen() {
  const { signOut } = useSession();
  return (
    <Screen>
      <Text variant="headlineMedium">{strings.placeholders.roleTitle}</Text>
      <Text variant="bodyMedium">{strings.placeholders.roleBody}</Text>
      <Button mode="outlined" contentStyle={{ height: 52 }} onPress={signOut}>
        {strings.common.signOut}
      </Button>
    </Screen>
  );
}