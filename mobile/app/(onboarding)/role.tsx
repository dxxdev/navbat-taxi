import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getErrorMessage } from "@/core/errors";
import { type RegisterRole, useRegisterProfile } from "@/features/onboarding/useRegisterProfile";
import { strings } from "@/l10n/strings";

type RoleCardProps = {
  icon: "person" | "car";
  title: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
};

function RoleCard({ icon, title, hint, selected, onPress }: RoleCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.card,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={40}
        color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
      <View style={styles.cardText}>
        <Text variant="titleMedium">{title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

export default function RoleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const register = useRegisterProfile();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const trimmed = fullName.trim();
  const nameValid = trimmed.length >= 2 && trimmed.length <= 60;
  const canContinue = nameValid && role !== null;

  const onConfirm = () => {
    if (!role) return;
    setConfirmOpen(false);
    register.mutate(
      { role, fullName: trimmed },
      { onError: (e) => setErrorText(getErrorMessage(e)) },
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text variant="headlineMedium">{strings.role.title}</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {strings.role.subtitle}
          </Text>

          <TextInput
            mode="outlined"
            label={strings.role.nameLabel}
            value={fullName}
            onChangeText={setFullName}
            maxLength={60}
            autoCapitalize="words"
            autoComplete="name"
            style={styles.input}
          />

          <RoleCard
            icon="person"
            title={strings.role.passengerCard}
            hint={strings.role.passengerHint}
            selected={role === "passenger"}
            onPress={() => setRole("passenger")}
          />
          <RoleCard
            icon="car"
            title={strings.role.driverCard}
            hint={strings.role.driverHint}
            selected={role === "driver"}
            onPress={() => setRole("driver")}
          />

          <View style={styles.warning}>
            <Ionicons name="information-circle" size={20} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {strings.role.warning}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={() => setConfirmOpen(true)}
            disabled={!canContinue || register.isPending}
            loading={register.isPending}
            contentStyle={styles.buttonContent}
          >
            {strings.role.continue}
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={confirmOpen} onDismiss={() => setConfirmOpen(false)}>
          <Dialog.Title>{strings.role.confirmTitle}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {role === "driver" ? strings.role.confirmDriver : strings.role.confirmPassenger}
            </Text>
            <Text variant="bodyMedium" style={styles.dialogWarning}>
              {strings.role.warning}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmOpen(false)}>{strings.role.cancel}</Button>
            <Button onPress={onConfirm}>{strings.role.confirm}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={errorText !== null} onDismiss={() => setErrorText(null)} duration={5000}>
        {errorText ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center", paddingHorizontal: 16 },
  // Web'da ham kontent kengligi 600 px bilan cheklanadi va markazlanadi
  content: { width: "100%", maxWidth: 600, gap: 16 },
  input: { marginTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    minHeight: 96,
    borderWidth: 2,
    borderRadius: 16,
  },
  cardText: { flex: 1, gap: 4 },
  warning: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonContent: { height: 56 },
  dialogWarning: { marginTop: 12, fontWeight: "600" },
});