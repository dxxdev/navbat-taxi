import { LoadingView } from "@/components/LoadingView";

// Kirish nuqtasi ("/"): yo'naltirishni ildiz _layout.tsx dagi resolveRedirect bajaradi.
// Bu ekran faqat yo'naltirish ishlagunga qadar ko'rinadi.
export default function Index() {
  return <LoadingView />;
}