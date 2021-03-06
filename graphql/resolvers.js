const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");
const { clearImage } = require("../utils/file");

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
  createPost: async ({ postInput }, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      const errors = [];
      if (
        validator.isEmpty(postInput.title) ||
        !validator.isLength(postInput.title, { min: 5 })
      ) {
        errors.push({ message: "Title is invalid" });
      }
      if (
        validator.isEmpty(postInput.content) ||
        !validator.isLength(postInput.content, { min: 5 })
      ) {
        errors.push({ message: "Content is invalid" });
      }
      if (errors.length > 0) {
        const error = new Error("Invalid input");
        error.data = errors;
        error.statusCode = 422;
        throw error;
      }
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("Invalid user");
        error.statusCode = 401;
        throw error;
      }
      console.log(postInput.imageUrl);
      const post = new Post({
        title: postInput.title,
        content: postInput.content,
        imageUrl: postInput.imageUrl.replace("\\", "/"),
        creator: user,
      });
      const createdPost = await post.save();
      user.posts.push(createdPost);
      await user.save();
      return {
        ...createdPost._doc,
        _id: createdPost._id.toString(),
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: createdPost.updatedAt.toISOString(),
      };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
  posts: async ({ page }, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      if (!page) {
        page = 1;
      }
      const perPage = 2;
      const totalPosts = await Post.find().countDocuments();
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate("creator");
      return {
        posts: posts.map((post) => {
          return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
          };
        }),
        totalPosts: totalPosts,
      };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
  post: async ({ id }, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("No post found");
        error.statusCode = 404;
        throw error;
      }
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
  updatePost: async ({ id, postInput }, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("No post found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error("Unauthorized");
        error.statusCode = 403;
        throw error;
      }
      const errors = [];
      if (
        validator.isEmpty(postInput.title) ||
        !validator.isLength(postInput.title, { min: 5 })
      ) {
        errors.push({ message: "Title is invalid" });
      }
      if (
        validator.isEmpty(postInput.content) ||
        !validator.isLength(postInput.content, { min: 5 })
      ) {
        errors.push({ message: "Content is invalid" });
      }
      if (errors.length > 0) {
        const error = new Error("Invalid input");
        error.data = errors;
        error.statusCode = 422;
        throw error;
      }
      post.title = postInput.title;
      if (postInput.imageUrl !== "undefined") {
        post.imageUrl = postInput.imageUrl;
      }
      post.content = postInput.content;
      const updatedPost = await post.save();
      console.log(updatedPost);
      return {
        ...updatedPost._doc,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
      };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
  deletePost: async ({ id }, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("No post found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error("Unauthorized");
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageUrl);
      await Post.findByIdAndRemove(id);
      const user = await User.findById(req.userId);
      user.posts.pull(id);
      await user.save();
      return true;
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
  user: async (args, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("No user found");
        error.statusCode = 404;
        throw error;
      }
      return {
        ...user._doc,
        _id: user._id.toString(),
      };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
  updateStatus: async ({ status }, req) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not authenticated");
        error.statusCode = 401;
        throw error;
      }
      const fetchedUser = await User.findById(req.userId);
      if (!fetchedUser) {
        const error = new Error("No user found");
        error.statusCode = 404;
        throw error;
      }
      fetchedUser.status = status;
      await fetchedUser.save();

      return {
        ...fetchedUser._doc,
        _id: fetchedUser._id.toString(),
      };
    } catch (error) {
      error.data = [];
      error.statusCode = 500;
      throw error;
    }
  },
};
