import { MD3LightTheme } from "react-native-paper";

export const PRIMARY_COLOR = "#2563EB";

// Barcha asosiy tugmalar balandligi >= 52
export const BUTTON_HEIGHT = 52;
export const buttonContentStyle = { height: BUTTON_HEIGHT } as const;

export const theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: PRIMARY_COLOR,
    onPrimary: "#FFFFFF",
    background: "#F8FAFC",
  },
};