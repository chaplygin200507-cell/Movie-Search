import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeButton } from "@/components/SafeButton";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { fetchMovieDetail } from "@/lib/api";
import { getPosterUrl, type OMDbDetail } from "@/types/movie";

async function fetchMovie(id: string): Promise<OMDbDetail> {
  const res = await fetchMovieDetail(id);
  return res.json();
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  const colors = useColors();
  if (!value || value === "N/A") return null;
  return (
    <View style={[styles.infoRow, { borderBottomColor: "rgba(128,128,128,0.15)" }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => fetchMovie(id!),
    enabled: !!id,
    staleTime: 300_000,
  });

  const fav = movie ? isFavorite(movie.imdbID) : false;

  const handleFavorite = useCallback(() => {
    if (!movie) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(movie);
  }, [movie, toggleFavorite]);

  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 24;

  const posterUrl = movie ? getPosterUrl(movie.Poster, "large") : "";
  const genres = movie?.Genre?.split(", ") ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.navBar,
          {
            paddingTop: topPad,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <SafeButton onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </SafeButton>
        {movie && (
          <SafeButton onPress={handleFavorite} style={styles.navBtn} hitSlop={8}>
            <Feather name="heart" size={22} color={fav ? "#FF4D6D" : colors.foreground} />
          </SafeButton>
        )}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Не удалось загрузить
          </Text>
        </View>
      )}

      {movie && movie.Response !== "False" && (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {posterUrl ? (
              <Image
                source={{ uri: posterUrl }}
                style={[styles.poster, { borderRadius: colors.radius }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.poster,
                  styles.noPoster,
                  { backgroundColor: colors.card, borderRadius: colors.radius },
                ]}
              >
                <Feather name="film" size={56} color={colors.mutedForeground} />
              </View>
            )}

            <View style={styles.heroInfo}>
              <Text style={[styles.title, { color: colors.foreground }]}>{movie.Title}</Text>
              <Text style={[styles.yearText, { color: colors.mutedForeground }]}>
                {movie.Year}
                {movie.Runtime && movie.Runtime !== "N/A" ? ` · ${movie.Runtime}` : ""}
              </Text>

              {movie.imdbRating && movie.imdbRating !== "N/A" && (
                <View style={styles.ratingRow}>
                  <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.ratingText}>{movie.imdbRating}</Text>
                  </View>
                  <Text style={[styles.imdbLabel, { color: colors.mutedForeground }]}>IMDb</Text>
                </View>
              )}

              {movie.Rated && movie.Rated !== "N/A" && (
                <View style={[styles.mpaBadge, { borderColor: colors.border }]}>
                  <Text style={[styles.mpaText, { color: colors.mutedForeground }]}>
                    {movie.Rated}
                  </Text>
                </View>
              )}

              {genres.length > 0 && (
                <View style={styles.genreTags}>
                  {genres.slice(0, 4).map((g) => (
                    <View
                      key={g}
                      style={[styles.genreTag, { backgroundColor: colors.secondary, borderRadius: 6 }]}
                    >
                      <Text style={[styles.genreTagText, { color: colors.secondaryForeground }]}>
                        {g}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {movie.Plot && movie.Plot !== "N/A" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Описание</Text>
              <Text style={[styles.plot, { color: colors.mutedForeground }]}>{movie.Plot}</Text>
            </View>
          )}

          <View
            style={[
              styles.infoTable,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <InfoRow label="Режиссёр" value={movie.Director} />
            <InfoRow label="В ролях" value={movie.Actors} />
            <InfoRow label="Жанр" value={movie.Genre} />
            <InfoRow label="Страна" value={movie.Country} />
            <InfoRow label="Язык" value={movie.Language} />
            <InfoRow label="Премьера" value={movie.Released} />
            <InfoRow label="Награды" value={movie.Awards} />
            <InfoRow label="Metascore" value={movie.Metascore} />
            <InfoRow label="Голоса IMDb" value={movie.imdbVotes} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  scroll: { gap: 0 },
  hero: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
    marginBottom: 20,
  },
  poster: { width: 120, height: 180 },
  noPoster: { alignItems: "center", justifyContent: "center" },
  heroInfo: { flex: 1, gap: 8, paddingTop: 4 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  yearText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ratingText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  imdbLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  mpaBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mpaText: { fontSize: 11, fontWeight: "600" },
  genreTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genreTag: { paddingHorizontal: 8, paddingVertical: 3 },
  genreTagText: { fontSize: 11, fontWeight: "500" },
  section: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  plot: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  infoTable: { marginHorizontal: 16, padding: 16 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    flex: 2,
    textAlign: "right",
  },
});
