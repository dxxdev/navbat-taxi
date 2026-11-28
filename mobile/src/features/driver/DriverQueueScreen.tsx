import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getErrorMessage } from "@/core/errors";
import { useCountdown } from "@/core/useCountdown";
import {
  type DriverBooking,
  type QueueNeighbor,
  useChangeSeats,
  useDepart,
  useDriverQueue,
  useLeaveQueue,
  useMarkArrived,
} from "@/data/driverQueue";
import { strings } from "@/l10n/strings";

const s = strings.driverQueue;
const BTN_HEIGHT = 56; // >= 52

// Xato kodini (masalan, ACTIVE_BOOKINGS_PENDING) turli ko'rinishdagi xatodan aniqlaydi
function hasErrorCode(e: unknown, code: string): boolean {
  if (typeof e !== "object" || e === null) return false;
  const o = e as { code?: unknown; message?: unknown };
  return (
    o.code === code || (typeof o.message === "string" && o.message.includes(code))
  );
}

// "Oldingi" / "Keyingi" mashina satri
function NeighborRow({ label, item }: { label: string; item: QueueNeighbor | null }) {
  return (
    <View style={styles.neighborRow}>
      <Text variant="labelLarge" style={styles.neighborLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={styles.flex}>
        {item ? `${item.position}-o'rin · ${item.model} · ${item.plate_number ?? "—"}` : "—"}
      </Text>
    </View>
  );
}

type BookingRowProps = {
  booking: DriverBooking;
  disabled: boolean;
  onArrived: (id: string) => void;
  onCall: (phone: string | null) => void;
  onExpire: () => void;
};

// Band qilgan yo'lovchi qatori (har bir qatorning o'z taymeri bor)
function BookingRow({ booking, disabled, onArrived, onCall, onExpire }: BookingRowProps) {
  const { label, expired } = useCountdown(booking.expires_at, onExpire);
  const theme = useTheme();

  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingInfo}>
        <Text variant="titleMedium">{booking.passenger_name ?? "—"}</Text>
        <Text variant="bodyMedium">{booking.passenger_phone ?? "—"}</Text>
        <Text variant="bodyMedium">{`${s.seatsCount}: ${booking.seats}`}</Text>
        <Text
          variant="titleLarge"
          style={{ color: expired ? theme.colors.error : theme.colors.primary }}
        >
          {expired ? s.timeUp : label}
        </Text>
      </View>
      <View style={styles.bookingActions}>
        <Button
          mode="contained"
          onPress={() => onArrived(booking.id)}
          disabled={disabled}
          contentStyle={styles.btnContent}
        >
          {s.arrived}
        </Button>
        <Button
          mode="outlined"
          icon="phone"
          onPress={() => onCall(booking.passenger_phone)}
          disabled={disabled || !booking.passenger_phone}
          contentStyle={styles.btnContent}
        >
          {s.call}
        </Button>
      </View>
    </View>
  );
}

