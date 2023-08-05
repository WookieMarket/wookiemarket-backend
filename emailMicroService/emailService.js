// email-responder.js
"use strict";
const cote = require("cote");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY);

const emailResponder = new cote.Responder({ name: "email-responder" });

emailResponder.on("send_email", async (req, done) => {
  const {
    to,
    from,
    templateId,
    dynamic_template_data: { email, token },
  } = req;
  try {
    const msg = {
      to,
      from,
      templateId,
      dynamic_template_data: {
        email,
        token,
      },
    };

    const info = await sgMail.send(msg);
    done(null, info);
  } catch (error) {
    console.error(error);
    done(error);
  }
});
