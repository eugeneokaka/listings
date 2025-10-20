import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  console.log("✅ [CONTACT API] Route reached");

  try {
    const body = await req.json();
    console.log("📥 Received body:", body);

    const { to, name, email, message } = body;

    // 🔍 Basic validation
    if (!to || !name || !email || !message) {
      console.log("⚠️ Missing required fields");
      return NextResponse.json(
        { error: "Please fill in all fields before submitting." },
        { status: 400 }
      );
    }

    console.log("🚀 Sending email via Resend...");

    const response = await resend.emails.send({
      from: "No Reply <noreply@mail.eugenecode.xyz>",
      to,
      subject: `New Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>New message from ${name}</h2>
          <p><strong>Sender Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `,
    });

    // ✅ Handle API-level issues
    if (response.error) {
      console.error("📨 Resend error:", response.error);
      return NextResponse.json(
        { error: response.error.message || "Email service failed." },
        { status: 502 }
      );
    }

    console.log("✅ Email sent successfully:", response);
    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      response,
    });
  } catch (error: any) {
    console.error("❌ Email send error:", error);
    let message = "Unexpected server error occurred.";
    if (error?.response?.status === 401)
      message = "Invalid API key or authentication error.";
    else if (error?.response?.status === 429)
      message = "Email service limit reached. Please try again later.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
