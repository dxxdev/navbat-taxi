import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput } from "react-native-paper";

import { DevHint } from "@/components/DevHint";
import { Screen } from "@/components/Screen";
import { useSnackbar } from "@/components/SnackbarProvider";
import { digitsFromInput, formatUzPhone, isCompletePhone, toE164 } from "@/core/phone";
import { supabase } from "@/core/supabase";
import { strings } from "@/l10n/strings";

export default function LoginScreen() {
  const router = useRouter();
  const { showError } = useSnackbar();
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = isCompletePhone(digits) && !loading;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: toE164(digits) });
      if (error) {
        showError(error);
        return;
      }
      // Faqat 9 ta raqam uzatiladi: URL'da "+" belgisi bo'shliqqa aylanib ketadi
      router.push({ pathname: "/otp", params: { phone: digits } });
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="headlineLarge" style={{ fontWeight: "800" }}>
        {strings.app.name}
      </Text>
      <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
        {strings.app.tagline}
      </Text>

      <Text variant="titleLarge" style={{ marginTop: 24 }}>
        {strings.auth.loginTitle}
      </Text>

      <TextInput
        mode="outlined"
        label={strings.auth.phoneLabel}
        left={<TextInput.Affix text={strings.auth.phonePrefix} />}
        value={formatUzPhone(digits)}
        onChangeText={(t) => setDigits(digitsFromInput(t))}
        keyboardType="number-pad"
        autoComplete="tel-national"
        placeholder="90 123 45 67"
        editable={!loading}
        onSubmitEditing={submit}
        autoFocus
      />

      <Button
        mode="contained"
        contentStyle={{ height: 52 }}
        onPress={submit}
        disabled={!canSubmit}
        loading={loading}
      >
        {strings.auth.sendCode}
      </Button>

      <DevHint />
    </Screen>
  );
}