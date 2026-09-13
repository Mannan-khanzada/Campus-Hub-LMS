const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/courses -- everyone sees relevant courses
router.get("/", async (req, res) => {
  const { role, id } = req.user;
  let where = {};
  if (role === "TEACHER") where = { teacherId: id };
  if (role === "STUDENT") where = { enrollments: { some: { studentId: id } } };

  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(courses);
});

// POST /api/courses -- Admin only: create course, assign teacher
router.post("/", authorize("ADMIN"), async (req, res) => {
  const { title, code, description, teacherId } = req.body;
  if (!title || !code) return res.status(400).json({ error: "title and code required" });
  try {
    const course = await prisma.course.create({
      data: { title, code, description, teacherId: teacherId ? Number(teacherId) : null },
    });
    res.status(201).json(course);
  } catch (e) {
    res.status(409).json({ error: "Course code already exists" });
  }
});

// PUT /api/courses/:id -- Admin only
router.put("/:id", authorize("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, teacherId } = req.body;
  try {
    const course = await prisma.course.update({
      where: { id },
      data: { title, description, teacherId: teacherId ? Number(teacherId) : null },
    });
    res.json(course);
  } catch (e) {
    res.status(404).json({ error: "Course not found" });
  }
});

// DELETE /api/courses/:id -- Admin only
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.course.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ error: "Course not found" });
  }
});

// POST /api/courses/:id/enroll -- Admin only: enroll a student in a course
router.post("/:id/enroll", authorize("ADMIN"), async (req, res) => {
  const courseId = Number(req.params.id);
  const { studentId } = req.body;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { courseId, studentId: Number(studentId) },
    });
    res.status(201).json(enrollment);
  } catch (e) {
    res.status(409).json({ error: "Student already enrolled or invalid IDs" });
  }
});

// GET /api/courses/:id/students -- Admin/Teacher: list enrolled students
router.get("/:id/students", authorize("ADMIN", "TEACHER"), async (req, res) => {
  const courseId = Number(req.params.id);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, email: true, rollNumber: true } } },
  });
  res.json(enrollments.map((e) => e.student));
});

module.exports = router;
