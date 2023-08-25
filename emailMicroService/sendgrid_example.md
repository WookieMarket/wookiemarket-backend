using Twilio SendGrid's v3 Node.js Library
https://github.com/sendgrid/sendgrid-nodejs

```sh
    require("dotenv").config();
    const sgMail = require("@sendgrid/mail");

    #console.log("clave", process.env.MONGODB_CONNECTION_STR);
    sgMail.setApiKey(
      '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'
    );

    const msg = {
        # Change to your recipient
        to: 'fumanchu6999@gmail.com',
        # Change to your verified sender
        from: "rp_rober@hotmail.com",
        # Reemplaza con el ID de tu plantilla
        templateId: 'd-80db78b8d28b468c936b0cc9868c974f',
        dynamic_template_data: {
            #Agrega aquí las variables que utilizarás en tu plantilla
            email,
            token,
            subject: 'Sending with SendGrid is Fun',
            message: 'and easy to do anywhere, even with Node.js'
        },
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch(error => {
        console.error(error);
      });
```
