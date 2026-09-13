const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/assignments -- role-aware listing
router.get("/", async (req, res) => {
  const { role, id } = req.user;
  let where = {};
  if (role === "TEACHER") where = { teacherId: id };
  if (role === "STUDENT") where = { course: { enrollments: { some: { studentId: id } } } };

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      course: { select: { id: true, title: true, code: true } },
      submissions: role === "STUDENT" ? { where: { studentId: id } } : true,
    },
    orderBy: { dueDate: "asc" },
  });
  res.json(assignments);
});

// POST /api/assignments -- Teacher only: create assignment
router.post("/", authorize("TEACHER"), async (req, res) => {
  const { title, description, courseId, dueDate, maxMarks } = req.body;
  if (!title || !courseId || !dueDate) return res.status(400).json({ error: "title, courseId, dueDate required" });
  const assignment = await prisma.assignment.create({
    data: {
      title,
      description: description || "",
      courseId: Number(courseId),
      teacherId: req.user.id,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks || 100,
    },
  });
  res.status(201).json(assignment);
});

// PUT /api/assignments/:id -- Teacher only
router.put("/:id", authorize("TEACHER"), async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, dueDate, maxMarks } = req.body;
  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        maxMarks,
      },
    });
    res.json(assignment);
  } catch (e) {
    res.status(404).json({ error: "Assignment not found" });
  }
});

// DELETE /api/assignments/:id -- Teacher only
router.delete("/:id", authorize("TEACHER"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.assignment.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ error: "Assignment not found" });
  }
});

// POST /api/assignments/:id/submit -- Student only: submit work (text or file URL)
router.post("/:id/submit", authorize("STUDENT"), async (req, res) => {
  const assignmentId = Number(req.params.id);
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });

  const status = new Date() > new Date(assignment.dueDate) ? "LATE" : "SUBMITTED";

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: req.user.id } },
    update: { content, status, submittedAt: new Date() },
    create: { assignmentId, studentId: req.user.id, content, status },
  });
  res.status(201).json(submission);
});

// GET /api/assignments/:id/submissions -- Teacher only: view all submissions to grade
router.get("/:id/submissions", authorize("TEACHER"), async (req, res) => {
  const assignmentId = Number(req.params.id);
  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
  });
  res.json(submissions);
});

// PUT /api/assignments/submissions/:submissionId/grade -- Teacher only
router.put("/submissions/:submissionId/grade", authorize("TEACHER"), async (req, res) => {
  const id = Number(req.params.submissionId);
  const { marksObtained, feedback } = req.body;
  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { marksObtained, feedback, status: "GRADED" },
    });
    res.json(submission);
  } catch (e) {
    res.status(404).json({ error: "Submission not found" });
  }
});

module.exports = router;
