import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, verificationToken) => {
  // Crea il transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "selfieappbot@gmail.com", // email creata appositamente per il progetto
      pass: "APP_PASSWORD_OAUTH", // password specifica per app
    },
  });

  const verificationLink = `http://localhost:3000/verify/${verificationToken}`;

  const mailOptions = {
    from: '"Selfie App" <selfieappbot@gmail.com>',
    to: email,
    subject: 'Verifica il tuo account Selfie 📩',
    html: `
      <h2>Benvenuto in Selfie!</h2>
      <p>Per completare la registrazione clicca il bottone sotto:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background: #007bff; color: white; border-radius: 5px; text-decoration: none;">Verifica Email</a>
      <p>Se non sei stato tu, ignora questa email.</p>
    `,
  };

  // Manda la mail
  await transporter.sendMail(mailOptions);
};
