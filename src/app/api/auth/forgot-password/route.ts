import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();

    // Always return success to avoid email enumeration
    const user = await prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true, name: true, password: true },
    });

    if (user?.password) {
      // Delete any existing token for this email
      await prisma.passwordResetToken.deleteMany({ where: { email: normalised } });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email: normalised, token, expires },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

      await resend.emails.send({
        from: "BookWrm <noreply@bookwrm.app>",
        to: normalised,
        subject: "Reset your BookWrm password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h2 style="font-size:20px;margin-bottom:8px;">Reset your password</h2>
            <p style="color:#555;margin-bottom:24px;">
              Hi ${user.name ?? "there"},<br/>
              We received a request to reset your BookWrm password.
              Click the button below — this link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#4a7c59;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset password
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:24px;">
              If you didn't request this, you can safely ignore this email.<br/>
              The link will expire automatically.
            </p>
          </div>
        `,
      });
    }

    // Always return the same response
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
