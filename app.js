/////// app.js
require("dotenv").config();
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const usersRouter = require("./routes/users");
const messagesRouter = require("./routes/messages");
const pool = require("./db/pool");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
      );
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res, next) => {
  try {
    let result;

    if (
      req.user &&
      (req.user.membership === "member" || req.user.membership === "admin")
    ) {
      result = await pool.query(`
        SELECT messages.id, messages.text, messages.image_url, messages.created_at, users.username
        FROM messages
        JOIN users ON messages.user_id = users.id
        ORDER BY messages.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT id, text, image_url
        FROM messages
        ORDER BY created_at DESC
      `);
    }

    res.render("index", {
      messages: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/users", usersRouter);
app.use("/messages", messagesRouter);

app.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port 3000!");
});
