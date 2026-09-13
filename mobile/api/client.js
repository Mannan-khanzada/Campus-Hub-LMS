// Change this to your deployed backend URL, e.g. https://your-lms-backend.onrender.com/api
// For local testing on a physical phone, use your computer's LAN IP, e.g. http://192.168.1.5:4000/api
const BASE_URL = "https://penguin-extraction-hereby-extra.trycloudflare.com/api";

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

  getCourses: (token) => request("/courses", { token }),

  getMyAttendance: (token) => request("/attendance/my", { token }),

  getAssignments: (token) => request("/assignments", { token }),
  submitAssignment: (token, id, content) => request(`/assignments/${id}/submit`, { method: "POST", body: { content }, token }),

  getExams: (token) => request("/exams", { token }),
  takeExam: (token, id) => request(`/exams/${id}/take`, { token }),
  submitExam: (token, id, answers) => request(`/exams/${id}/submit`, { method: "POST", body: { answers }, token }),

  getMyProgress: (token) => request("/progress/my", { token }),
};

export { BASE_URL };
