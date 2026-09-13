const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/users?role=TEACHER|STUDENT  -- Admin only: list users
router.get("/", authorize("ADMIN"), async (req, res) => {
  const { role } = req.query;
  const users = await prisma.user.findMany({
    where: role ? { role } : { role: { in: ["TEACHER", "STUDENT"] } },
    select: { id: true, name: true, email: true, role: true, rollNumber: true, department: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

// POST /api/users -- Admin only: add teacher or student
router.post("/", authorize("ADMIN"), async (req, res) => {
  const { name, email, password, role, rollNumber, department, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, role are required" });
  }
  if (!["TEACHER", "STUDENT"].includes(role)) {
    return res.status(400).json({ error: "role must be TEACHER or STUDENT" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, rollNumber, department, phone },
  });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// PUT /api/users/:id -- Admin only: update user
router.put("/:id", authorize("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, department, phone, rollNumber, isActive, password } = req.body;
  const data = { name, email, department, phone, rollNumber, isActive };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  if (password) data.password = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.update({ where: { id }, data });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(404).json({ error: "User not found" });
  }
});

// DELETE /api/users/:id -- Admin only: remove user
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ error: "User not found" });
  }
});

module.exports = router;