export default function DriverQueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queue = useDriverQueue();
  const changeSeats = useChangeSeats();
  const markArrived = useMarkArrived();
  const depart = useDepart();
  const leave = useLeaveQueue();

  const [snack, setSnack] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "pending" | "leave">(null);

  const data = queue.data;
  // Amal davomida barcha tugmalar o'chadi (ikki marta bosishdan himoya)
  const busy =
    changeSeats.isPending || markArrived.isPending || depart.isPending || leave.isPending;

  // Reys yopilgach PublishScreen'ga qaytish
  const goToPublish = () => {
    router.replace({ pathname: "/driver", params: { closed: "1" } } as never);
  };

  const onAdjust = async (delta: 1 | -1) => {
    try {
      await changeSeats.mutateAsync(delta);
    } catch (e) {
      setSnack(getErrorMessage(e));
    }
  };

  const onArrived = async (bookingId: string) => {
    try {
      await markArrived.mutateAsync(bookingId);
    } catch (e) {
      setSnack(getErrorMessage(e));
    }
  };

  const onCall = async (phone: string | null) => {
    if (!phone) return;
    try {
      // Web'da canOpenURL ishonchsiz, shuning uchun to'g'ridan-to'g'ri ochamiz
      await Linking.openURL(`tel:${phone}`);
    } catch {
      setSnack(`${s.callFailed} ${phone}`);
    }
  };

  // "Yo'lga chiqdim": avval force = false, kelmagan yo'lovchi bo'lsa dialog
  const onDepart = async (force: boolean) => {
    try {
      await depart.mutateAsync({ force });
      setDialog(null);
      goToPublish();
    } catch (e) {
      if (!force && hasErrorCode(e, "ACTIVE_BOOKINGS_PENDING")) {
        setDialog("pending");
      } else {
        setDialog(null);
        setSnack(getErrorMessage(e));
      }
    }
  };

  const onLeaveConfirmed = async () => {
    try {
      await leave.mutateAsync();
      setDialog(null);
      goToPublish();
    } catch (e) {
      setDialog(null);
      setSnack(getErrorMessage(e));
    }
  };

  // ---- Holatlar: yuklanmoqda / xato / navbat yo'q ----
  let body: React.ReactNode;

  if (queue.isLoading) {
    body = <ActivityIndicator size="large" style={styles.loader} />;
  } else if (queue.isError) {
    body = (
      <View style={styles.centerBox}>
        <Text variant="bodyLarge">{getErrorMessage(queue.error)}</Text>
        <Button mode="contained" onPress={() => void queue.refetch()} contentStyle={styles.btnContent}>
          {s.refresh}
        </Button>
      </View>
    );
  } else if (!data) {
    body = (
      <View style={styles.centerBox}>
        <Text variant="bodyLarge">{s.noActiveEntry}</Text>
        <Button mode="contained" onPress={goToPublish} contentStyle={styles.btnContent}>
          {s.backToPublish}
        </Button>
      </View>
    );
  } else {
    const { seats_total, seats_occupied } = data.entry;
    const free = Math.max(0, data.free_seats);
    // Band = jami - o'tirgan - bo'sh
    const booked = Math.max(0, seats_total - seats_occupied - free);
    const noFree = free <= 0;

    body = (
      <>
        {/* 1. Sarlavha */}
        <View style={styles.header}>
          <Text variant="headlineSmall">{`${data.city_name} -> ${data.destination_name}`}</Text>
          <Text variant="titleMedium">{s.position(data.position, data.total_active)}</Text>
        </View>

        {/* 2. Oldingi va keyingi mashinalar */}
        <Card style={styles.card}>
          <Card.Content style={styles.gap}>
            <NeighborRow label={s.previous} item={data.prev} />
            <Divider />
            <NeighborRow label={s.next} item={data.next} />
          </Card.Content>
        </Card>

        {/* 3. O'rindiqlar */}
        <Card style={styles.card}>
          <Card.Content style={styles.gap}>
            <Text variant="titleMedium">
              {`${s.total} ${seats_total} · ${s.seated} ${seats_occupied} · ${s.booked} ${booked} · ${s.free} ${free}`}
            </Text>
            <View style={styles.row}>
              <Button
                mode="contained"
                style={styles.flex}
                contentStyle={styles.btnContent}
                labelStyle={styles.bigLabel}
                onPress={() => void onAdjust(1)}
                disabled={busy || noFree}
              >
                {s.plusOne}
              </Button>
              <Button
                mode="outlined"
                style={styles.flex}
                contentStyle={styles.btnContent}
                labelStyle={styles.bigLabel}
                onPress={() => void onAdjust(-1)}
                disabled={busy || seats_occupied <= 0}
              >
                {s.minusOne}
              </Button>
            </View>
            {noFree ? (
              <Text variant="bodySmall">{booked > 0 ? s.restBooked : s.vehicleFull}</Text>
            ) : null}
          </Card.Content>
        </Card>

        {/* 4. Band qilganlar */}
        <Card style={styles.card}>
          <Card.Content style={styles.gap}>
            <Text variant="titleMedium">{s.bookingsTitle}</Text>
            {data.bookings.length === 0 ? (
              <Text variant="bodyMedium">{s.noBookings}</Text>
            ) : (
              data.bookings.map((b, i) => (
                <View key={b.id}>
                  {i > 0 ? <Divider style={styles.rowDivider} /> : null}
                  <BookingRow
                    booking={b}
                    disabled={busy}
                    onArrived={(id) => void onArrived(id)}
                    onCall={(phone) => void onCall(phone)}
                    onExpire={() => void queue.refetch()}
                  />
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* 5. Pastki tugmalar */}
        <View style={styles.gap}>
          <Button
            mode="contained"
            contentStyle={styles.btnContent}
            onPress={() => void onDepart(false)}
            disabled={busy}
          >
            {s.depart}
          </Button>
          <Button
            mode="outlined"
            contentStyle={styles.btnContent}
            onPress={() => setDialog("leave")}
            disabled={busy}
          >
            {s.leaveQueue}
          </Button>
          <Button
            mode="text"
            contentStyle={styles.btnContent}
            onPress={() => void queue.refetch()}
            disabled={busy}
          >
            {s.refresh}
          </Button>
        </View>
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={queue.isRefetching} onRefresh={() => void queue.refetch()} />
        }
      >
        {/* Web'da kenglik 600 px bilan cheklanadi va markazlanadi */}
        <View style={styles.content}>{body}</View>
      </ScrollView>

      {/* "Yo'lga chiqdim": kelmagan yo'lovchi bor */}
      <ConfirmDialog
        visible={dialog === "pending"}
        title={s.pendingTitle}
        message={s.pendingMessage(data?.bookings.length ?? 0)}
        confirmLabel={s.departAnyway}
        cancelLabel={s.wait}
        loading={busy}
        onConfirm={() => void onDepart(true)}
        onCancel={() => setDialog(null)}
      />

      {/* "Navbatdan chiqish" tasdiqlash */}
      <ConfirmDialog
        visible={dialog === "leave"}
        title={s.leaveTitle}
        message={s.leaveMessage}
        confirmLabel={s.leaveConfirm}
        cancelLabel={s.cancel}
        loading={busy}
        onConfirm={() => void onLeaveConfirmed()}
        onCancel={() => setDialog(null)}
      />

      <Snackbar visible={snack !== null} onDismiss={() => setSnack(null)} duration={4000}>
        {snack ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { alignItems: "center", paddingTop: 8, paddingBottom: 24 },
  content: { width: "100%", maxWidth: 600, gap: 16 },
  header: { gap: 4 },
  card: { width: "100%" },
  gap: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  loader: { marginTop: 48 },
  centerBox: { gap: 16, paddingVertical: 32 },
  neighborRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  neighborLabel: { width: 72 },
  bookingRow: { gap: 12 },
  bookingInfo: { gap: 2 },
  bookingActions: { flexDirection: "row", gap: 12 },
  rowDivider: { marginVertical: 12 },
  btnContent: { height: BTN_HEIGHT },
  bigLabel: { fontSize: 20, fontWeight: "700" },
});