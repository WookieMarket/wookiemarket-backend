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

// Definir el método estático para buscar un usuario por su ID
userSchema.statics.findUserById = function (userId) {
  // Utilizar el método 'findById' de Mongoose para buscar un usuario por su ID
  return User.findById(userId);
};

//DONE method that sends an email that contains the user's own email and a token to change the password
userSchema.statics.microEmailService = async function (to) {
  try {
    const user = await User.findOne({ email: to });

    if (!user) {
      throw new Error("Usuario no encontrado");
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
    throw new Error("Error al enviar el correo de recuperación de contraseña.");
  }
};

// Método estático para resetear la contraseña
userSchema.statics.resetPassword = async function (email, token, newPassword) {
  try {
    // Buscar al usuario en la base de datos por su email
    const user = await this.findOne({ email: email, resetpassword: token });

    // Si no se encuentra al usuario o el token no coincide, retornar un error
    if (!user) {
      throw new Error("Token de recuperación inválido o usuario no encontrado");
    }

    // Encriptar la nueva contraseña utilizando la función hashPassword
    const hashedPassword = await this.hashPassword(newPassword);

    // Actualizar la contraseña del usuario con la nueva contraseña encriptada
    user.password = hashedPassword;
    user.resetpassword = ""; // Borrar el token de recuperación una vez que se ha utilizado

    await user.save();

    // Responder con un mensaje de éxito
    return { message: "Contraseña modificada con éxito" };
  } catch (error) {
    console.error(error);
    throw new Error("Error al cambiar la contraseña.");
  }
};

//NOTE create model

const User = mongoose.model("User", userSchema);

module.exports = User;
