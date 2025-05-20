import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log(session);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.linkedinVerified) {
      return NextResponse.json(
        { error: "LinkedIn verification required" },
        { status: 403 }
      );
    }

    const { to, from, message, subject } = await req.json();

    if (!to || !from || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, from, or message" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: `"Startup Platform" <${process.env.EMAIL_USER}>`,
      to,
      replyTo: from,
      subject: subject || "New Connection Request from Startup Platform",
      text: `You have a new message:\n\n${message}\n\nFrom: ${from}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Email sent" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Email sending error:", {
      message: errorMessage,
      stack: errorStack,
      env: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? "****" : "undefined",
      },
    });
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
