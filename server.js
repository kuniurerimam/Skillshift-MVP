import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const port = 3000;
const saltRounds = parseInt(process.env.Salt_rounds);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

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
  const date = now.getFullYear();
  return date;
}

app.get("/", async (req, res) => {
  try {
    // generate three random not equal numbers
    const row = await pool.query("SELECT COUNT(*) FROM (SELECT 1 FROM skills LIMIT 12) AS t;");
    // console.log(`Number of rows in skills table: ${row.rows[0].count}`);
    const row_num = row.rows[0].count;
    const random_number1 = Math.floor(Math.random() * row_num) + 1;
    let random_number2 = Math.floor(Math.random() * row_num) + 1;
    while (random_number2 === random_number1) {
      random_number2 = Math.floor(Math.random() * row_num) + 1;
    }
    let random_number3 = Math.floor(Math.random() * row_num) + 1;
    while (random_number3 === random_number1 || random_number3 === random_number2) {
      random_number3 = Math.floor(Math.random() * row_num) + 1;
    }

    //Get the skill rows with thesame id as the random rows generated and diaplay them using ejs in the frontend
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


// this route will fetch all the skills from the database and render the explore page with the skills data
//Adjust this to show only a limited set per call so if there are a 100 skills all will not show on the skreen at once
app.get("/explore", async (req, res) => {
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
  res.render("profile", { Date: date });
});

app.get("/login", (req, res) => {
  const date = getCurrentYear();
  res.render("login", { Date: date, err: req.query.err || null });
});

app.get("/register", (req, res) => {
  const date = getCurrentYear();
  res.render("register", { Date: date , err: req.query.err || null });
});

app.get("/bookings", (req, res) => {
  const date = getCurrentYear();
  res.render("bookings", { Date: date });
});

app.get("/UserDashboard", (req, res) => {
  const date = getCurrentYear();
  res.render("UserDashboard", { Date: date });
});



//this route handles registration of new users, inserting the user data into the database and then redirecting to the login page
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  //Include the passward hash during registration and then compare the hash during login for authentication
  //do this when you are adding authentication to the app, for now we are just inserting the user data into the database without authentication
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    //This checks for if the user is already in the database, if not it will redirect to the login page with an error message
    if (result.rows.length === 0) {
      console.log("User not found");
      res.redirect("/login?err=User not found");
      return;
    }

    // This checks for if the password is correct, if not it will redirect to the login page with an error message
    const userHash = result.rows[0].password;
    bcrypt.compare(password, userHash, function (err, result) {
      if (result) {
        console.log("logged in successfully");
        res.redirect("/UserDashboard");
        return;
      }else {
        console.log("Incorrect password");
        res.redirect("/login?err=Incorrect password");
        return;
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while logging in." });
  }
});


app.post("/register", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirm_password = req.body.confirm_password;

  // Check if the password and confirm password match
  if (password !== confirm_password) {
    console.log("Passwords do not match");
    res.redirect("/register?err=Passwords do not match");
    return;
  };

  try {
    // Check if the user already exists in the database
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
    if (existingUser.rows.length > 0) {
      console.log("User already exists");
      res.redirect("/register?err=User already exists");
      return;
    }

    // Hash the password and insert the user data into the database
    const password_hash = await bcrypt.hash(password, saltRounds, function (err, hash) {
      console.log(`Password hashed successfully: ${hash}`);
      pool.query(
        "INSERT INTO users (username, email, password, is_registered) VALUES ($1, $2, $3, $4)",
        [username, email, hash, true]
      );
      console.log(`User ${username} ${email} registered successfully`);
      res.redirect("/profile");
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while hashing the password." });
  }


});



// this route will handle the search functionality for skills rendering the explore page with the search results
//Fix the search bar and link it to this logic 
//so it will use this route to handle the search functionality for skills by rendering the explore page with the search results
app.post("/explore", async (req, res) => {
  const searchItem = req.body.skill;
  try {
    const result = await pool.query(
      "SELECT * FROM skills WHERE skill_name ILIKE $1",
      [`%${searchItem}%`]
    );
    console.log(result.rows);
    // res.json(result.rows);  
    res.render('explore', { skills: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching skills." });
    console.log("Error fetching skills:", err);
  }
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});