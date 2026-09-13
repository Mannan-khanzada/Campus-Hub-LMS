import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const TABS = [
  { key: "teachers", label: "Teachers" },
  { key: "students", label: "Students" },
  { key: "courses", label: "Courses" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [active, setActive] = useState("teachers");

  return (
    <Layout tabs={TABS} active={active} onChange={setActive}>
      {active === "teachers" && <UserPanel token={token} role="TEACHER" title="Teachers" />}
      {active === "students" && <UserPanel token={token} role="STUDENT" title="Students" />}
      {active === "courses" && <CoursesPanel token={token} />}
    </Layout>
  );
}

function UserPanel({ token, role, title }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", rollNumber: "", department: "", phone: "" });
  const [err, setErr] = useState("");

  const load = () => api.getUsers(token, role).then(setUsers).catch(console.error);
  useEffect(() => { load(); }, [role]);

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", rollNumber: "", department: "", phone: "" });
    setEditing(null);
    setShowForm(false);
    setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (editing) {
        const { password, ...rest } = form;
        await api.updateUser(token, editing.id, password ? form : rest);
      } else {
        await api.createUser(token, { ...form, role });
      }
      resetForm();
      load();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const edit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", rollNumber: u.rollNumber || "", department: u.department || "", phone: u.phone || "" });
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.deleteUser(token, id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <button className="btn-gold" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "Cancel" : `+ Add ${role === "TEACHER" ? "Teacher" : "Student"}`}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">{editing ? "New Password (optional)" : "Password"}</label><input className="input" type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          {role === "STUDENT" && <div><label className="label">Roll Number</label><input className="input" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} /></div>}
          <div><label className="label">Department</label><input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          {err && <p className="text-rose text-sm col-span-2">{err}</p>}
          <button className="btn-primary col-span-2">{editing ? "Save Changes" : "Create Account"}</button>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              {role === "STUDENT" && <th className="text-left px-4 py-3">Roll No.</th>}
              <th className="text-left px-4 py-3">Department</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ink/5">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate">{u.email}</td>
                {role === "STUDENT" && <td className="px-4 py-3">{u.rollNumber || "-"}</td>}
                <td className="px-4 py-3">{u.department || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.isActive ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"}`}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="text-gold text-xs font-medium" onClick={() => edit(u)}>Edit</button>
                  <button className="text-rose text-xs font-medium" onClick={() => remove(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate">No {title.toLowerCase()} yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoursesPanel({ token }) {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", description: "", teacherId: "" });
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [err, setErr] = useState("");

  const load = () => {
    api.getCourses(token).then(setCourses).catch(console.error);
    api.getUsers(token, "TEACHER").then(setTeachers).catch(console.error);
    api.getUsers(token, "STUDENT").then(setStudents).catch(console.error);
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.createCourse(token, form);
      setForm({ title: "", code: "", description: "", teacherId: "" });
      setShowForm(false);
      load();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const doEnroll = async () => {
    if (!enrollStudentId) return;
    await api.enrollStudent(token, enrollTarget.id, enrollStudentId);
    setEnrollTarget(null);
    setEnrollStudentId("");
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this course?")) return;
    await api.deleteCourse(token, id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">Courses</h2>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Course"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-4">
          <div><label className="label">Course Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Course Code</label><input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-2">
            <label className="label">Assign Teacher</label>
            <select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">-- Select teacher --</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {err && <p className="text-rose text-sm col-span-2">{err}</p>}
          <button className="btn-primary col-span-2">Create Course</button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-xs text-slate">{c.code}</p>
              </div>
              <button className="text-rose text-xs" onClick={() => remove(c.id)}>Delete</button>
            </div>
            <p className="text-sm text-slate mt-2">{c.description}</p>
            <div className="flex justify-between items-center mt-4 text-xs text-slate">
              <span>Teacher: {c.teacher?.name || "Unassigned"}</span>
              <span>{c._count?.enrollments || 0} students</span>
            </div>
            <button className="btn-outline text-xs mt-3 w-full" onClick={() => setEnrollTarget(c)}>Enroll Student</button>
          </div>
        ))}
      </div>

      {enrollTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center" onClick={() => setEnrollTarget(null)}>
          <div className="card w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Enroll student in {enrollTarget.title}</h3>
            <select className="input mb-4" value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)}>
              <option value="">-- Select student --</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber || s.email})</option>)}
            </select>
            <button className="btn-primary w-full" onClick={doEnroll}>Enroll</button>
          </div>
        </div>
      )}
    </div>
  );
}
