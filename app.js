import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/explore", (req, res) => {
  res.render("explore.ejs");
});

app.get("/profile", (req, res) => {
  res.render("profile.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
}); 

app.get("/bookings", (req, res) => {
  res.render("bookings.ejs");
});

//this route handles registration of new users, inserting the user data into the database and then redirecting to the login page

app.post("/login", async (req, res) => {
  const { username, email, password } = req.body;
  const password_hash = password;
  //Include the passward hash during registration and then compare the hash during login for authentication
  //do this when you are adding authentication to the app, for now we are just inserting the user data into the database without authentication
  try {
    await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)",
      [username, email, password_hash]
    );
    console.log(`User ${username} ${email} registered successfully`);
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    console.log("Error registering user:", err);
    res.status(500).json({ error: "An error occurred while registering the user." });
  }
});


// this route will handle the search functionality for skills rendering the explore page with the search results

app.post("/explore",async (req, res) => {
  const searchItem = req.body.skill;
  try { const result = await pool.query(
    "SELECT * FROM skills WHERE skill_name ILIKE $1",
    [`%${searchItem}%`]
  );
  console.log(result.rows);
  // res.json(result.rows);  
  res.render('explore', { skills: result.rows});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching skills." });
    console.log("Error fetching skills:", err);
  }
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});