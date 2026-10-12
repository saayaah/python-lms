export type User = { id: string; email: string; name: string; role: string };
export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  published: boolean;
};
export type CourseDetail = Course & {
  modules: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{ id: string; title: string; slug: string; content: string; position: number; quizzes: Array<{ id: string; title: string }> }>;
  }>;
};

export type DashboardSummary = {
  name: string;
  role: string;
  enrolled_courses: number;
  completed_lessons: number;
  quiz_attempts: number;
  total_lessons: number;
  recommendation: string;
  courses: Array<{
    id: string;
    title: string;
    difficulty: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
};

export type AdminOverview = {
  role: string;
  course_count: number;
  student_count: number;
  completion_rate: number;
};

type Envelope<T> = { success: boolean; data: T; message?: string; errors: string[] };
const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

type Session = { access_token: string; refresh_token: string; user: User };

function clearSession(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function saveSession(session: Pick<Session, "access_token" | "refresh_token">): void {
  localStorage.setItem("access_token", session.access_token);
  localStorage.setItem("refresh_token", session.refresh_token);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return false;
  }

  const body = (await response.json()) as Envelope<Session>;
  saveSession(body.data);
  return true;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  retryOnUnauthorized = true,
): Promise<T> {
  const accessToken = localStorage.getItem("access_token");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json()) as Envelope<T> | { detail?: string };
  if (response.status === 401 && retryOnUnauthorized && !path.startsWith("/auth/")) {
    if (await refreshAccessToken()) return request<T>(path, init, false);
    clearSession();
  }
  if (!response.ok) throw new Error("detail" in body ? body.detail ?? "Request failed" : "Request failed");
  return (body as Envelope<T>).data;
}

export const api = {
  courses: () => request<Course[]>("/courses"),
  course: (id: string) => request<CourseDetail>(`/courses/${id}`),
  register: (name: string, email: string, password: string) =>
    request<Session>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  dashboard: () => request<DashboardSummary>("/dashboard"),
  adminOverview: () => request<AdminOverview>("/admin/overview"),
  enroll: (courseId: string) =>
    request<null>(`/courses/${courseId}/enroll`, { method: "POST" }),
  completeLesson: (lessonId: string, completed = true) =>
    request<{ lesson_id: string; completed: boolean }>(`/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ completed }),
    }),
  progress: (courseId: string) =>
    request<{ completed: number; total: number; percentage: number; enrolled: boolean }>(`/progress/${courseId}`),
  quiz: (quizId: string) => request<{ id: string; title: string; questions: Array<{ id: string; prompt: string; options: string[] }> }>(`/quizzes/${quizId}`),
  submitQuiz: (quizId: string, answers: Record<string, string>) =>
    request<{ score: number; total: number; percentage: number }>(`/quizzes/${quizId}/attempts`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  problems: () => request<Array<{ id: string; title: string; statement: string; starter_code: string }>>("/problems"),
  runProblem: (problemId: string, code: string) =>
    request<{ status: string; stdout: string; stderr: string; execution_time_ms: number }>(`/problems/${problemId}/run`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  chat: (message: string, mode = "socratic") =>
    request<{ reply: string; disclaimer: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, mode }),
    }),
  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await request<null>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        }, false);
      }
    } finally {
      clearSession();
    }
  },
};

export { clearSession, saveSession };
