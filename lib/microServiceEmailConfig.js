const { User } = require("../models");
const cote = require("cote");
const jwt = require("jsonwebtoken");

const requester = new cote.Requester({ name: "email-requester" });

//DONE method that sends an email that contains the user's own email and a token to change the password
async function microEmailService(to) {
  try {
    const user = await User.findByEmail(to);

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
}

//DONE Static method to reset password

async function resetPassword(email, token, newPassword) {
  try {
    //NOTE Search for the user in the database by their email

    const user = await User.findByEmail(email);
    console.log("usuario", user);

    // NOTE If the user is not found, return an error
    if (!user) {
      throw new Error("User not found");
    }

    // NOTE If the resetpassword token does not match, return an error
    if (user.resetpassword !== token) {
      console.log("usuario", user.resetpassword);
      throw new Error("Invalid recovery token");
    }

    //NOTE Encrypt the new password using the hashPassword function
    const hashedPassword = await User.hashPassword(newPassword);

    //NOTE Update the user's password with the new encrypted password
    user.password = hashedPassword;

    //NOTE Delete the recovery token after it has been used
    user.resetpassword = "";

    await user.save();

    //NOTE Reply with a success message
    return { message: "Password changed successfully" };
  } catch (error) {
    console.error(error);
    throw error; // Re-lanzar la excepción capturada para que se propague
  }
}

module.exports = { microEmailService, resetPassword };
