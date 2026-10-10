import { FormEvent, useState, type ReactNode } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, CourseDetail } from "./api";

function Layout({ children }: { children: ReactNode }) {
  const loggedIn = Boolean(localStorage.getItem("access_token"));
  return (
    <>
      <header>
        <Link to="/" className="brand">pycode</Link>
        <nav>
          <a href="/#courses">courses</a>
          <Link to="/projects">projects</Link>
          <Link to={loggedIn ? "/dashboard" : "/login"}>progress</Link>
          <Link to="/practice">IDE</Link>
          <Link to="/ai-tutor" className="nav-cta">ASK AI</Link>
        </nav>
      </header>
      {children}
    </>
  );
}

function Home() {
  const tracks = [
    ["01", "Python foundations", "Start with syntax, variables, control flow, functions, and problem solving.", "Beginner"],
    ["02", "Intermediate Python", "Build stronger programs with OOP, testing, APIs, and asynchronous code.", "Intermediate"],
    ["03", "Web development", "Create real services with Django, FastAPI, databases, and deployment.", "Advanced"],
    ["04", "DSA & interviews", "Learn the patterns behind efficient algorithms and confident interviews.", "Challenge"],
  ];
  return <main className="landing">
    <section className="reference-hero">
      <div className="reference-copy"><p className="home-kicker">PYCODE / LEARNING PLATFORM</p><h1>LEARN PYTHON</h1><p>FROM BASICS TO ADVANCED</p><div><Link className="reference-button primary" to="/courses">START LEARNING</Link><Link className="reference-button" to={localStorage.getItem("access_token") ? "/dashboard" : "/login"}>{localStorage.getItem("access_token") ? "VIEW PROGRESS" : "SIGN IN"}</Link></div></div>
      <div className="reference-art"><img src="/student-learning.svg" alt="Student learning Python on a laptop" /></div>
    </section>
    <section className="home-intro"><p className="eyebrow">A CLEAR PATH TO CONFIDENCE</p><h2>Learn by understanding.<br /><em>Build by doing.</em></h2><p>Short lessons, browser-based practice, and useful projects so every concept has somewhere to go.</p></section>
    <section id="courses" className="section-block"><div className="section-heading"><div><p className="eyebrow">LEARNING PATHS</p><h2>Choose your starting point.</h2></div><Link to="/courses" className="text-link">View all courses ↗</Link></div><div className="track-grid">{tracks.map(([number, title, description, level]) => <Link to="/courses" className="track-card" key={title}><span className="track-number">{number}</span><span className="tag">{level}</span><h3>{title}</h3><p>{description}</p><span className="track-arrow">↗</span></Link>)}</div></section>
    <section className="home-benefits"><div className="benefit"><strong>01</strong><h3>Learn at your pace</h3><p>Follow a structured curriculum without losing the freedom to explore.</p></div><div className="benefit"><strong>02</strong><h3>Practice in the browser</h3><p>Write and run Python immediately, without local setup.</p></div><div className="benefit"><strong>03</strong><h3>Keep your progress</h3><p>Save completed lessons and your next recommended step.</p></div></section>
    <section className="split-section"><div><p className="eyebrow">A BETTER WAY TO LEARN</p><h2>Small steps.<br /><em>Real momentum.</em></h2></div><div><p className="lead">Sign up to save your progress, pick up exactly where you left off, and build a learning habit that lasts.</p><Link className="button" to="/register">Start learning free →</Link><p className="fine-print">No credit card. Just a better place to practice.</p></div></section>
    <section id="about" className="about-block"><p className="eyebrow">ABOUT PYCODE</p><h2>A practical home for<br /><em>future developers.</em></h2><p>Learn the fundamentals, solve problems, explore projects, and build the confidence to keep going.</p><div className="about-links"><Link to="/projects">Project ideas ↗</Link><Link to="/certificates">Certificates ↗</Link><Link to="/ai-tutor">Ask the AI tutor ↗</Link></div></section><footer className="home-footer"><span>pycode</span><span>Learn Python. Build things.</span><Link to="/courses">Course library ↗</Link></footer>
  </main>;
}

