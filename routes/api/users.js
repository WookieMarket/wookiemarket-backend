const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cote = require("cote");
const sgMail = require("@sendgrid/mail");

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

// Ruta para solicitar recuperación de contraseña
router.post("/recover-password", async (req, res) => {
  const { to } = req.body; // Suponiendo que el email se envía en el cuerpo de la solicitud

  const user = await User.findOne({ email: to });
  console.log(user);

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
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

  //console.log("clave", process.env.MONGODB_CONNECTION_STR);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: to, // Change to your recipient
    from: process.env.EMAIL_SEND_GRID, // Change to your verified sender
    templateId: process.env.TEMPLATE_ID_SEND_GRID, // Reemplaza con el ID de tu plantilla
    dynamic_template_data: {
      // Agrega aquí las variables que utilizarás en tu plantilla
      email: to,
      token: token,
      subject: "Sending with SendGrid is Fun",
      message: "and easy to do anywhere, even with Node.js",
    },
  };
  console.log(msg);
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })

    .catch(error => {
      console.error(error);
    });
  res.status(200).json({
    message: "Correo de recuperación de contraseña enviado correctamente.",
  });
});

module.exports = router;
