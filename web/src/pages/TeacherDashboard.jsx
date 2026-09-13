import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const TABS = [
  { key: "attendance", label: "Attendance" },
  { key: "assignments", label: "Assignments" },
  { key: "exams", label: "Exams" },
];

export default function TeacherDashboard() {
  const { token } = useAuth();
  const [active, setActive] = useState("attendance");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.getCourses(token).then(setCourses).catch(console.error);
  }, []);

  return (
    <Layout tabs={TABS} active={active} onChange={setActive}>
      {active === "attendance" && <AttendancePanel token={token} courses={courses} />}
      {active === "assignments" && <AssignmentsPanel token={token} courses={courses} />}
      {active === "exams" && <ExamsPanel token={token} courses={courses} />}
    </Layout>
  );
}

function AttendancePanel({ token, courses }) {
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    api.getCourseStudents(token, courseId).then((list) => {
      setStudents(list);
      const init = {};
      list.forEach((s) => (init[s.id] = "PRESENT"));
      setStatusMap(init);
    });
  }, [courseId]);

  const save = async () => {
    const records = Object.entries(statusMap).map(([studentId, status]) => ({ studentId, status }));
    await api.markAttendance(token, { courseId, date, records });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Mark Attendance</h2>
      <div className="card mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="label">Course</label>
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">-- Select course --</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn-gold" onClick={save} disabled={!courseId || students.length === 0}>Save Attendance</button>
      </div>
      {saved && <p className="text-emerald text-sm mb-4">✓ Attendance saved</p>}

      {courseId && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-slate text-xs uppercase tracking-wide">
              <tr><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Roll No.</th><th className="text-left px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-ink/5">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate">{s.rollNumber || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {["PRESENT", "ABSENT", "LATE"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusMap({ ...statusMap, [s.id]: st })}
                          className={`badge border ${statusMap[s.id] === st ? (st === "PRESENT" ? "bg-emerald text-white border-emerald" : st === "ABSENT" ? "bg-rose text-white border-rose" : "bg-gold text-white border-gold") : "border-ink/20 text-slate"}`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate">No students enrolled in this course.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AssignmentsPanel({ token, courses }) {
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", courseId: "", dueDate: "", maxMarks: 100 });
  const [grading, setGrading] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const load = () => { api.getAssignments(token).then(setAssignments).catch(console.error); };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.createAssignment(token, form);
    setForm({ title: "", description: "", courseId: "", dueDate: "", maxMarks: 100 });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    await api.deleteAssignment(token, id);
    load();
  };

  const openGrading = async (a) => {
    setGrading(a);
    const subs = await api.getSubmissions(token, a.id);
    setSubmissions(subs);
  };

  const grade = async (subId, marksObtained, feedback) => {
    await api.gradeSubmission(token, subId, { marksObtained: Number(marksObtained), feedback });
    const subs = await api.getSubmissions(token, grading.id);
    setSubmissions(subs);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">Assignments</h2>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ New Assignment"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-4">
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <label className="label">Course</label>
            <select className="input" required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">-- Select --</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Due Date</label><input type="datetime-local" className="input" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div><label className="label">Max Marks</label><input type="number" className="input" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} /></div>
          <button className="btn-primary col-span-2">Create Assignment</button>
        </form>
      )}

      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="card flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-xs text-slate">{a.course?.title} • Due {new Date(a.dueDate).toLocaleString()} • {a.submissions?.length || 0} submissions</p>
            </div>
            <div className="space-x-2">
              <button className="btn-outline text-xs" onClick={() => openGrading(a)}>Grade Submissions</button>
              <button className="text-rose text-xs" onClick={() => remove(a.id)}>Delete</button>
            </div>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-slate text-sm">No assignments created yet.</p>}
      </div>

      {grading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6" onClick={() => setGrading(null)}>
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Grading: {grading.title}</h3>
            <div className="space-y-3">
              {submissions.map((s) => (
                <SubmissionRow key={s.id} s={s} maxMarks={grading.maxMarks} onGrade={grade} />
              ))}
              {submissions.length === 0 && <p className="text-slate text-sm">No submissions yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({ s, maxMarks, onGrade }) {
  const [marks, setMarks] = useState(s.marksObtained ?? "");
  const [feedback, setFeedback] = useState(s.feedback ?? "");

  return (
    <div className="border border-ink/10 rounded-card p-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{s.student.name} ({s.student.rollNumber || "-"})</span>
        <span className={`badge ${s.status === "LATE" ? "bg-rose/10 text-rose" : "bg-emerald/10 text-emerald"}`}>{s.status}</span>
      </div>
      <p className="text-sm text-slate mb-2">{s.content}</p>
      <div className="flex gap-2 items-center">
        <input type="number" placeholder={`/ ${maxMarks}`} className="input w-24" value={marks} onChange={(e) => setMarks(e.target.value)} />
        <input placeholder="Feedback" className="input flex-1" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <button className="btn-primary text-xs" onClick={() => onGrade(s.id, marks, feedback)}>Save</button>
      </div>
    </div>
  );
}

function ExamsPanel({ token, courses }) {
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", courseId: "", durationMin: 30, startTime: "", endTime: "", totalMarks: 100 });
  const [questions, setQuestions] = useState([{ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 1 }]);
  const [results, setResults] = useState(null);

  const load = () => { api.getExams(token).then(setExams).catch(console.error); };
  useEffect(() => { load(); }, []);

  const addQuestion = () => setQuestions([...questions, { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 1 }]);
  const updateQ = (i, field, val) => {
    const q = [...questions];
    q[i][field] = val;
    setQuestions(q);
  };

  const submit = async (e) => {
    e.preventDefault();
    await api.createExam(token, { ...form, questions });
    setForm({ title: "", courseId: "", durationMin: 30, startTime: "", endTime: "", totalMarks: 100 });
    setQuestions([{ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 1 }]);
    setShowForm(false);
    load();
  };

  const viewResults = async (exam) => {
    const r = await api.getExamResults(token, exam.id);
    setResults({ exam, r });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">Online Exams</h2>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ New Exam"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Exam Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <label className="label">Course</label>
              <select className="input" required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">-- Select --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div><label className="label">Start Time</label><input type="datetime-local" className="input" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><label className="label">End Time</label><input type="datetime-local" className="input" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
            <div><label className="label">Duration (min)</label><input type="number" className="input" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} /></div>
            <div><label className="label">Total Marks</label><input type="number" className="input" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} /></div>
          </div>

          <h4 className="font-semibold text-sm mt-4">Questions (MCQ)</h4>
          {questions.map((q, i) => (
            <div key={i} className="border border-ink/10 rounded-card p-3 space-y-2">
              <input className="input" placeholder={`Question ${i + 1}`} value={q.questionText} onChange={(e) => updateQ(i, "questionText", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Option A" value={q.optionA} onChange={(e) => updateQ(i, "optionA", e.target.value)} />
                <input className="input" placeholder="Option B" value={q.optionB} onChange={(e) => updateQ(i, "optionB", e.target.value)} />
                <input className="input" placeholder="Option C" value={q.optionC} onChange={(e) => updateQ(i, "optionC", e.target.value)} />
                <input className="input" placeholder="Option D" value={q.optionD} onChange={(e) => updateQ(i, "optionD", e.target.value)} />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-xs text-slate">Correct:</label>
                <select className="input w-24" value={q.correctOption} onChange={(e) => updateQ(i, "correctOption", e.target.value)}>
                  {["A", "B", "C", "D"].map((o) => <option key={o}>{o}</option>)}
                </select>
                <label className="text-xs text-slate">Marks:</label>
                <input type="number" className="input w-20" value={q.marks} onChange={(e) => updateQ(i, "marks", Number(e.target.value))} />
              </div>
            </div>
          ))}
          <button type="button" className="btn-outline text-sm" onClick={addQuestion}>+ Add Question</button>
          <button className="btn-primary w-full">Create Exam</button>
        </form>
      )}

      <div className="space-y-3">
        {exams.map((e) => (
          <div key={e.id} className="card flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{e.title}</h3>
              <p className="text-xs text-slate">{e.course?.title} • {e._count?.questions} questions • {new Date(e.startTime).toLocaleString()}</p>
            </div>
            <button className="btn-outline text-xs" onClick={() => viewResults(e)}>View Results</button>
          </div>
        ))}
        {exams.length === 0 && <p className="text-slate text-sm">No exams created yet.</p>}
      </div>

      {results && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6" onClick={() => setResults(null)}>
          <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Results: {results.exam.title}</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-slate uppercase"><tr><th className="text-left py-2">Student</th><th className="text-left py-2">Score</th></tr></thead>
              <tbody>
                {results.r.map((a) => (
                  <tr key={a.id} className="border-t border-ink/5">
                    <td className="py-2">{a.student.name}</td>
                    <td className="py-2">{a.score} / {results.exam.totalMarks}</td>
                  </tr>
                ))}
                {results.r.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-slate">No attempts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