function ProjectsPage() {
  const projects = ["Calculator with history", "Personal expense tracker", "Weather dashboard", "FastAPI blog API", "File organizer CLI", "Real-time chat app"];
  return <main><p className="eyebrow">BUILD SOMETHING REAL</p><h1>Project ideas</h1><p className="lead">Practical briefs that turn lessons into portfolio pieces.</p><div className="track-grid">{projects.map((project, index) => <article className="track-card" key={project}><span className="track-number">0{index + 1}</span><h3>{project}</h3><p>Plan, build, test, and improve a Python project with a clear next milestone.</p><Link className="text-link" to="/practice">Start in the IDE ↗</Link></article>)}</div></main>;
}

function CertificatesPage() {
  return <main className="center-page"><p className="eyebrow">SHOW WHAT YOU KNOW</p><h1>Earn your certificate.</h1><p className="lead">Complete a learning track, finish its challenges, and get a shareable certificate that reflects the work you put in.</p><div className="certificate-preview"><span className="brand-mark">λ</span><p>PYTHON LMS</p><h2>Certificate of completion</h2><p>Your name · Python Foundations</p></div><Link className="button" to="/register">Create an account to begin →</Link></main>;
}

function LibraryCoursePage() {
  const { slug = "" } = useParams();
  const title = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return <main className="library-course-preview"><Link className="back-link light-back" to="/courses">← Back to course library</Link><p className="eyebrow">LEARNING TRACK</p><h1>{title}</h1><p className="lead">A structured, practical path with guided lessons, examples, and exercises designed to help you build real Python skills.</p><div className="preview-grid"><article className="preview-panel"><span className="track-number">01</span><h2>What you will learn</h2><p>Understand the core concepts, practice them in the browser, and build confidence one lesson at a time.</p><ul><li>Clear explanations and examples</li><li>Hands-on practice exercises</li><li>Progress tracking and completion milestones</li></ul></article><article className="preview-panel"><span className="track-number">02</span><h2>Course status</h2><p>This learning track is part of the Python LMS library and is being prepared for guided study.</p><Link className="button" to="/register">Sign up to save your place →</Link></article></div><Link className="text-link" to="/practice">Practice Python in the IDE ↗</Link></main>;
}

function Courses() {
  const query = useQuery({ queryKey: ["courses"], queryFn: api.courses });
  const library = [
    { track: "Start here", description: "Build confidence from your first line of code.", courses: ["Coding basics", "Python basics"] },
    { track: "Level up", description: "Write cleaner, more capable Python applications.", courses: ["Python intermediate", "Python libraries", "Testing with pytest"] },
    { track: "Build for the web", description: "Create APIs and production-ready web services.", courses: ["Web development fundamentals", "Django with Python", "FastAPI in Python"] },
    { track: "Think like an engineer", description: "Master algorithms and solve problems with intention.", courses: ["Data structures and algorithms", "Interview problem solving", "Advanced Python"] },
  ];
  return <main className="library-page"><div className="library-hero"><p className="eyebrow">THE PYTHON LMS LIBRARY</p><h1>Choose your <em>next chapter.</em></h1><p className="lead">A structured path from your first variable to production APIs, with practical courses for every stage of your journey.</p></div>{query.isPending && <p role="status">Loading courses...</p>}{query.isError && <p role="alert">{query.error.message}</p>}<div className="library-groups">{library.map((group) => <section className="library-group" key={group.track}><div className="library-group-heading"><div><span className="tag">{group.track}</span><h2>{group.description}</h2></div><span className="course-count">{group.courses.length} courses</span></div><div className="library-grid">{group.courses.map((title, index) => { const liveCourse = query.data?.find((course) => course.title.toLowerCase().includes(title.toLowerCase().split(" ")[0])); const destination = liveCourse ? `/courses/${liveCourse.id}` : `/courses/track/${title.toLowerCase().replaceAll(" ", "-")}`; return <Link className="library-card" to={destination} key={title}><span className="track-number">0{index + 1}</span><h3>{title}</h3><p>{liveCourse?.description ?? "A guided, project-based course with lessons, practice, and a clear path to the next skill."}</p><div className="library-card-footer"><span>{liveCourse?.difficulty ?? "Explore track"}</span><span>Open course ↗</span></div></Link>; })}</div></section>)}</div><section className="library-cta"><h2>Not sure where to begin?</h2><p>Start with Python basics and build momentum one small project at a time.</p><Link className="button" to="/register">Start learning free →</Link></section></main>;
}

