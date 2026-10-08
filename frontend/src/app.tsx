import { FormEvent, useState, type ReactNode } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, CourseDetail } from "./api";

function Layout({ children }: { children: ReactNode }) {
  const loggedIn = Boolean(localStorage.getItem("access_token"));
  return (
    <>
      <header>
        <Link to="/" className="brand"><span className="brand-mark">λ</span> Python LMS</Link>
        <nav>
          <a href="/#courses">Courses</a>
          <Link to="/practice">IDE</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/certificates">Certificates</Link>
          <Link to="/ai-tutor">AI tutor</Link>
          <Link to={loggedIn ? "/dashboard" : "/login"}>{loggedIn ? "Dashboard" : "Sign in"}</Link>
        </nav>
      </header>
      {children}
    </>
  );
}

function Home() {
  const tracks = [
    ["01", "Coding basics", "Build your first programs with logic, variables, loops, and functions.", "Beginner"],
    ["02", "Python basics", "Master the language fundamentals through small, confidence-building projects.", "Beginner"],
    ["03", "Python intermediate", "Level up with OOP, testing, APIs, async programming, and clean architecture.", "Intermediate"],
    ["04", "Advanced web development", "Ship production-ready services with Django, FastAPI, databases, and deployment.", "Advanced"],
    ["05", "Python libraries", "Work with the tools professionals use: requests, pandas, pytest, and more.", "Practical"],
    ["06", "DSA & interview prep", "Solve algorithmic problems and learn the patterns behind efficient solutions.", "Challenge"],
  ];
  return <main className="landing">
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">THE MODERN PYTHON SCHOOL</p><h1>Turn curiosity into <em>working code.</em></h1><p className="lead">A focused learning space for people who want to understand Python deeply, build real things, and keep moving forward.</p><div className="hero-actions"><a className="button" href="#courses">Explore the curriculum <span>↓</span></a><Link className="button button-quiet" to="/practice">Open the IDE ↗</Link></div><div className="hero-proof"><span><strong>6+</strong> learning tracks</span><span><strong>∞</strong> practice space</span><span><strong>AI</strong> when you need a nudge</span></div></div>
      <div className="hero-art"><div className="code-window"><div className="window-top"><span></span><span></span><span></span><small>hello.py</small></div><pre><code><b>def</b> <i>make_progress</i>(day):{"\n"}    <b>if</b> day == <s>"stuck"</s>:{"\n"}        <b>return</b> <s>"ask, try, learn"</s>{"\n"}    <b>return</b> <s>"ship something"</s>{"\n"}{"\n"}print(make_progress(<s>"today"</s>))</code></pre><div className="code-output">→ ship something <span>●</span></div></div><div className="orbit-card">✦ Learn by doing</div></div>
    </section>
    <section id="courses" className="section-block"><div className="section-heading"><div><p className="eyebrow">YOUR PATH, YOUR PACE</p><h2>Find your next <em>level.</em></h2></div><Link to="/courses" className="text-link">Open the full course library ↗</Link></div><div className="track-grid">{tracks.map(([number, title, description, level]) => <Link to="/courses" className="track-card" key={title}><span className="track-number">{number}</span><span className="tag">{level}</span><h3>{title}</h3><p>{description}</p><span className="track-arrow">↗</span></Link>)}</div></section>
    <section className="split-section"><div><p className="eyebrow">A BETTER WAY TO LEARN</p><h2>Small steps.<br /><em>Real momentum.</em></h2></div><div><p className="lead">Sign up to save your progress, pick up exactly where you left off, and build a learning habit that lasts.</p><Link className="button" to="/register">Start learning free →</Link><p className="fine-print">No credit card. Just a better place to practice.</p></div></section>
    <section id="about" className="about-block"><p className="eyebrow">ABOUT PYTHON LMS</p><h2>Less scrolling. More <em>building.</em></h2><p>Python LMS is a calm, practical learning environment for aspiring developers. Follow a clear path, practice in the browser, ask for help, and collect proof of what you can do.</p><div className="about-links"><Link to="/projects">Project ideas ↗</Link><Link to="/certificates">Certificates ↗</Link><Link to="/ai-tutor">Meet your AI tutor ↗</Link></div></section>
  </main>;
}

function ProjectsPage() {
  const projects = ["Calculator with history", "Personal expense tracker", "Weather dashboard", "FastAPI blog API", "File organizer CLI", "Real-time chat app"];
  return <main><p className="eyebrow">BUILD SOMETHING REAL</p><h1>Project ideas</h1><p className="lead">Practical briefs that turn lessons into portfolio pieces.</p><div className="track-grid">{projects.map((project, index) => <article className="track-card" key={project}><span className="track-number">0{index + 1}</span><h3>{project}</h3><p>Plan, build, test, and improve a Python project with a clear next milestone.</p><Link className="text-link" to="/practice">Start in the IDE ↗</Link></article>)}</div></main>;
}

function CertificatesPage() {
  return <main className="center-page"><p className="eyebrow">SHOW WHAT YOU KNOW</p><h1>Earn your certificate.</h1><p className="lead">Complete a learning track, finish its challenges, and get a shareable certificate that reflects the work you put in.</p><div className="certificate-preview"><span className="brand-mark">λ</span><p>PYTHON LMS</p><h2>Certificate of completion</h2><p>Your name · Python Foundations</p></div><Link className="button" to="/register">Create an account to begin →</Link></main>;
}

