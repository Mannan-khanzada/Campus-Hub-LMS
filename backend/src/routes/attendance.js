const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// POST /api/attendance/mark -- Teacher only: mark attendance for a whole class in one go
// body: { courseId, date, records: [{ studentId, status }] }
router.post("/mark", authorize("TEACHER"), async (req, res) => {
  const { courseId, date, records } = req.body;
  if (!courseId || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: "courseId, date, records[] required" });
  }
  const day = new Date(date);

  const results = await Promise.all(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { courseId_studentId_date: { courseId: Number(courseId), studentId: Number(r.studentId), date: day } },
        update: { status: r.status, markedById: req.user.id },
        create: {
          courseId: Number(courseId),
          studentId: Number(r.studentId),
          date: day,
          status: r.status,
          markedById: req.user.id,
        },
      })
    )
  );
  res.json({ success: true, count: results.length });
});

// GET /api/attendance/course/:courseId -- Teacher/Admin: attendance history for a course
router.get("/course/:courseId", authorize("TEACHER", "ADMIN"), async (req, res) => {
  const courseId = Number(req.params.courseId);
  const records = await prisma.attendance.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: { date: "desc" },
  });
  res.json(records);
});

// GET /api/attendance/my -- Student: view own attendance + percentage per course
router.get("/my", authorize("STUDENT"), async (req, res) => {
  const records = await prisma.attendance.findMany({
    where: { studentId: req.user.id },
    include: { course: { select: { id: true, title: true, code: true } } },
    orderBy: { date: "desc" },
  });

  const byCourse = {};
  for (const r of records) {
    const key = r.course.id;
    if (!byCourse[key]) byCourse[key] = { course: r.course, total: 0, present: 0, records: [] };
    byCourse[key].total += 1;
    if (r.status === "PRESENT") byCourse[key].present += 1;
    byCourse[key].records.push({ date: r.date, status: r.status });
  }
  const summary = Object.values(byCourse).map((c) => ({
    ...c,
    percentage: c.total ? Math.round((c.present / c.total) * 100) : 0,
  }));
  res.json(summary);
});

module.exports = router;
