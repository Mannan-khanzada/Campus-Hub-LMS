import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";

export default function AttendanceScreen() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.getMyAttendance(token).then(setData).catch(console.error);
  }, [token]);

  useEffect(load, []);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.resolve(load()).finally(() => setRefreshing(false));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Attendance</Text>
      <SectionList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        sections={data.map((c) => ({
          title: `${c.course.title} — ${c.percentage}%`,
          data: c.records,
          percentage: c.percentage,
        }))}
        keyExtractor={(item, i) => item.date + i}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title.split(" — ")[0]}</Text>
            <Text style={[styles.pct, { color: section.percentage >= 75 ? colors.emerald : colors.rose }]}>{section.percentage}%</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.date}>{new Date(item.date).toDateString()}</Text>
            <Text style={[styles.status, { color: item.status === "PRESENT" ? colors.emerald : item.status === "LATE" ? colors.gold : colors.rose }]}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.goldSoft, padding: 10, borderRadius: 8, marginTop: 12 },
  sectionTitle: { fontWeight: "600", color: colors.ink },
  pct: { fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  date: { color: colors.slate },
  status: { fontWeight: "600", fontSize: 12 },
  empty: { textAlign: "center", color: colors.slate, marginTop: 40 },
});
