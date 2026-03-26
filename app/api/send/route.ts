import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return NextResponse.json({ error: 'Mail service unconfigured' }, { status: 500 });
    }
    const resend = new Resend(resendApiKey);

    const { to, subject, html } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Synapse <Synapse@nucleovir.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
