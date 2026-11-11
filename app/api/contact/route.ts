
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, message } = body;

    if (
      typeof name !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !message.trim() ||
      (email != null && typeof email !== "string")
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    // Save customer message to database
    const { error } = await supabase
      .from("messages")
      .insert([
        {
          name: name.trim(),
          email: email?.trim() || null,
          message: message.trim(),
        },
      ]);

    if (error) {
      console.error("Message database error:", error);

      return NextResponse.json(
        { error: "Failed to save message." },
        { status: 500 }
      );
    }

    // Send email notification if Resend is configured
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const adminEmail = process.env.ADMIN_RESET_EMAIL;

    if (!apiKey || !fromEmail || !adminEmail) {
      console.error("Contact email environment variables are missing.");

      return NextResponse.json({
        success: true,
        emailSent: false,
        message: "Your message was saved successfully.",
      });
    }

    try {
      const resend = new Resend(apiKey);

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: "New Customer Message - GAMORA ONLINE",
        html: `
          <div style="font-family:Arial,sans-serif">
            <h2>New Message From Customer</h2>
            <p><b>Name:</b> ${escapeHtml(name.trim())}</p>
            <p><b>Email:</b> ${escapeHtml(email?.trim() || "No email")}</p>
            <p><b>Message:</b></p>
            <p>${escapeHtml(message.trim()).replace(/\r?\n/g, "<br/>")}</p>
          </div>
        `,
      });

      if (emailError) {
        console.error("Contact email error:", emailError);
      } else {
        console.log("Contact email notification sent.");
      }

      return NextResponse.json({
        success: true,
        emailSent: !emailError,
      });
    } catch (emailError) {
      console.error("Contact email failed:", emailError);

      return NextResponse.json({
        success: true,
        emailSent: false,
        message: "Your message was saved successfully.",
      });
    }
  } catch (error) {
    console.error("Contact API error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
