
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>NavbatTaksi</Text>
        <Text style={styles.subtitle}>
          Yo'lingizga mos transportni toping
        </Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          Manzilingizga{"\n"}
          qulay yetib boring
        </Text>

        <Text style={styles.heroDescription}>
          Yo'nalishni tanlang, navbatga qo'shiling
          va safaringizni rejalashtiring.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            Yo'lovchi sifatida davom etish
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            Haydovchi sifatida davom etish
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          NavbatTaksi · MVP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 30,
    justifyContent: "space-between",
  },

  header: {
    gap: 8,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563EB",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },

  hero: {
    gap: 16,
  },

  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 44,
    color: "#0F172A",
  },

  heroDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#64748B",
  },

  actions: {
    gap: 12,
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    alignItems: "center",
  },

  footerText: {
    fontSize: 12,
    color: "#94A3B8",
  },
});
