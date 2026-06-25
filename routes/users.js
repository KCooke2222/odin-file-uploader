import { prisma } from "../lib/prisma.js";
import { Router } from "express";
import { body, validationResult, matchedData } from "express-validator";
import passport from "passport";
import bcrypt from "bcryptjs";

const router = Router();

const validateUser = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .escape(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("confirmPassword")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Passwords do not match"),
];

router.get("/sign-up", (req, res) =>
  res.render("sign-up-form", {
    errors: [],
    values: {},
  }),
);

router.post("/sign-up", validateUser, async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("sign-up-form", {
        errors: errors.array(),
        values: req.body,
      });
    }

    const { username, password } = matchedData(req);
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username: username, password: hashedPassword },
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureMessage: true,
  }),
);

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

export default router;
