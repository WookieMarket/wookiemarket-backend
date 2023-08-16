const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cote = require("cote");
const sgMail = require("@sendgrid/mail");

const requester = new cote.Requester({ name: "email-requester" });

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

userSchema.statics.hashPassword = function (rawPassword) {
  return bcrypt.hash(rawPassword, 7);
};

//NOTE instance method

userSchema.methods.comparePassword = function (rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
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

//DONE method that sends an email that contains the user's own email and a token to change the password
userSchema.statics.microEmailService = async function (to) {
  try {
    const user = await User.findOne({ email: to });

    if (!user) {
      throw new Error("user not found");
    }

    //NOTE We clear the resetpassword field before storing the new value
    user.resetpassword = "";

    //NOTE Here you generate the password recovery token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    //NOTE I delete the old token before re-saving the new one
    user.resetpassword = token;
    await user.save();

    //NOTE Send the message to the microservice to send the email
    const emailRequest = {
      type: "send_email",
      to: to,
      from: process.env.EMAIL_SEND_GRID,
      templateId: process.env.TEMPLATE_ID_SEND_GRID,
      dynamic_template_data: {
        email: to,
        token: token,
      },
    };

    return new Promise(resolve => requester.send(emailRequest, resolve));
  } catch (error) {
    throw new Error("Error sending password recovery email.");
  }
};

//DONE Static method to reset password

userSchema.statics.resetPassword = async function (email, token, newPassword) {
  try {
    //NOTE Search for the user in the database by their email

    const user = await this.findOne({ email: email, resetpassword: token });

    //NOTE If the user is not found or the token does not match, return an error
    if (!user) {
      throw new Error("Invalid recovery token or user not found");
    }

    //NOTE Encrypt the new password using the hashPassword function
    const hashedPassword = await this.hashPassword(newPassword);

    //NOTE Update the user's password with the new encrypted password
    user.password = hashedPassword;

    //NOTE Delete the recovery token after it has been used
    user.resetpassword = "";

    await user.save();

    //NOTE Reply with a success message
    return { message: "Password changed successfully" };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to change password.");
  }
};

//NOTE create model

const User = mongoose.model("User", userSchema);

module.exports = User;
