import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { useSession } from "@/core/auth";
import { strings } from "@/l10n/strings";

// Placeholder
export default function PassengerHome() {
  const { signOut } = useSession();
  return (
    <Screen>
      <Text variant="headlineMedium">{strings.placeholders.passengerTitle}</Text>
      <Text variant="bodyMedium">{strings.placeholders.passengerBody}</Text>
      <Button mode="outlined" contentStyle={{ height: 52 }} onPress={signOut}>
        {strings.common.signOut}
      </Button>
    </Screen>
  );
}