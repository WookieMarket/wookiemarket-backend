const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//DONE Create Schema Users

const userSchema = mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  resetpassword: String,
});

//NOTE static method all users

userSchema.statics.usersAll = function () {
  const query = User.find();
  console.log(query);
  return query;
};

//DONE Define the static method to search for users by their email
userSchema.statics.findByEmail = function (email) {
  const query = User.findOne({ email: email });
  return query;
};

//DONE Define the static method to look up a user by their ID
userSchema.statics.findUserById = function (userId) {
  const query = User.findById(userId);
  return query;
};

userSchema.statics.hashPassword = function (rawPassword) {
  return bcrypt.hash(rawPassword, 7);
};

//NOTE instance method

userSchema.methods.comparePassword = function (rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

//NOTE create model

const User = mongoose.model("User", userSchema);

module.exports = User;
