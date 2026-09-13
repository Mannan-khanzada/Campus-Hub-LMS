const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/exams -- role-aware listing (questions/correct answers hidden from students)
router.get("/", async (req, res) => {
  const { role, id } = req.user;
  let where = {};
  if (role === "TEACHER") where = { teacherId: id };
  if (role === "STUDENT") where = { course: { enrollments: { some: { studentId: id } } } };

  const exams = await prisma.exam.findMany({
    where,
    include: {
      course: { select: { id: true, title: true, code: true } },
      _count: { select: { questions: true } },
      attempts: role === "STUDENT" ? { where: { studentId: id } } : true,
    },
    orderBy: { startTime: "asc" },
  });
  res.json(exams);
});

// POST /api/exams -- Teacher only: create exam
router.post("/", authorize("TEACHER"), async (req, res) => {
  const { title, courseId, durationMin, startTime, endTime, totalMarks, questions } = req.body;
  if (!title || !courseId || !startTime || !endTime) {
    return res.status(400).json({ error: "title, courseId, startTime, endTime required" });
  }
  const exam = await prisma.exam.create({
    data: {
      title,
      courseId: Number(courseId),
      teacherId: req.user.id,
      durationMin: durationMin || 30,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalMarks: totalMarks || 100,
      questions: {
        create: (questions || []).map((q) => ({
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          marks: q.marks || 1,
        })),
      },
    },
    include: { questions: true },
  });
  res.status(201).json(exam);
});

// GET /api/exams/:id/take -- Student only: get questions WITHOUT correct answers, within time window
router.get("/:id/take", authorize("STUDENT"), async (req, res) => {
  const examId = Number(req.params.id);
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { select: { id: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true } } },
  });
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  const now = new Date();
  if (now < exam.startTime || now > exam.endTime) {
    return res.status(403).json({ error: "Exam is not currently active" });
  }
  res.json(exam);
});

// POST /api/exams/:id/submit -- Student only: submit answers, auto-graded
// body: { answers: { questionId: "A" } }
router.post("/:id/submit", authorize("STUDENT"), async (req, res) => {
  const examId = Number(req.params.id);
  const { answers } = req.body;
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { questions: true } });
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  let score = 0;
  for (const q of exam.questions) {
    if (answers[q.id] && answers[q.id] === q.correctOption) score += q.marks;
  }

  const attempt = await prisma.examAttempt.upsert({
    where: { examId_studentId: { examId, studentId: req.user.id } },
    update: { answers: JSON.stringify(answers), score, submittedAt: new Date() },
    create: { examId, studentId: req.user.id, answers: JSON.stringify(answers), score, submittedAt: new Date() },
  });
  res.json({ success: true, score, totalMarks: exam.totalMarks, attempt });
});

// GET /api/exams/:id/results -- Teacher only: view all results
router.get("/:id/results", authorize("TEACHER"), async (req, res) => {
  const examId = Number(req.params.id);
  const attempts = await prisma.examAttempt.findMany({
    where: { examId },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
  });
  res.json(attempts);
});

module.exports = router;
