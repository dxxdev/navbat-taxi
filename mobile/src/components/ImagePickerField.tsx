import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import type { PickedImage } from "@/data/driver";
import { strings } from "@/l10n/strings";

type Props = {
  label: string;
  value: PickedImage | null;
  onChange: (image: PickedImage) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

export function ImagePickerField({ label, value, onChange, onError, disabled }: Props) {
  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.7, // hajmni 5 MB dan kichik tutish uchun
        base64: true, // fetch ishlamasa muqobil usul uchun
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      onChange({ uri: asset.uri, mimeType: asset.mimeType, base64: asset.base64 });
    } catch {
      // Ruxsat rad etilgan yoki galereya ochilmadi
      onError(strings.driver.photoPermissionDenied);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="bodyLarge">{label}</Text>
      {value ? <Image source={{ uri: value.uri }} style={styles.preview} contentFit="cover" /> : null}
      <Button
        mode="outlined"
        icon="image"
        onPress={pick}
        disabled={disabled}
        contentStyle={styles.btnContent}
      >
        {value ? strings.driver.changePhoto : strings.driver.choosePhoto}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  preview: { width: "100%", height: 180, borderRadius: 12 },
  btnContent: { minHeight: 52 },
});