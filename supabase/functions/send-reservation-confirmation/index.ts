import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReservationConfirmationRequest {
  name: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  restaurantName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, date, time, guests, restaurantName }: ReservationConfirmationRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    // Format the date for display
    const displayDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: `${restaurantName} <onboarding@resend.dev>`,
      to: [email],
      subject: `Reservation Confirmation - ${restaurantName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);">
                      <h1 style="margin: 0; color: #0a0a0a; font-size: 28px; font-weight: 700;">Reservation Confirmed!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 24px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                        Dear <strong style="color: #84cc16;">${name}</strong>,
                      </p>
                      <p style="margin: 0 0 32px; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        Your reservation at <strong style="color: #e5e5e5;">${restaurantName}</strong> has been confirmed. We look forward to welcoming you!
                      </p>
                      
                      <!-- Reservation Details Card -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #262626; border-radius: 12px; margin-bottom: 32px;">
                        <tr>
                          <td style="padding: 24px;">
                            <h2 style="margin: 0 0 20px; color: #84cc16; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reservation Details</h2>
                            
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #404040;">
                                  <span style="color: #a3a3a3; font-size: 14px;">📅 Date</span>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #404040; text-align: right;">
                                  <span style="color: #e5e5e5; font-size: 14px; font-weight: 600;">${displayDate}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #404040;">
                                  <span style="color: #a3a3a3; font-size: 14px;">🕐 Time</span>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #404040; text-align: right;">
                                  <span style="color: #e5e5e5; font-size: 14px; font-weight: 600;">${time}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0;">
                                  <span style="color: #a3a3a3; font-size: 14px;">👥 Guests</span>
                                </td>
                                <td style="padding: 12px 0; text-align: right;">
                                  <span style="color: #e5e5e5; font-size: 14px; font-weight: 600;">${guests} ${guests === 1 ? 'person' : 'people'}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; color: #a3a3a3; font-size: 14px; line-height: 1.6;">
                        If you need to modify or cancel your reservation, please contact us directly.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #171717; text-align: center;">
                      <p style="margin: 0; color: #737373; font-size: 12px;">
                        © ${new Date().getFullYear()} ${restaurantName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