function CoursePage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["course", id], queryFn: () => api.course(id) });
  const progress = useQuery({ queryKey: ["progress", id], queryFn: () => api.progress(id), enabled: Boolean(localStorage.getItem("access_token")) });
  const [selectedLessonId, setSelectedLessonId] = useState("");
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
  const lessons = course.modules.flatMap((module) => module.lessons);
  const activeLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLesson?.id);
  const completed = progress.data?.completed ?? 0;
  const selectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (!activeLesson) return <main><h1>{course.title}</h1><p>No lessons are available yet.</p></main>;
  return <div className="course-shell">
    <aside className="course-sidebar">
      <Link className="back-link" to="/courses">← Back to courses</Link>
      <div className="course-sidebar-title"><div className="course-icon">Py</div><div><h2>{course.title}</h2><p>Learn at your own pace.</p></div></div>
      <div className="sidebar-progress"><span>{progress.data?.percentage ?? 0}% Complete</span><div className="sidebar-progress-track"><div style={{ width: `${progress.data?.percentage ?? 0}%` }} /></div></div>
      <p className="sidebar-label">COURSE CONTENT</p>
      <ol className="lesson-list">{lessons.map((lesson, index) => <li key={lesson.id}><button className={lesson.id === activeLesson.id ? "active" : ""} onClick={() => selectLesson(lesson.id)}><span className={`lesson-status ${index < completed ? "done" : ""}`}>{index < completed ? "✓" : index + 1}</span><span>{index + 1}. {lesson.title}</span><small>{12 + index * 4} min</small></button></li>)}</ol>
    </aside>
    <main className="lesson-view">
      <div className="lesson-topbar"><span className="lesson-badge">{course.title}</span><strong>{progress.data?.percentage ?? 0}% Complete</strong><div className="lesson-progress-track"><div style={{ width: `${progress.data?.percentage ?? 0}%` }} /></div></div>
      <h1>{activeIndex + 1}. {activeLesson.title}</h1>
      <p className="lesson-intro">{activeLesson.content.replace(/^#.*\n\n?/, "").split("\n\n")[0]}</p>
      <div className="lesson-columns">
        <article className="lesson-content">
          <h2>What is {activeLesson.title}?</h2>
          <p>{activeLesson.content.replace(/^#.*\n\n?/, "").replace(/\n\n/g, " ")}</p>
          <div className="takeaway-callout"><strong>✧ Why this matters</strong><ul><li>Build a strong foundation through practice.</li><li>Write code that is easier to understand.</li><li>Turn concepts into working programs.</li></ul></div>
          <h2>Example</h2><p>Here is a small example to explore:</p>
          <pre className="lesson-code"><span>python</span><code>{`def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Learner"))`}</code></pre>
          <div className="lesson-output"><strong>Output</strong><code>Hello, Learner!</code></div>
          <button className="complete-button" onClick={() => completion.mutate(activeLesson.id)} disabled={completion.isPending}>{completion.isPending ? "Saving..." : "Mark lesson complete ✓"}</button>
          {activeLesson.quizzes.map((quiz) => <Link className="button" to={`/quizzes/${quiz.id}`} key={quiz.id}>Take {quiz.title} →</Link>)}
        </article>
        <aside className="lesson-aside"><div className="takeaways"><h3>✓ Key takeaways</h3><p>Practice is the fastest way to make this concept stick.</p><p>Use small examples before combining ideas.</p><p>Come back and review whenever you need.</p></div><div className="try-card"><h3>⌘ Try it yourself</h3><p>Open the practice editor and experiment with this lesson.</p><Link to="/practice">Open code editor ↗</Link></div></aside>
      </div>
      <div className="lesson-navigation"><button disabled={activeIndex <= 0} onClick={() => selectLesson(lessons[activeIndex - 1]?.id)}>← <span>Previous lesson</span></button><button disabled={activeIndex >= lessons.length - 1} onClick={() => selectLesson(lessons[activeIndex + 1]?.id)}><span>Next lesson</span> →</button></div>
    </main>
  </div>;
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
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/courses" element={<Courses />} /><Route path="/courses/track/:slug" element={<LibraryCoursePage />} /><Route path="/courses/:id" element={<CoursePage />} /><Route path="/quizzes/:id" element={<QuizPage />} /><Route path="/practice" element={<PracticePage />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/certificates" element={<CertificatesPage />} /><Route path="/ai-tutor" element={<AITutorPage />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="*" element={<main><h1>Page not found</h1></main>} /></Routes></Layout>;
}
