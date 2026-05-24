import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "Skillshift",
  password: "Ureri1003",
  port: 5433,
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


app.post("/explore",async (req, res) => {
  const searchItem = req.body.skill;
  try { const result = await pool.query(
    "SELECT * FROM skills WHERE skill_name ILIKE $1",
    [`%${searchItem}%`]
  );
  console.log(result.rows);
  res.json(result.rows);  
  res.render('explore', { skills: result.rows });
} catch (err) {
  console.error(err);
  res.status(500).json({ error: "An error occurred while fetching skills." });
}
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});