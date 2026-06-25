import { prisma } from "../lib/prisma.js";
import { Router } from "express";
import multer from "multer";
import fs from "node:fs";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).render("folder", {
        error: err.message,
        files: [],
        folderId: req.body.folderId,
      });
    }

    await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        folderId: parseInt(req.body.folderId),
      },
    });

    res.redirect(`/data/folder/${req.body.folderId}`);
  });
});

router.get("/file/:id/download", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  res.download(file.path, file.name); // sends file, uses original name
});

router.post("/file/:id/delete", async (req, res) => {
  const file = await prisma.file.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  fs.unlinkSync(file.path);

  await prisma.file.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect(`/data/folder/${file.folderId}`);
});

router.post("/folder", async (req, res) => {
  await prisma.folder.create({
    data: {
      name: req.body.name,
      userId: req.user.id,
    },
  });

  res.redirect("/");
});

router.get("/folder/:id", async (req, res) => {
  const files = await prisma.file.findMany({
    where: { folderId: parseInt(req.params.id) },
  });

  res.render("folder", { files, folderId: parseInt(req.params.id) });
});

router.post("/folder/:id/update", async (req, res) => {
  await prisma.folder.update({
    where: { id: parseInt(req.params.id) },
    data: { name: req.body.name },
  });

  res.redirect("/");
});

router.post("/folder/:id/delete", async (req, res) => {
  const files = await prisma.file.findMany({
    where: { folderId: parseInt(req.params.id) },
  });

  files.forEach((file) => fs.unlinkSync(file.path));

  await prisma.folder.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/");
});

export default router;
