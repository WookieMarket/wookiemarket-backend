const express = require("express");
const router = express.Router();
const { User } = require("../../models");
//const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//const cote = require("cote");
//const sgMail = require("@sendgrid/mail");

router.get("/", async (req, res, next) => {
  try {
    let users = {};
    users = await User.usersAll();

    res.json({ results: users });
  } catch (error) {
    next(error);
  }
});

router.get("/email/:email", async (req, res, next) => {
  try {
    let email = req.params.email;
    emailUser = await User.findByEmail(email);

    res.json({ results: emailUser });
  } catch (error) {
    next(error);
  }
});

// // Ruta para solicitar recuperación de contraseña
// router.post("/recover-password", async (req, res) => {
//   const { to } = req.body; // Suponiendo que el email se envía en el cuerpo de la solicitud
//   try {
//     await User.microEmailService(to);
//     //await microEmailService({ type: "send_email", to: to });
//     res.status(200).json({
//       message: "Correo de recuperación de contraseña enviado correctamente.",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Error al enviar el correo de recuperación de contraseña.",
//     });
//   }
// });

// Ruta para enviar un correo de recuperacion de contraseña
router.post("/email-password", async (req, res) => {
  const { to } = req.body; // Suponiendo que el email se envía en el cuerpo de la solicitud

  try {
    await User.microEmailService(to);

    res.status(200).json({
      message: "Correo de recuperación de contraseña enviado correctamente.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al enviar el correo de recuperación de contraseña.",
    });
  }
});

// Ruta para solicitar recuperación de contraseña

router.post("/recover-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    // Verificar si el token de la URL es válido y decodificarlo
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener el ID del usuario desde el token decodificado
    const userId = decodedToken.userId;

    console.log("token decodi", decodedToken);

    // Obtener el usuario desde la base de datos utilizando el ID del usuario
    const user = await User.findUserById(userId);
    console.log("usuario", user);

    // Verificar si el token almacenado en la base de datos coincide con el token de la URL
    if (user && user.resetpassword === token) {
      // Si el token coincide, proceder a cambiar la contraseña
      await User.resetPassword(email, token, newPassword);

      return res.status(200).json({
        message: "Contraseña cambiada correctamente",
      });
    } else {
      return res.status(400).json({
        error: "Token inválido o expirado.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error al cambiar la contraseña.",
    });
  }
});

module.exports = router;

// // Ruta para solicitar recuperación de contraseña
// router.post("/recover-password", async (req, res) => {
//   const { to } = req.body; // Suponiendo que el email se envía en el cuerpo de la solicitud

//   const user = await User.findOne({ email: to });
//   console.log(user);

//   if (!user) {
//     return res.status(404).json({ error: "Usuario no encontrado" });
//   }

//   // Borramos el campo resetpassword antes de almacenar el nuevo valor
//   user.resetpassword = "";

//   // Aquí generas el token de recuperación de contraseña
//   const token = jwt.sign(
//     { resetpassword: user.resetpassword },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: "1h",
//     },
//   );

//   user.resetpassword = token;
//   await user.save();

//   console.log("token", token);

//   //console.log("clave", process.env.MONGODB_CONNECTION_STR);
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//   const msg = {
//     to: to, // Change to your recipient
//     from: process.env.EMAIL_SEND_GRID, // Change to your verified sender
//     templateId: process.env.TEMPLATE_ID_SEND_GRID, // Reemplaza con el ID de tu plantilla
//     dynamic_template_data: {
//       // Agrega aquí las variables que utilizarás en tu plantilla
//       email: to,
//       token: token,
//       subject: "Sending with SendGrid is Fun",
//       message: "and easy to do anywhere, even with Node.js",
//     },
//   };
//   console.log(msg);
//   sgMail
//     .send(msg)
//     .then(() => {
//       console.log("Email sent");
//     })

//     .catch(error => {
//       console.error(error);
//     });
//   res.status(200).json({
//     message: "Correo de recuperación de contraseña enviado correctamente.",
//   });
// });
