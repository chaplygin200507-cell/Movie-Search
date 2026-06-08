import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeButton } from "@/components/SafeButton";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { getPosterUrl, type OMDbMovie } from "@/types/movie";

function FavoriteItem({ movie }: { movie: OMDbMovie }) {
  const colors = useColors();
  const router = useRouter();
  const { toggleFavorite } = useFavorites();
  const posterUrl = getPosterUrl(movie.Poster, "medium");

  return (
    <SafeButton
      onPress={() => router.push(`/movie/${movie.imdbID}`)}
      style={[
        styles.item,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={[styles.thumb, { borderRadius: colors.radius - 4 }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.noThumb,
            { backgroundColor: colors.secondary, borderRadius: colors.radius - 4 },
          ]}
        >
          <Feather name="film" size={24} color={colors.mutedForeground} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {movie.Title}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {movie.Year}
        </Text>
      </View>
      <SafeButton
        onPress={() => toggleFavorite(movie)}
        style={styles.removeBtn}
        hitSlop={8}
      >
        <Feather name="trash-2" size={18} color={colors.mutedForeground} />
      </SafeButton>
    </SafeButton>
  );
}

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();
  const topPad = insets.top + 16;
  const bottomPad = insets.bottom + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Избранное</Text>
        {favorites.length > 0 && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {favorites.length}{" "}
            {favorites.length === 1
              ? "фильм"
              : favorites.length < 5
                ? "фильма"
                : "фильмов"}
          </Text>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="heart" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Пока пусто</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Нажмите ♥ на любом фильме, чтобы добавить
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.imdbID}
          renderItem={({ item }) => <FavoriteItem movie={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  count: { fontSize: 14, fontFamily: "Inter_400Regular" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  item: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  thumb: { width: 60, height: 88 },
  noThumb: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  removeBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
