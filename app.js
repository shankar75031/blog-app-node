const express = require("express");

const feedRoutes = require("./routes/feed");
const app = express();

// app.use(express.urlencoded({ extended: true })); //x-www-form-urlencoded data handling done using this

// MIDDLEWARES
app.use(express.json());

app.use((req, res, next) => {
  // Set which domains can send requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Set types of HTTP requests to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  // Set the types of headers that the client can set on their requests
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ROUTES
app.use("/feed", feedRoutes);

// START SERVER
app.listen(8080);
