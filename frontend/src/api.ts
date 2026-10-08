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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (!response.ok) throw new Error("detail" in body ? body.detail ?? "Request failed" : "Request failed");
  return (body as Envelope<T>).data;
}

export const api = {
  courses: () => request<Course[]>("/courses"),
  course: (id: string) => request<CourseDetail>(`/courses/${id}`),
  register: (name: string, email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  dashboard: () => request<DashboardSummary>("/dashboard"),
  adminOverview: () => request<AdminOverview>("/admin/overview"),
  completeLesson: (lessonId: string, completed = true) =>
    request<{ lesson_id: string; completed: boolean }>(`/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ completed }),
    }),
  progress: (courseId: string) =>
    request<{ completed: number; total: number; percentage: number }>(`/progress/${courseId}`),
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
};
