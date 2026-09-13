const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/progress/my -- Student only: combined progress report
router.get("/my", authorize("STUDENT"), async (req, res) => {
  const studentId = req.user.id;

  const [attendance, submissions, examAttempts, enrollments] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId }, include: { course: { select: { title: true } } } }),
    prisma.submission.findMany({ where: { studentId }, include: { assignment: { select: { title: true, maxMarks: true, courseId: true } } } }),
    prisma.examAttempt.findMany({ where: { studentId }, include: { exam: { select: { title: true, totalMarks: true } } } }),
    prisma.enrollment.count({ where: { studentId } }),
  ]);

  const totalClasses = attendance.length;
  const presentClasses = attendance.filter((a) => a.status === "PRESENT").length;
  const attendancePct = totalClasses ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const gradedSubs = submissions.filter((s) => s.marksObtained != null);
  const avgAssignmentPct = gradedSubs.length
    ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.marksObtained / s.assignment.maxMarks) * 100, 0) / gradedSubs.length)
    : null;

  const gradedExams = examAttempts.filter((e) => e.score != null);
  const avgExamPct = gradedExams.length
    ? Math.round(gradedExams.reduce((sum, e) => sum + (e.score / e.exam.totalMarks) * 100, 0) / gradedExams.length)
    : null;

  res.json({
    enrolledCourses: enrollments,
    attendance: { totalClasses, presentClasses, percentage: attendancePct },
    assignments: { totalSubmitted: submissions.length, graded: gradedSubs.length, averagePercentage: avgAssignmentPct },
    exams: { totalAttempted: examAttempts.length, averagePercentage: avgExamPct, results: gradedExams.map(e => ({ title: e.exam.title, score: e.score, total: e.exam.totalMarks })) },
  });
});

module.exports = router;
