const db = require("../db/pool");
const { Router } = require("express");
const { body, validationResult, matchedData } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcryptjs");

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
    await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashedPassword,
    ]);
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

router.get("/become-member", (req, res) =>
  res.render("member-sign-up", {
    errors: [],
    values: {},
  }),
);

router.post("/become-member", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect("/");
    }

    if (req.body.password === "1234") {
      await db.query("UPDATE users SET membership = $1 WHERE id = $2", [
        "member",
        req.user.id,
      ]);
    }

    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

router.post("/become-admin", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect("/");
    }

    if (req.body.password === "12345") {
      await db.query("UPDATE users SET membership = $1 WHERE id = $2", [
        "admin",
        req.user.id,
      ]);
    }

    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
