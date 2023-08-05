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

//NOTE Define the static method to search for users by their email
userSchema.statics.findByEmail = function (email) {
  const query = User.findOne({ email: email });
  return query;
};

userSchema.statics.microEmailService = async function (to) {
  try {
    const user = await this.findOne({ email: to });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Borramos el campo resetpassword antes de almacenar el nuevo valor
    user.resetpassword = "";

    // Aquí generas el token de recuperación de contraseña
    const token = jwt.sign(
      { resetpassword: user.resetpassword },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    user.resetpassword = token;
    await user.save();

    console.log("token", token);

    // Enviar el mensaje al microservicio para enviar el correo electrónico
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
    console.log("email", emailRequest);

    return new Promise(resolve => requester.send(emailRequest, resolve));
  } catch (error) {
    throw new Error("Error al enviar el correo de recuperación de contraseña.");
  }
};

//NOTE create model

const User = mongoose.model("User", userSchema);

module.exports = User;
