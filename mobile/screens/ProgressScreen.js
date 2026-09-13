import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";

export default function ProgressScreen() {
  const { token, user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.getMyProgress(token).then(setData).catch(console.error);
  }, [token]);

  useEffect(load, []);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.resolve(load()).finally(() => setRefreshing(false));
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>My Progress</Text>
      <Text style={styles.name}>{user?.name} • {user?.rollNumber || user?.email}</Text>

      {data && (
        <View>
          <StatCard label="Attendance" value={`${data.attendance.percentage}%`} sub={`${data.attendance.presentClasses}/${data.attendance.totalClasses} classes`} color={data.attendance.percentage >= 75 ? colors.emerald : colors.rose} />
          <StatCard label="Assignment Average" value={data.assignments.averagePercentage != null ? `${data.assignments.averagePercentage}%` : "N/A"} sub={`${data.assignments.graded}/${data.assignments.totalSubmitted} graded`} color={colors.gold} />
          <StatCard label="Exam Average" value={data.exams.averagePercentage != null ? `${data.exams.averagePercentage}%` : "N/A"} sub={`${data.exams.totalAttempted} exams attempted`} color={colors.ink} />

          {data.exams.results.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Exam Results</Text>
              {data.exams.results.map((r, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.rowLabel}>{r.title}</Text>
                  <Text style={styles.rowValue}>{r.score}/{r.total}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      <Text style={styles.logout} onPress={logout}>Log out</Text>
    </ScrollView>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <View style={styles.card}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: "700", color: colors.ink },
  name: { color: colors.slate, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  statLabel: { fontSize: 12, color: colors.slate, textTransform: "uppercase", fontWeight: "600" },
  statValue: { fontSize: 30, fontWeight: "700", marginTop: 4 },
  statSub: { fontSize: 12, color: colors.slate, marginTop: 2 },
  cardTitle: { fontWeight: "700", color: colors.ink, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.ink },
  rowValue: { color: colors.slate, fontWeight: "600" },
  logout: { textAlign: "center", color: colors.rose, marginVertical: 24 },
});
