const db = require("../db/pool");
const { Router } = require("express");
const { body, validationResult, matchedData } = require("express-validator");

const router = Router();

router.get("/new", (req, res) => res.render("new-message"));

router.post("/new", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect("/");
    }

    await db.query(
      "INSERT INTO messages (text, image_url, user_id) VALUES ($1, $2, $3)",
      [req.body.text, req.body.image_url, req.user.id],
    );

    res.redirect("/");
  } catch (error) {
    next(error);
  }
});
router.post("/:id/delete", async (req, res, next) => {
  try {
    if (!req.user || req.user.membership !== "admin") {
      return res.redirect("/");
    }

    await db.query("DELETE FROM messages WHERE id = $1", [req.params.id]);
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
