import { prisma } from "../lib/prisma.js";
import { Router } from "express";
import { body, validationResult, matchedData } from "express-validator";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/", // folder to save files
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // e.g. 1234567890-myfile.pdf
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  console.log(req.file);

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

export default router;