function Courses() {
  const query = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const library = [
    { track: "Start here", description: "Build confidence from your first line of code.", courses: ["Coding basics", "Python basics"] },
    { track: "Level up", description: "Write cleaner, more capable Python applications.", courses: ["Python intermediate", "Python libraries", "Testing with pytest"] },
    { track: "Build for the web", description: "Create APIs and production-ready web services.", courses: ["Web development fundamentals", "Django with Python", "FastAPI in Python"] },
    { track: "Think like an engineer", description: "Master algorithms and solve problems with intention.", courses: ["Data structures and algorithms", "Interview problem solving", "Advanced Python"] },
  ];
  return <main className="library-page"><div className="library-hero"><p className="eyebrow">THE PYTHON LMS LIBRARY</p><h1>Choose your <em>next chapter.</em></h1><p className="lead">A structured path from your first variable to production APIs, with practical courses for every stage of your journey.</p></div>{query.isPending && <p role="status">Loading courses...</p>}{query.isError && <p role="alert">{query.error.message}</p>}<div className="library-groups">{library.map((group) => <section className="library-group" key={group.track}><div className="library-group-heading"><div><span className="tag">{group.track}</span><h2>{group.description}</h2></div><span className="course-count">{group.courses.length} courses</span></div><div className="library-grid">{group.courses.map((title, index) => { const liveCourse = query.data?.find((course) => course.title.toLowerCase().includes(title.toLowerCase().split(" ")[0])); return <article className="library-card" key={title}><span className="track-number">0{index + 1}</span><h3>{title}</h3><p>{liveCourse?.description ?? "A guided, project-based course with lessons, practice, and a clear path to the next skill."}</p><div className="library-card-footer"><span>{liveCourse?.difficulty ?? "Coming soon"}</span>{liveCourse ? <Link to={`/courses/${liveCourse.id}`}>View course ↗</Link> : <span className="muted">In the library</span>}</div></article>; })}</div></section>)}</div><section className="library-cta"><h2>Not sure where to begin?</h2><p>Start with Python basics and build momentum one small project at a time.</p><Link className="button" to="/register">Start learning free →</Link></section></main>;
}

function CoursePage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["course", id], queryFn: () => api.course(id) });
  const progress = useQuery({ queryKey: ["progress", id], queryFn: () => api.progress(id), enabled: Boolean(localStorage.getItem("access_token")) });
  const enrollment = useMutation({
    mutationFn: () => api.enroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["progress", id] });
    },
  });
  const completion = useMutation({
    mutationFn: (lessonId: string) => api.completeLesson(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["progress", id] }),
  });
  if (query.isPending) return <main><p role="status">Loading course...</p></main>;
  if (query.isError) return <main><p role="alert">{query.error.message}</p></main>;
  const course: CourseDetail = query.data;
  return <main><Link to="/courses">← All courses</Link><h1>{course.title}</h1><p className="lead">{course.description}</p>{progress.data?.enrolled ? <p className="progress" aria-label="Course progress">{progress.data.percentage}% complete ({progress.data.completed}/{progress.data.total} lessons)</p> : localStorage.getItem("access_token") ? <button onClick={() => enrollment.mutate()} disabled={enrollment.isPending}>{enrollment.isPending ? "Enrolling..." : "Enroll in course"}</button> : <p><Link to="/login">Sign in</Link> to enroll and track your progress.</p>}{enrollment.isError && <p role="alert">{enrollment.error.message}</p>}{course.modules.map((module) => <section className="module" key={module.id}><h2>{module.title}</h2>{module.lessons.map((lesson) => <article className="lesson card" key={lesson.id}><h3>{lesson.title}</h3><p>{lesson.content.replaceAll("#", "").trim()}</p><button onClick={() => completion.mutate(lesson.id)} disabled={completion.isPending}>{completion.isPending ? "Saving..." : "Mark complete"}</button>{lesson.quizzes.map((quiz) => <p key={quiz.id}><Link to={`/quizzes/${quiz.id}`}>Take {quiz.title}</Link></p>)}</article>)}</section>)}</main>;
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
      <section>
        <h2>Course progress</h2>
        {summary.data.courses.length === 0 && <p>You have not enrolled in a course yet. <Link to="/courses">Browse courses</Link>.</p>}
        {summary.data.courses.map((course) => (
          <article className="card" key={course.id}>
            <div className="progress-row">
              <div><h3>{course.title}</h3><span className="tag">{course.difficulty}</span></div>
              <strong>{course.percentage}%</strong>
            </div>
            <div className="progress-track" role="progressbar" aria-label={`${course.title} progress`} aria-valuenow={course.percentage} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${course.percentage}%` }} />
            </div>
            <p>{course.completed} of {course.total} lessons completed</p>
            <Link className="button" to={`/courses/${course.id}`}>Continue course</Link>
          </article>
        ))}
      </section>

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
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/courses" element={<Courses />} /><Route path="/courses/:id" element={<CoursePage />} /><Route path="/quizzes/:id" element={<QuizPage />} /><Route path="/practice" element={<PracticePage />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/certificates" element={<CertificatesPage />} /><Route path="/ai-tutor" element={<AITutorPage />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="*" element={<main><h1>Page not found</h1></main>} /></Routes></Layout>;
}
