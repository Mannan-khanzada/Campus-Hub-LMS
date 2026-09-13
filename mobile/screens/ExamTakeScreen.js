import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";

export default function ExamTakeScreen({ route, navigation }) {
  const { examId, title } = route.params;
  const { token } = useAuth();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title });
    api
      .takeExam(token, examId)
      .then(setExam)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const select = (qId, option) => setAnswers({ ...answers, [qId]: option });

  const submit = () => {
    const unanswered = exam.questions.filter((q) => !answers[q.id]).length;
    const doSubmit = async () => {
      try {
        setSubmitting(true);
        const result = await api.submitExam(token, examId, answers);
        Alert.alert("Exam Submitted", `Your score: ${result.score} / ${result.totalMarks}`, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setSubmitting(false);
      }
    };

    if (unanswered > 0) {
      Alert.alert("Unanswered Questions", `You have ${unanswered} unanswered question(s). Submit anyway?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: doSubmit },
      ]);
    } else {
      doSubmit();
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.ink} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.duration}>Duration: {exam.durationMin} minutes • {exam.questions.length} questions</Text>
      {exam.questions.map((q, i) => (
        <View key={q.id} style={styles.qCard}>
          <Text style={styles.qText}>{i + 1}. {q.questionText}</Text>
          {["A", "B", "C", "D"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.option, answers[q.id] === opt && styles.optionSelected]}
              onPress={() => select(q.id, opt)}
            >
              <Text style={[styles.optionText, answers[q.id] === opt && styles.optionTextSelected]}>
                {opt}. {q[`option${opt}`]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Exam</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment, paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.parchment },
  error: { color: colors.rose },
  duration: { color: colors.slate, marginBottom: 12, fontSize: 12 },
  qCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  qText: { fontWeight: "600", color: colors.ink, marginBottom: 10 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 6 },
  optionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionText: { color: colors.ink, fontSize: 14 },
  optionTextSelected: { color: "#fff" },
  submitBtn: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 16, alignItems: "center", marginTop: 10 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
