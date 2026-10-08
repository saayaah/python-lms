import { FormEvent, useState, type ReactNode } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, CourseDetail } from "./api";

function Layout({ children }: { children: ReactNode }) {
  const loggedIn = Boolean(localStorage.getItem("access_token"));
  return (
    <>
      <header>
        <Link to="/" className="brand">Python LMS</Link>
        <nav>
          <Link to="/courses">Courses</Link>
          <Link to="/practice">Practice</Link>
          <Link to="/ai-tutor">AI tutor</Link>
          <Link to={loggedIn ? "/dashboard" : "/login"}>{loggedIn ? "Dashboard" : "Sign in"}</Link>
        </nav>
      </header>
      {children}
    </>
  );
}

function Home() {
  return <main><p className="eyebrow">PYTHON LMS</p><h1>Learn Python by building.</h1><p className="lead">Structured lessons, guided practice, and a tutor that helps you think.</p><Link className="button" to="/courses">Explore courses</Link></main>;
}

function Courses() {
  const query = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  return <main><h1>Course catalog</h1><p>Choose a path and start learning at your pace.</p>{query.isPending && <p role="status">Loading courses...</p>}{query.isError && <p role="alert">{query.error.message}</p>}{query.data?.map((course) => <article className="card" key={course.id}><span className="tag">{course.difficulty}</span><h2>{course.title}</h2><p>{course.description}</p><Link className="button" to={`/courses/${course.id}`}>View course</Link></article>)}</main>;
}

function CoursePage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["course", id], queryFn: () => api.course(id) });
  const progress = useQuery({ queryKey: ["progress", id], queryFn: () => api.progress(id), enabled: Boolean(localStorage.getItem("access_token")) });
  const completion = useMutation({
    mutationFn: (lessonId: string) => api.completeLesson(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["progress", id] }),
  });
  if (query.isPending) return <main><p role="status">Loading course...</p></main>;
  if (query.isError) return <main><p role="alert">{query.error.message}</p></main>;
  const course: CourseDetail = query.data;
  return <main><Link to="/courses">← All courses</Link><h1>{course.title}</h1><p className="lead">{course.description}</p>{progress.data && <p className="progress" aria-label="Course progress">{progress.data.percentage}% complete ({progress.data.completed}/{progress.data.total} lessons)</p>}{!localStorage.getItem("access_token") && <p><Link to="/login">Sign in</Link> to track your progress.</p>}{course.modules.map((module) => <section className="module" key={module.id}><h2>{module.title}</h2>{module.lessons.map((lesson) => <article className="lesson card" key={lesson.id}><h3>{lesson.title}</h3><p>{lesson.content.replaceAll("#", "").trim()}</p><button onClick={() => completion.mutate(lesson.id)} disabled={completion.isPending}>{completion.isPending ? "Saving..." : "Mark complete"}</button>{lesson.quizzes.map((quiz) => <p key={quiz.id}><Link to={`/quizzes/${quiz.id}`}>Take {quiz.title}</Link></p>)}</article>)}</section>)}</main>;
}

function QuizPage() {
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["quiz", id], queryFn: () => api.quiz(id) });
  const submission = useMutation({ mutationFn: (answers: Record<string, string>) => api.submitQuiz(id, answers) });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (query.isPending) return <main><p role="status">Loading quiz...</p></main>;
  if (query.isError) return <main><p role="alert">{query.error.message}</p></main>;
  const quiz = query.data;
  return <main><Link to="/courses">← Courses</Link><h1>{quiz.title}</h1><form className="form" onSubmit={(event) => { event.preventDefault(); submission.mutate(answers); }}>{quiz.questions.map((question) => <fieldset className="card" key={question.id}><legend>{question.prompt}</legend>{question.options.map((option) => <label key={option}><input type="radio" name={question.id} value={option} onChange={() => setAnswers({ ...answers, [question.id]: option })} required /> {option}</label>)}</fieldset>)}<button type="submit" disabled={submission.isPending}>{submission.isPending ? "Submitting..." : "Submit quiz"}</button></form>{submission.data && <p className="progress" role="status">Score: {submission.data.score}/{submission.data.total} ({submission.data.percentage}%).</p>}</main>;
}

