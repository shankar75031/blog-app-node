const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const feedRoutes = require("./routes/feed");
const app = express();

const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.edrzp.mongodb.net/messages?retryWrites=true&w=majority`;

// app.use(express.urlencoded({ extended: true })); //x-www-form-urlencoded data handling done using this

// MIDDLEWARES
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));

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

// ERROR HANDLING MIDDLEWARE
app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  res.status(statusCode).json({ message: message });
});

// CONNECT TO DB
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    console.log("DB CONNECTED");
    // START SERVER
    app.listen(8080);
  })
  .catch((err) => console.error(err));
