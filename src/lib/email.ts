import nodemailer from "nodemailer";

type SendPasswordResetParams = {
  to: string;
  url: string;
  name?: string | null;
};

const fromAddress =
  process.env.MAIL_FROM ?? "Family Cloud <no-reply@family-cloud.local>";

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail({
  to,
  url,
  name,
}: SendPasswordResetParams) {
  if (!hasSmtpConfig()) {
    console.info(`[Family Cloud Auth] Password reset link for ${to}: ${url}`);
    return;
  }

  const transporter = createTransport();
  const displayName = name?.trim() || "there";

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Reset your Family Cloud password",
    text: `Hi ${displayName},\n\nReset your password by opening this link:\n${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hi ${displayName},</p><p>Reset your password by opening this link:</p><p><a href="${url}">${url}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
