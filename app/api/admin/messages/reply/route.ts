
import { NextResponse } from "next/server";
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
    const { email, reply } = await req.json();

    if (
      typeof email !== "string" ||
      typeof reply !== "string" ||
      !email.trim() ||
      !reply.trim()
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.error("Resend environment variables are missing.");

      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);

    const safeReply = escapeHtml(reply.trim()).replace(/\r?\n/g, "<br/>");

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: "Reply from GAMORA ONLINE",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>GAMORA ONLINE</h2>
          <p>${safeReply}</p>
          <br/>
          <hr/>
          <p style="color:#777;font-size:12px">
            Reply from GAMORA ONLINE Customer Support
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);

      return NextResponse.json(
        { error: "Failed to send email." },
        { status: 502 }
      );
    }

    console.log("RESEND SUCCESS:", data);

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error) {
    console.error("RESEND ERROR:", error);

    return NextResponse.json(
      { error: "Server error while sending email." },
      { status: 500 }
    );
  }
}
