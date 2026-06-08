import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeButton } from "@/components/SafeButton";
import { SearchBar } from "@/components/SearchBar";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { searchMovies as apiSearch, fetchMovies as apiFetch } from "@/lib/api";
import { getPosterUrl, type OMDbMovie, type OMDbSearchResponse } from "@/types/movie";

async function searchMovies(query: string): Promise<OMDbMovie[]> {
  const res = await apiSearch(query);
  const json: OMDbSearchResponse = await res.json();
  return json.Search ?? [];
}

async function fetchPopular(): Promise<OMDbMovie[]> {
  const res = await apiFetch("");
  const json: OMDbSearchResponse = await res.json();
  return json.Search ?? [];
}

function SearchResultItem({ movie }: { movie: OMDbMovie }) {
  const colors = useColors();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(movie.imdbID);
  const posterUrl = getPosterUrl(movie.Poster, "medium");

  return (
    <View style={[styles.resultItem, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
      <SafeButton
        onPress={() => router.push(`/movie/${movie.imdbID}`)}
        style={styles.resultLeft}
      >
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={[styles.thumb, { borderRadius: colors.radius - 4 }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.noThumb, { backgroundColor: colors.secondary, borderRadius: colors.radius - 4 }]}>
            <Feather name="film" size={24} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>
            {movie.Title}
          </Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {movie.Year}
          </Text>
        </View>
      </SafeButton>
      <SafeButton onPress={() => toggleFavorite(movie)} style={styles.favButton} hitSlop={8}>
        <Feather name="heart" size={20} color={fav ? "#FF4D6D" : colors.mutedForeground} />
      </SafeButton>
    </View>
  );
}

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const topPad = insets.top + 16;
  const bottomPad = insets.bottom + 84;
  const isSearching = query.trim().length > 1;

  const { data: searchResults, isFetching: isSearchFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMovies(query),
    enabled: isSearching,
    staleTime: 60_000,
  });

  const { data: popularMovies, isLoading: isPopularLoading } = useQuery({
    queryKey: ["popular-search"],
    queryFn: fetchPopular,
    staleTime: 300_000,
  });

  const skeletons = Array.from({ length: 6 });
  const displayData = isSearching ? (searchResults ?? []) : (popularMovies ?? []);
  const isLoading = isSearching ? isSearchFetching : isPopularLoading;
  const showEmpty = isSearching && !isSearchFetching && searchResults?.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Поиск</Text>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      {showEmpty && (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ничего не найдено</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Попробуйте другой запрос</Text>
        </View>
      )}

      {!showEmpty && isLoading && (
        <FlatList
          data={skeletons}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            !isSearching ? (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Популярные фильмы
              </Text>
            ) : null
          }
          renderItem={() => <SkeletonCard />}
        />
      )}

      {!showEmpty && !isLoading && (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.imdbID}
          renderItem={({ item }) => <SearchResultItem movie={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            !isSearching ? (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Популярные фильмы
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  resultLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
  },
  thumb: { width: 60, height: 88, flexShrink: 0 },
  noThumb: { alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1, gap: 4 },
  resultTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  favButton: {
    paddingHorizontal: 14,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
