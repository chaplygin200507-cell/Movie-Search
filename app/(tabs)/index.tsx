import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MovieListItem } from "@/components/MovieListItem";
import { SafeButton } from "@/components/SafeButton";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useColors } from "@/hooks/useColors";
import { fetchMovies as apiFetchMovies } from "@/lib/api";
import type { OMDbMovie, OMDbSearchResponse } from "@/types/movie";

const CATEGORIES = [
  { label: "Все", genre: "" },
  { label: "Топ", genre: "top" },
  { label: "Боевики", genre: "Action" },
  { label: "Драма", genre: "Drama" },
  { label: "Комедии", genre: "Comedy" },
  { label: "Ужасы", genre: "Horror" },
  { label: "Фантастика", genre: "Sci-Fi" },
];

async function fetchMovies(genre: string): Promise<OMDbMovie[]> {
  const res = await apiFetchMovies(genre);
  const json: OMDbSearchResponse = await res.json();
  return json.Search ?? [];
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const cat = CATEGORIES[activeIdx];

  const { data, isLoading } = useQuery({
    queryKey: ["movies", cat.genre],
    queryFn: () => fetchMovies(cat.genre),
    staleTime: 300_000,
  });

  const topPad = insets.top + 16;
  const bottomPad = insets.bottom + 84;
  const skeletons = Array.from({ length: 8 });

  const ListHeader = (
    <View>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>К</Text>
        <Text style={[styles.logoAccent, { color: colors.foreground }]}>АДР</Text>
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        renderItem={({ item, index }) => {
          const active = activeIdx === index;
          return (
            <SafeButton
              onPress={() => setActiveIdx(index)}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderRadius: 20,
                  marginLeft: index === 0 ? 0 : 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
            </SafeButton>
          );
        }}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <FlatList
          data={skeletons}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          renderItem={() => <SkeletonCard />}
        />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.imdbID}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => <MovieListItem movie={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  logoAccent: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  pills: { paddingHorizontal: 16, paddingBottom: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  list: { paddingHorizontal: 16, paddingTop: 4 },
});
