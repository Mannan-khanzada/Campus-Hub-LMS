import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, RefreshControl, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";

export default function AssignmentsScreen() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(null);
  const [content, setContent] = useState("");

  const load = useCallback(() => {
    api.getAssignments(token).then(setAssignments).catch(console.error);
  }, [token]);

  useEffect(load, []);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.resolve(load()).finally(() => setRefreshing(false));
  };

  const openSubmit = (a) => {
    setActive(a);
    setContent(a.submissions?.[0]?.content || "");
  };

  const submit = async () => {
    if (!content.trim()) return;
    try {
      await api.submitAssignment(token, active.id, content);
      Alert.alert("Submitted", "Your assignment has been submitted successfully.");
      setActive(null);
      load();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assignments</Text>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={assignments}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const sub = item.submissions?.[0];
          return (
            <TouchableOpacity style={styles.card} onPress={() => openSubmit(item)}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.course?.title} • Due {new Date(item.dueDate).toLocaleDateString()}</Text>
              <View style={styles.badgeRow}>
                {sub ? (
                  <Text style={[styles.badge, { color: sub.status === "GRADED" ? colors.emerald : colors.gold }]}>
                    {sub.status === "GRADED" ? `Graded: ${sub.marksObtained}/${item.maxMarks}` : sub.status}
                  </Text>
                ) : (
                  <Text style={[styles.badge, { color: colors.rose }]}>Not submitted</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No assignments yet.</Text>}
      />

      <Modal visible={!!active} animationType="slide" onRequestClose={() => setActive(null)}>
        <View style={styles.modal}>
          <Text style={styles.header}>{active?.title}</Text>
          <Text style={styles.meta}>{active?.description}</Text>
          <Text style={styles.label}>Your Answer / Submission</Text>
          <TextInput
            style={styles.textarea}
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="Type your submission here, or paste a file link..."
          />
          <TouchableOpacity style={styles.button} onPress={submit}>
            <Text style={styles.buttonText}>Submit Assignment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={() => setActive(null)}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  title: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  meta: { color: colors.slate, fontSize: 12, marginTop: 3 },
  badgeRow: { marginTop: 8 },
  badge: { fontSize: 12, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.slate, marginTop: 40 },
  modal: { flex: 1, backgroundColor: colors.parchment, paddingTop: 60, paddingHorizontal: 20 },
  label: { fontSize: 12, fontWeight: "600", color: colors.slate, marginTop: 20, marginBottom: 8, textTransform: "uppercase" },
  textarea: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 160, textAlignVertical: "top" },
  button: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "700" },
  cancel: { alignItems: "center", marginTop: 16 },
  cancelText: { color: colors.slate },
});
