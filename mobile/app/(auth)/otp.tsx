import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Text, TextInput } from "react-native-paper";

import { DevHint } from "@/components/DevHint";
import { Screen } from "@/components/Screen";
import { useSnackbar } from "@/components/SnackbarProvider";
import { formatUzPhone, isCompletePhone, toE164 } from "@/core/phone";
import { supabase } from "@/core/supabase";
import { strings } from "@/l10n/strings";

const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const { showError, showMessage } = useSnackbar();
  const params = useLocalSearchParams<{ phone?: string | string[] }>();
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const submitting = useRef(false); // ikki marta yuborilmasligi uchun

  // Raqam yo'q yoki noto'g'ri bo'lsa (masalan, to'g'ridan-to'g'ri /otp ochilsa) — loginga
  useEffect(() => {
    if (!phone || !isCompletePhone(phone)) router.replace("/login");
  }, [phone, router]);

  // 60 soniyalik taymer
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verify = useCallback(
    async (token: string) => {
      if (!phone || submitting.current) return;
      submitting.current = true;
      setLoading(true);
      try {
        const { error } = await supabase.auth.verifyOtp({
          phone: toE164(phone),
          token,
          type: "sms",
        });
        // Muvaffaqiyatda sessiya onAuthStateChange orqali keladi, yo'naltirishni ildiz guard bajaradi
        if (error) {
          showError(error);
          setCode("");
        }
      } catch (e) {
        showError(e);
        setCode("");
      } finally {
        submitting.current = false;
        setLoading(false);
      }
    },
    [phone, showError],
  );

  function onChangeCode(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) verify(digits); // 6-raqamda avtomatik yuborish
  }

  async function resend() {
    if (!phone || seconds > 0 || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
      if (error) {
        showError(error);
        return;
      }
      setCode("");
      setSeconds(RESEND_SECONDS);
      showMessage(strings.auth.resent);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  if (!phone || !isCompletePhone(phone)) return null;

  return (
    <Screen>
      <Text variant="headlineMedium" style={{ fontWeight: "700" }}>
        {strings.auth.otpTitle}
      </Text>
      <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
        {strings.auth.otpSentTo(`+998 ${formatUzPhone(phone)}`)}
      </Text>

      <TextInput
        mode="outlined"
        label={strings.auth.otpLabel}
        value={code}
        onChangeText={onChangeCode}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        editable={!loading}
        autoFocus
        contentStyle={{ fontSize: 24, letterSpacing: 8, textAlign: "center" }}
      />

      <Button
        mode="contained"
        contentStyle={{ height: 52 }}
        onPress={() => verify(code)}
        disabled={code.length !== 6 || loading}
        loading={loading}
      >
        {strings.auth.verify}
      </Button>

      <Button
        mode="outlined"
        contentStyle={{ height: 52 }}
        onPress={resend}
        disabled={seconds > 0 || loading}
      >
        {seconds > 0 ? strings.auth.resendIn(seconds) : strings.auth.resend}
      </Button>

      <Button
        mode="text"
        contentStyle={{ height: 52 }}
        onPress={() => router.replace("/login")}
        disabled={loading}
      >
        {strings.auth.changeNumber}
      </Button>

      <DevHint />
    </Screen>
  );
}