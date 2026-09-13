const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: (token) => request("/auth/me", { token }),

  getUsers: (token, role) => request(`/users${role ? `?role=${role}` : ""}`, { token }),
  createUser: (token, data) => request("/users", { method: "POST", body: data, token }),
  updateUser: (token, id, data) => request(`/users/${id}`, { method: "PUT", body: data, token }),
  deleteUser: (token, id) => request(`/users/${id}`, { method: "DELETE", token }),

  getCourses: (token) => request("/courses", { token }),
  createCourse: (token, data) => request("/courses", { method: "POST", body: data, token }),
  updateCourse: (token, id, data) => request(`/courses/${id}`, { method: "PUT", body: data, token }),
  deleteCourse: (token, id) => request(`/courses/${id}`, { method: "DELETE", token }),
  enrollStudent: (token, courseId, studentId) => request(`/courses/${courseId}/enroll`, { method: "POST", body: { studentId }, token }),
  getCourseStudents: (token, courseId) => request(`/courses/${courseId}/students`, { token }),

  markAttendance: (token, data) => request("/attendance/mark", { method: "POST", body: data, token }),
  getCourseAttendance: (token, courseId) => request(`/attendance/course/${courseId}`, { token }),
  getMyAttendance: (token) => request("/attendance/my", { token }),

  getAssignments: (token) => request("/assignments", { token }),
  createAssignment: (token, data) => request("/assignments", { method: "POST", body: data, token }),
  deleteAssignment: (token, id) => request(`/assignments/${id}`, { method: "DELETE", token }),
  submitAssignment: (token, id, content) => request(`/assignments/${id}/submit`, { method: "POST", body: { content }, token }),
  getSubmissions: (token, id) => request(`/assignments/${id}/submissions`, { token }),
  gradeSubmission: (token, subId, data) => request(`/assignments/submissions/${subId}/grade`, { method: "PUT", body: data, token }),

  getExams: (token) => request("/exams", { token }),
  createExam: (token, data) => request("/exams", { method: "POST", body: data, token }),
  takeExam: (token, id) => request(`/exams/${id}/take`, { token }),
  submitExam: (token, id, answers) => request(`/exams/${id}/submit`, { method: "POST", body: { answers }, token }),
  getExamResults: (token, id) => request(`/exams/${id}/results`, { token }),

  getMyProgress: (token) => request("/progress/my", { token }),
};
