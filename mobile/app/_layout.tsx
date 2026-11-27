import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Redirect, Stack, usePathname, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, PaperProvider, Text, useTheme } from "react-native-paper";

import { LoadingView } from "@/components/LoadingView";
import { SnackbarProvider } from "@/components/SnackbarProvider";
import { AuthProvider, useSession } from "@/core/auth";
import { resolveRedirect } from "@/core/guards";
import { theme } from "@/core/theme";
import { useProfile } from "@/data/profile";
import { strings } from "@/l10n/strings";

// Sessiya va profil tayyor bo'lguncha native splash ko'rinib turadi
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PaperProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SnackbarProvider>
            <Gate />
          </SnackbarProvider>
        </AuthProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
}

function Gate() {
  const paperTheme = useTheme();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { session, loading, signOut } = useSession();
  const profileQuery = useProfile();

  const profileLoading = !!session && profileQuery.isPending;
  const ready = !loading && !profileLoading;
  const profileFailed = ready && !!session && profileQuery.isError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Chiqishdan keyin oldingi foydalanuvchi ma'lumotlari keshda qolmasin
  useEffect(() => {
    if (!loading && !session) queryClient.clear();
  }, [loading, session, queryClient]);

  const target = ready
    ? resolveRedirect({ session, profile: profileQuery.data ?? null, pathname })
    : null;

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: paperTheme.colors.background },
        }}
      />

      {target ? <Redirect href={target as Href} /> : null}

      {/* Yuklanish qatlami: Stack o'rnatilgan holda qoladi, miltillash bo'lmaydi */}
      {!ready && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingView />
        </View>
      )}

      {profileFailed && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.center,
            { backgroundColor: paperTheme.colors.background },
          ]}
        >
          <Text variant="titleLarge">{strings.profile.loadFailedTitle}</Text>
          <Text variant="bodyMedium">{strings.profile.loadFailedBody}</Text>
          <Button
            mode="contained"
            contentStyle={styles.btn}
            onPress={() => profileQuery.refetch()}
          >
            {strings.common.retry}
          </Button>
          <Button mode="text" contentStyle={styles.btn} onPress={signOut}>
            {strings.common.signOut}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  btn: { height: 52 },
});