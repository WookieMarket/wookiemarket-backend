const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//DONE Create Schema Users

const userSchema = mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
});

//NOTE static method all users

userSchema.statics.usersAll = function () {
  const query = User.find();
  console.log(query);
  return query;
};

userSchema.statics.hashPassword = function (rawPassword) {
  return bcrypt.hash(rawPassword, 7);
};

//NOTE instance method

userSchema.methods.comparePassword = function (rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

// Definir el método estático para buscar usuarios por su correo electrónico
userSchema.statics.findByEmail = function (email) {
  const query = User.findOne({ email: email });
  return query;
};

//NOTE create model

const User = mongoose.model("User", userSchema);

module.exports = User;
