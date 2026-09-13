import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";

export default function ExamsScreen({ navigation }) {
  const { token } = useAuth();
  const [exams, setExams] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.getExams(token).then(setExams).catch(console.error);
  }, [token]);

  useEffect(load, []);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.resolve(load()).finally(() => setRefreshing(false));
  };

  const status = (exam) => {
    const now = new Date();
    const attempted = exam.attempts?.length > 0;
    if (attempted) return { label: `Completed: ${exam.attempts[0].score ?? "-"}/${exam.totalMarks}`, color: colors.emerald };
    if (now < new Date(exam.startTime)) return { label: "Upcoming", color: colors.gold };
    if (now > new Date(exam.endTime)) return { label: "Closed", color: colors.rose };
    return { label: "Active now — tap to attempt", color: colors.emerald };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Online Exams</Text>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={exams}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const s = status(item);
          const now = new Date();
          const canTake = !item.attempts?.length && now >= new Date(item.startTime) && now <= new Date(item.endTime);
          return (
            <TouchableOpacity
              style={styles.card}
              disabled={!canTake}
              onPress={() => navigation.navigate("ExamTake", { examId: item.id, title: item.title })}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.course?.title} • {item.durationMin} min • {item._count?.questions} questions</Text>
              <Text style={[styles.badge, { color: s.color }]}>{s.label}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No exams scheduled yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  title: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  meta: { color: colors.slate, fontSize: 12, marginTop: 3 },
  badge: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  empty: { textAlign: "center", color: colors.slate, marginTop: 40 },
});
