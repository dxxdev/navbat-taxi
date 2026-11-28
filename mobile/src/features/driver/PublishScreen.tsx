import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  RadioButton,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";

import { formatSom } from "@/core/format";
import { useCities, useRoutes, useStations } from "@/data/catalog";
import type { Route } from "@/data/catalog";
import { useJoinQueue, useMyVehicles } from "@/data/driverQueue";
import type { Vehicle } from "@/data/driverQueue";
import { strings } from "@/l10n/strings";

import { FareField } from "./FareField";
import { SeatStepper } from "./SeatStepper";

export function PublishScreen() {
  const theme = useTheme();
  const me = useMyVehicles();;
  const join = useJoinQueue();

  // Prototip: birinchi faol shahar va birinchi faol vokzal ishlatiladi
  const cities = useCities();
  const city = cities.data?.[0];
  const stations = useStations(city?.id);
  const station = stations.data?.[0];
  const routes = useRoutes(station?.id);

  const [routeId, setRouteId] = useState<Route["id"] | null>(null);
  const [vehicleId, setVehicleId] = useState<Vehicle["id"] | null>(null);
  const [seatsState, setSeatsState] = useState<number | null>(null);
  const [fareText, setFareText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const vehicles = me.data ?? [];
  const vehicle =
    vehicles.find((v) => v.id === vehicleId) ?? (vehicles.length === 1 ? vehicles[0] : undefined);
  const seats = vehicle ? Math.min(seatsState ?? vehicle.seats_total, vehicle.seats_total) : 1;

  const route = routes.data?.find((r) => r.id === routeId);
  const fare = fareText === "" ? NaN : Number(fareText);
  const fareInRange = !!route && fare >= route.fare_min && fare <= route.fare_max;
  const fareError =
    route && fareText !== "" && !fareInRange
      ? `Narx ${formatSom(route.fare_min)} – ${formatSom(route.fare_max)} oralig'ida bo'lishi kerak`
      : undefined;

  const canSubmit = !!route && !!vehicle && fareInRange && !join.isPending;

  function selectRoute(r: Route) {
    setRouteId(r.id);
    setFareText(String(r.fare_max)); // boshlang'ich qiymat: yuqori chegara
  }

  function submit() {
    if (!route || !vehicle) return;
    join.mutate(
      { routeId: route.id, vehicleId: vehicle.id, seats, fare },
      { onError: (e) => setMessage(e.message) }, // masalan OUTSIDE_STATION_AREA
    );
  }

  if (me.isPending || cities.isPending || stations.isPending || routes.isPending) {
    // routes enabled=false bo'lganda isPending true qoladi; shuning uchun shartni aniqlashtiramiz
    const waiting = me.isPending || cities.isPending || (!!city && stations.isPending) || (!!station && routes.isPending);
    if (waiting) return <ActivityIndicator style={styles.center} />;
  }

  if (me.isError || cities.isError || stations.isError || routes.isError) {
    return (
      <View style={styles.center}>
        <Text>{strings.driver.loadError}</Text>
        <Button
          onPress={() => {
            me.refetch();
            cities.refetch();
            stations.refetch();
            routes.refetch();
          }}>
          {strings.driver.retry}
        </Button>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall">{strings.driver.publishTitle}</Text>

        {/* Yo'nalish */}
        <View style={styles.section}>
          <Text variant="titleMedium">{strings.driver.route}</Text>
          {city && station ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {city.name_uz} · {station.name}
            </Text>
          ) : null}
          {routes.data && routes.data.length > 0 ? (
            routes.data.map((r) => {
              const selected = r.id === routeId;
              return (
                <Pressable
                  key={String(r.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => selectRoute(r)}>
                  <Surface
                    elevation={0}
                    style={[
                      styles.card,
                      {
                        borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                        backgroundColor: selected
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                      },
                    ]}>
                    <RadioButton.Android
                      value={String(r.id)}
                      status={selected ? "checked" : "unchecked"}
                      onPress={() => selectRoute(r)}
                    />
                    <View style={styles.cardText}>
                      <Text variant="titleMedium">
                        {city?.name_uz} → {r.destination_name}
                      </Text>
                      <Text variant="bodyMedium">
                        {formatSom(r.fare_min)} – {formatSom(r.fare_max)}
                      </Text>
                    </View>
                  </Surface>
                </Pressable>
              );
            })
          ) : (
            <Text>{strings.driver.noRoutes}</Text>
          )}
        </View>

        {/* Mashina */}
        <View style={styles.section}>
          <Text variant="titleMedium">{strings.driver.vehicle}</Text>
          {vehicles.length === 0 ? (
            <Text>{strings.driver.noVehicle}</Text>
          ) : vehicles.length === 1 ? (
            <Text variant="bodyLarge">
              {vehicles[0].model} · {vehicles[0].color} · {vehicles[0].plate_number}
            </Text>
          ) : (
            vehicles.map((v) => (
              <Button
                key={String(v.id)}
                mode={vehicle?.id === v.id ? "contained" : "outlined"}
                contentStyle={styles.btnContent}
                onPress={() => {
                  setVehicleId(v.id);
                  setSeatsState(null);
                }}>
                {v.model} · {v.plate_number}
              </Button>
            ))
          )}
        </View>

        {/* Jami bo'sh o'rindiq */}
        {vehicle ? (
          <View style={styles.section}>
            <Text variant="titleMedium">{strings.driver.seats}</Text>
            <SeatStepper value={seats} min={1} max={vehicle.seats_total} onChange={setSeatsState} />
          </View>
        ) : null}

        {/* Narx */}
        {route ? (
          <View style={styles.section}>
            <Text variant="titleMedium">{strings.driver.fare}</Text>
            <FareField
              text={fareText}
              onChangeText={setFareText}
              min={route.fare_min}
              max={route.fare_max}
              error={fareError}
            />
          </View>
        ) : null}

        <Button
          mode="contained"
          disabled={!canSubmit}
          loading={join.isPending}
          onPress={submit}
          contentStyle={styles.btnContent}>
          {strings.driver.join}
        </Button>
      </ScrollView>

      <Snackbar visible={message !== null} onDismiss={() => setMessage(null)} duration={5000}>
        {message ?? ""}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  content: { gap: 24, paddingVertical: 16 },
  section: { gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    minHeight: 72,
    gap: 8,
  },
  cardText: { flex: 1 },
  btnContent: { minHeight: 52 },
});