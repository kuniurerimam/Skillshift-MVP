import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');


const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

function getCurrentYear() {
  const now = new Date();
  const date= now.getFullYear();
  return date;
}

app.get("/",async (req, res) => {
  try{
    // adjust the next link to fetch the first 100 number of rows in the skills table 
    const row= await pool.query("SELECT COUNT(*) FROM (SELECT 1 FROM skills LIMIT 12) AS t;");
    // console.log(`Number of rows in skills table: ${row.rows[0].count}`);
    const row_num= row.rows[0].count;
    const random_number1 = Math.floor(Math.random() * row_num) + 1;
    let random_number2 = Math.floor(Math.random() * row_num) + 1;
    if (random_number2 === random_number1) {
      random_number2 = Math.floor(Math.random() * row_num) + 1;
    }
    let random_number3 = Math.floor(Math.random() * row_num) + 1;
    if (random_number3 === random_number1 || random_number3 === random_number2) {
      random_number3 = Math.floor(Math.random() * row_num) + 1;
    }


    // console.log(`Random numbers generated: ${random_number1}, ${random_number2}, ${random_number3}`);

    // console.log(`Random number generated: ${random_number}`);
    try {
      const result = await pool.query("SELECT * FROM skills WHERE skill_id IN ($1, $2, $3)", [random_number1, random_number2, random_number3]);
      // console.log(result.rows);
      const date = getCurrentYear();
      res.render('home', { skill: result.rows, Date: date });
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    console.error(err);
  }
});

// this route will fetch all the skills from the database and render the explore page with the skills data,
//  we will also use this route to handle the search functionality for skills by rendering the explore page with the search results
app.get("/explore",async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM skills");
    console.log(result.rows);
    const date = getCurrentYear();
    res.render('explore', { skills: result.rows, Date: date });
    }
      catch (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred while fetching skills." });
      console.log("Error fetching skills:", err);
      }
});

app.get("/profile", (req, res) => {
  const date = getCurrentYear();
  res.render("profile.ejs", { Date: date });
});

app.get("/login", (req, res) => {
  const date = getCurrentYear();
  res.render("login.ejs", { Date: date });
}); 

app.get("/bookings", (req, res) => {
  const date = getCurrentYear();
  res.render("bookings.ejs", { Date: date });
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