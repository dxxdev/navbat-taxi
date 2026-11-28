// Barcha query kalitlari shu yerda
export const queryKeys = {
  catalog: {
    cities: ["catalog", "cities"] as const,
    stations: (cityId: unknown) => ["catalog", "stations", cityId] as const,
    routes: (stationId: unknown) => ["catalog", "routes", stationId] as const,
  },
  driver: {
    me: ["driver", "me"] as const,
    queue: ["driver", "queue"] as const,
  },
};