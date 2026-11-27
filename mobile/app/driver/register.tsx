import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Snackbar, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getErrorMessage } from "@/core/errors";
import { ImagePickerField } from "@/components/ImagePickerField";
import { Stepper } from "@/components/Stepper";
import {
  driverRegister,
  myDriverKey,
  uploadDriverImage,
  UploadError,
  type PickedImage,
} from "@/data/driver";
import { strings } from "@/l10n/strings";

function uploadMessage(e: UploadError): string {
  if (e.message === "BAD_TYPE") return strings.driver.uploadBadType;
  if (e.message === "TOO_LARGE") return strings.driver.uploadTooLarge;
  return strings.driver.uploadFailed;
}

export default function DriverRegisterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [license, setLicense] = useState("");
  const [licenseImg, setLicenseImg] = useState<PickedImage | null>(null);
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [seats, setSeats] = useState(4);
  const [vehicleImg, setVehicleImg] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    if (
      !license.trim() || !model.trim() || !color.trim() || !plate.trim() ||
      !licenseImg || !vehicleImg
    ) {
      setMessage(strings.driver.fillAll);
      return;
    }
    setLoading(true);
    try {
      // Avval rasmlar Storage'ga, keyin RPC.
      const licensePath = await uploadDriverImage(licenseImg, "license");
      const vehiclePath = await uploadDriverImage(vehicleImg, "vehicle");
      const res = await driverRegister({
        licenseNumber: license.trim(),
        licensePhotoPath: licensePath,
        vehicle: {
          model: model.trim(),
          color: color.trim(),
          plate_number: plate.trim(),
          seats_total: seats,
          photo_path: vehiclePath,
        },
      });
      await queryClient.invalidateQueries({ queryKey: myDriverKey });
      router.replace(res.driver_status === "approved" ? "/driver" : "/driver/status");
    } catch (e) {
      setMessage(e instanceof UploadError ? uploadMessage(e) : getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text variant="headlineSmall">{strings.driver.registerTitle}</Text>

          <TextInput
            mode="outlined"
            label={strings.driver.licenseNumber}
            value={license}
            onChangeText={setLicense}
            autoCapitalize="characters"
            disabled={loading}
          />
          <ImagePickerField
            label={strings.driver.licensePhoto}
            value={licenseImg}
            onChange={setLicenseImg}
            onError={setMessage}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label={strings.driver.vehicleModel}
            value={model}
            onChangeText={setModel}
            disabled={loading}
          />
          <TextInput
            mode="outlined"
            label={strings.driver.vehicleColor}
            value={color}
            onChangeText={setColor}
            disabled={loading}
          />
          <TextInput
            mode="outlined"
            label={strings.driver.plateNumber}
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
            disabled={loading}
          />
          <Stepper
            label={strings.driver.seatsTotal}
            value={seats}
            min={1}
            max={8}
            onChange={setSeats}
          />
          <ImagePickerField
            label={strings.driver.vehiclePhoto}
            value={vehicleImg}
            onChange={setVehicleImg}
            onError={setMessage}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={loading}
            contentStyle={styles.btnContent}
          >
            {loading ? strings.driver.submitting : strings.driver.submit}
          </Button>
          {loading ? <ActivityIndicator /> : null}
        </View>
      </ScrollView>

      <Snackbar visible={!!message} onDismiss={() => setMessage(null)} duration={5000}>
        {message ?? ""}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { alignItems: "center", paddingHorizontal: 16 },
  content: { width: "100%", maxWidth: 600, gap: 16 },
  btnContent: { minHeight: 52 },
});