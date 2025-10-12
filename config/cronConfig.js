import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

export const sendEmailReport = async (reports, month, year, recipientEmails) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: recipientEmails, 
    subject: `Monthly Attendance Report – ${month + 1}/${year}`,
    html: `
      <h2>Attendance Report for ${month + 1}/${year}</h2>
      <p>Total Students: ${reports.length}</p>
      <ul>
        ${reports
          .map(
            (r) =>
              `<li>Student: ${r._id.student} — ${r.attendancePercentage}% attendance</li>`
          )
          .join("")}
      </ul>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};
