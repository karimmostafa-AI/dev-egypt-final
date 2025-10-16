import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../lib/email-service';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  orderNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, orderNumber }: ContactFormData = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address'
      }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Save the contact message to database
    // 2. Send email notification to support team
    // 3. Send confirmation email to customer

    // For demo purposes, we'll simulate the API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the contact form submission (in production, save to database)
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      subject,
      message,
      orderNumber,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // Send email notification to support team
    const emailResult = await emailService.sendContactNotification({
      name,
      email,
      phone,
      subject,
      message,
      orderNumber
    });

    if (!emailResult.success) {
      console.error('Failed to send contact notification email:', emailResult.error);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
      data: {
        id: 'contact_' + Date.now(),
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send message. Please try again or contact us directly.'
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}