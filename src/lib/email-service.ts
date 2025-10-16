// Email Service
// Basic email notification system for order confirmations and customer communications

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  template: EmailTemplate;
  variables?: Record<string, any>;
}

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Send order confirmation email
  async sendOrderConfirmation(orderData: OrderConfirmationData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.getOrderConfirmationTemplate(orderData);

      // In a real implementation, you would:
      // 1. Use a service like SendGrid, AWS SES, or similar
      // 2. Send the email via SMTP or API
      // 3. Handle email templates and variables

      console.log('Sending order confirmation email:', {
        to: orderData.customerEmail,
        subject: template.subject,
        orderNumber: orderData.orderNumber
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // For demo purposes, we'll just log the email content
      console.log('Email would be sent with content:', template);

      return { success: true };
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  // Send contact form notification
  async sendContactNotification(contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    orderNumber?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.getContactNotificationTemplate(contactData);

      console.log('Sending contact notification email:', {
        to: 'support@deveg.com', // Support email
        subject: template.subject,
        from: contactData.email
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 300));

      return { success: true };
    } catch (error) {
      console.error('Error sending contact notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }

  // Get order confirmation email template
  private getOrderConfirmationTemplate(orderData: OrderConfirmationData): EmailTemplate {
    const itemsList = orderData.items.map(item =>
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${item.name}<br>
          <small style="color: #6b7280;">Qty: ${item.quantity}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          $${item.total.toFixed(2)}
        </td>
      </tr>`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - ${orderData.orderNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">
              Thank you for shopping with Dev Egypt
            </p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #1f2937;">Order Details</h2>
            <p style="margin: 0 0 10px 0;"><strong>Order Number:</strong> ${orderData.orderNumber}</p>
            <p style="margin: 0 0 10px 0;"><strong>Customer:</strong> ${orderData.customerName}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Subtotal:</span>
              <span>$${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Shipping:</span>
              <span>${orderData.shipping === 0 ? 'FREE' : '$' + orderData.shipping.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Tax:</span>
              <span>$${orderData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #e5e7eb; padding-top: 15px;">
              <span>Total:</span>
              <span>$${orderData.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">Shipping Address</h3>
            <p style="margin: 0;">
              ${orderData.shippingAddress.fullName}<br>
              ${orderData.shippingAddress.addressLine1}<br>
              ${orderData.shippingAddress.addressLine2 ? orderData.shippingAddress.addressLine2 + '<br>' : ''}
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}<br>
              ${orderData.shippingAddress.country}
            </p>
          </div>

          <div style="text-align: center; padding: 30px; background: #f8fafc; border-radius: 8px;">
            <p style="margin: 0 0 15px 0; color: #6b7280;">
              Questions about your order? We're here to help!
            </p>
            <a href="mailto:support@deveg.com" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contact Support
            </a>
          </div>
        </body>
      </html>
    `;

    const text = `
      Order Confirmed - ${orderData.orderNumber}

      Thank you for shopping with Dev Egypt!

      Order Details:
      Order Number: ${orderData.orderNumber}
      Customer: ${orderData.customerName}
      Date: ${new Date().toLocaleDateString()}

      Items Ordered:
      ${orderData.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.total.toFixed(2)}`).join('\n')}

      Order Summary:
      Subtotal: $${orderData.subtotal.toFixed(2)}
      Shipping: ${orderData.shipping === 0 ? 'FREE' : '$' + orderData.shipping.toFixed(2)}
      Tax: $${orderData.tax.toFixed(2)}
      Total: $${orderData.total.toFixed(2)}

      Shipping Address:
      ${orderData.shippingAddress.fullName}
      ${orderData.shippingAddress.addressLine1}
      ${orderData.shippingAddress.addressLine2 || ''}
      ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}
      ${orderData.shippingAddress.country}

      Questions? Contact us at support@deveg.com

      Thank you for choosing Dev Egypt!
    `;

    return {
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html,
      text
    };
  }

  // Get contact notification template
  private getContactNotificationTemplate(contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    orderNumber?: string;
  }): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937;">New Contact Form Submission</h2>

            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Customer Information</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${contactData.name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${contactData.email}</p>
              ${contactData.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
              ${contactData.orderNumber ? `<p style="margin: 5px 0;"><strong>Order Number:</strong> ${contactData.orderNumber}</p>` : ''}
            </div>

            <div style="background: white; padding: 20px; border-radius: 6px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Message</h3>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${contactData.subject}</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                ${contactData.message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px;">
                This message was sent from the Dev Egypt contact form.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      New Contact Form Submission

      Customer Information:
      Name: ${contactData.name}
      Email: ${contactData.email}
      ${contactData.phone ? `Phone: ${contactData.phone}` : ''}
      ${contactData.orderNumber ? `Order Number: ${contactData.orderNumber}` : ''}

      Subject: ${contactData.subject}

      Message:
      ${contactData.message}

      ---
      This message was sent from the Dev Egypt contact form.
    `;

    return {
      subject: `Contact Form: ${contactData.subject}`,
      html,
      text
    };
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();