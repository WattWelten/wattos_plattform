import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen lang sein'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validierung mit Zod
    const validatedData = contactFormSchema.parse(body);

    // Hier würde normalerweise die Nachricht an einen E-Mail-Service oder Datenbank gesendet
    // Für jetzt loggen wir es und senden eine Bestätigung
    console.log('Contact form submission:', {
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message,
      timestamp: new Date().toISOString(),
    });

    // In Production: Hier würde die Nachricht z.B. an einen E-Mail-Service gesendet
    // oder in einer Datenbank gespeichert werden

    return NextResponse.json(
      {
        success: true,
        message: 'Ihre Nachricht wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.',
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validierungsfehler',
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    );
  }
}