function PracticePage() {
  const query = useQuery({ queryKey: ["problems"], queryFn: api.problems });
  const run = useMutation({ mutationFn: ({ id, code }: { id: string; code: string }) => api.runProblem(id, code) });
  const [selected, setSelected] = useState("");
  const problem = query.data?.find((item) => item.id === selected) ?? query.data?.[0];
  const [code, setCode] = useState("");
  const activeCode = code || problem?.starter_code || "";
  return <main><h1>Practice lab</h1><p className="lead">Run small Python programs and inspect the output.</p>{query.isPending && <p role="status">Loading exercises...</p>}{query.isError && <p role="alert">{query.error.message}</p>}{query.data && <><label className="select-label">Exercise<select value={problem?.id ?? ""} onChange={(event) => { setSelected(event.target.value); setCode(""); }}><option value="" disabled>Select an exercise</option>{query.data.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>{problem && <><p>{problem.statement}</p><textarea className="editor" aria-label="Python code" value={activeCode} onChange={(event) => setCode(event.target.value)} spellCheck={false} /><button onClick={() => run.mutate({ id: problem.id, code: activeCode })} disabled={run.isPending}>{run.isPending ? "Running..." : "Run code"}</button>{run.data && <pre className={`output ${run.data.status}`}>{run.data.stdout || run.data.stderr || "No output"}{"\n"}Completed in {run.data.execution_time_ms}ms</pre>}</>}</>}</main>;
}

function AITutorPage() {
  const [question, setQuestion] = useState("Explain the difference between a list and a tuple in Python.");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setReply("");
    setPending(true);

    try {
      const result = await api.chat(question, "socratic");
      setReply(result.reply);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reach the tutor");
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <h1>AI tutor</h1>
      <p className="lead">Ask for coaching, examples, or a guided explanation for the next concept you are learning.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Question
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={6} required />
        </label>
        <button type="submit" disabled={pending}>{pending ? "Thinking..." : "Ask tutor"}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {reply && (
        <article className="card">
          <h2>Coach response</h2>
          <p>{reply}</p>
        </article>
      )}
    </main>
  );
}

function DashboardPage() {
  const loggedIn = Boolean(localStorage.getItem("access_token"));
  const summary = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    enabled: loggedIn,
  });
  const adminOverview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: api.adminOverview,
    enabled: loggedIn && summary.data?.role !== "student",
  });

  if (!loggedIn) {
    return <main><h1>Dashboard</h1><p>Please <Link to="/login">sign in</Link> to view your learning progress.</p></main>;
  }
  if (summary.isPending) return <main><p role="status">Loading dashboard...</p></main>;
  if (summary.isError) return <main><p role="alert">{summary.error.message}</p></main>;

  return (
    <main>
      <h1>{summary.data.name}'s dashboard</h1>
      <p className="lead">{summary.data.recommendation}</p>
      <div className="card-grid">
        <article className="card"><h2>Courses</h2><p>{summary.data.enrolled_courses}</p></article>
        <article className="card"><h2>Lessons completed</h2><p>{summary.data.completed_lessons}</p></article>
        <article className="card"><h2>Quiz attempts</h2><p>{summary.data.quiz_attempts}</p></article>
        <article className="card"><h2>Role</h2><p>{summary.data.role}</p></article>
      </div>

      {summary.data.role !== "student" && adminOverview.isPending && <p role="status">Loading admin overview...</p>}
      {adminOverview.isError && <p role="alert">{adminOverview.error.message}</p>}
      {adminOverview.data && (
        <section className="card">
          <h2>Team overview</h2>
          <p>Students: {adminOverview.data.student_count}</p>
          <p>Courses: {adminOverview.data.course_count}</p>
          <p>Completion rate: {adminOverview.data.completion_rate}%</p>
        </section>
      )}
    </main>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { const session = await api.login(email, password); localStorage.setItem("access_token", session.access_token); localStorage.setItem("refresh_token", session.refresh_token); navigate("/courses"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); } }
  return <main><h1>Welcome back</h1><form className="form" onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>{error && <p role="alert">{error}</p>}<button type="submit">Sign in</button></form><p>New here? <Link to="/register">Create an account</Link>.</p></main>;
}

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { const session = await api.register(name, email, password); localStorage.setItem("access_token", session.access_token); localStorage.setItem("refresh_token", session.refresh_token); navigate("/courses"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create account"); } }
  return <main><h1>Create your account</h1><form className="form" onSubmit={submit}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>{error && <p role="alert">{error}</p>}<button type="submit">Create account</button></form></main>;
}

export function App() {
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/courses" element={<Courses />} /><Route path="/courses/:id" element={<CoursePage />} /><Route path="/quizzes/:id" element={<QuizPage />} /><Route path="/practice" element={<PracticePage />} /><Route path="/ai-tutor" element={<AITutorPage />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="*" element={<main><h1>Page not found</h1></main>} /></Routes></Layout>;
}
