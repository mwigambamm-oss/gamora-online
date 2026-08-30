import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // save database
    const { error } = await supabase
      .from("messages")
      .insert([
        {
          name,
          email,
          message,
        },
      ]);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }


    // send email to admin
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.ADMIN_RESET_EMAIL!,
      subject: "New Customer Message - GAMORA ONLINE",
      html: `
        <h2>New Message From Customer</h2>

        <p><b>Name:</b> ${name}</p>

        <p><b>Email:</b> ${email || "No email"}</p>

        <p><b>Message:</b></p>

        <p>${message}</p>

      `,
    });


    return NextResponse.json({
      success: true,
    });


  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }
}
