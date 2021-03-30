const express = require("express");

const feedRoutes = require("./routes/feed");
const app = express();

// app.use(express.urlencoded({ extended: true })); //x-www-form-urlencoded data handling done using this

// MIDDLEWARES
app.use(express.json());

// ROUTES
app.use("/feed", feedRoutes);

// START SERVER
app.listen(8080);
