const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short" });
    }
    if (errors.length > 0) {
      const error = new Error("invalid input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }
    try {
      const existingUser = await User.findOne({ email: userInput.email });
      if (existingUser) {
        const error = new Error("User exists already");
        error.data = errors;
        error.statusCode = 422;
        throw error;
      }
      const hashedPassword = await bcrypt.hash(userInput.password, 12);
      const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPassword,
      });
      const createdUser = await user.save();
      return { ...createdUser._doc, _id: createdUser._id.toString() };
    } catch (error) {
      error.data = errors;
      error.statusCode = 500;
      throw error;
    }
  },

  login: async ({ email, password }, req) => {
    try {
      console.log(email);
      const user = await User.findOne({ email: email });
      if (!user) {
        const err = new Error("user not found");
        err.statusCode = 401;
        throw err;
      }
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const err = new Error("incorrect password");
        err.statusCode = 401;
        throw err;
      }
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        "kunjkunjkunj",
        { expiresIn: "1h" }
      );
      return { token: token, userId: user._id.toString() };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
};
