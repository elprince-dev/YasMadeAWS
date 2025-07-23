import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const resendApiKey = Deno.env.get('RESEND_API_KEY');
if (!resendApiKey) {
  console.error('RESEND_API_KEY environment variable is not set');
  throw new Error('RESEND_API_KEY environment variable is not set');
}
const resend = new Resend(resendApiKey);
// Helper function to sanitize text
const sanitizeText = (text)=>{
  return text.replace(/['"]/g, '').trim();
};
// Helper function to process content and transform image URLs
const processContent = (content)=>{
  // Convert relative URLs to absolute and add inline styles to images
  return content.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (match, src)=>{
    // Ensure src is absolute
    const absoluteSrc = src.startsWith('http') ? src : `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${src}`;
    // Create new img tag with inline styles
    return `<img src="${absoluteSrc}" style="max-width: 100% !important; height: auto !important; display: block !important; margin: 10px auto !important;" />`;
  });
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const body = await req.json();
    const { subscribers, subject, content, logoUrl } = body;
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      throw new Error('No subscribers provided');
    }
    if (!subject || !content) {
      throw new Error('Subject and content are required');
    }
    const sanitizedSubject = sanitizeText(subject);
    const processedContent = processContent(content);
    // Create email template optimized for email clients
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${sanitizedSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa;">
        <center style="width: 100%; background-color: #f8f9fa; padding: 20px 0;">
          <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-family: Arial, sans-serif; margin: 0 auto;">
            
            <!-- Logo -->
            <tr>
              <td align="center" style="padding: 10px;">
                <img src="${logoUrl}" alt="YasMade Logo" style="width: 170px; height: auto; display: block;" />
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 0px 24px 5px; color: #333; font-size: 15px; line-height: 1.5;">
                ${processedContent}
              </td>
            </tr>

            <!-- Signature -->
            <tr>
              <td style="padding: 10px 24px 0; color: #333; font-size: 14px;">
                <p style="margin: 20px 0 4px;">Best regards,</p>
                <p style="font-weight: bold; margin: 0;">Yasmeen Allam</p>
                <p style="margin: 0;">Founder, YasMade</p>
                <p style="margin: 0;"><a href="https://yasmade.net" style="color: #007BFF; text-decoration: none;">yasmade.net</a></p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px; font-size: 11px; color: #777; text-align: center;">
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="margin: 0;">You received this email because you subscribed to our updates.</p>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>`;
    // Create plain text version
    const plainText = content.replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
    const { data, error } = await resend.emails.send({
      from: 'YasMade <no-reply@yasmade.net>',
      to: subscribers,
      subject: sanitizedSubject,
      html: emailHtml,
      text: plainText,
      reply_to: 'yasmeen.allam2405@gmail.com'
    });
    if (error) {
      throw error;
    }
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: error.status || 500
    });
  }
}); // import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 // import { Resend } from 'npm:resend';
 // const corsHeaders = {
 //   'Access-Control-Allow-Origin': '*',
 //   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 //   'Access-Control-Allow-Methods': 'POST, OPTIONS'
 // };
 // const resendApiKey = Deno.env.get('RESEND_API_KEY');
 // if (!resendApiKey) {
 //   console.error('RESEND_API_KEY environment variable is not set');
 //   throw new Error('RESEND_API_KEY environment variable is not set');
 // }
 // const resend = new Resend(resendApiKey);
 // // Helper function to sanitize text
 // const sanitizeText = (text)=>{
 //   return text.replace(/['"]/g, '').trim();
 // };
 // // Helper function to process content and transform image URLs
 // const processContent = (content)=>{
 //   // Convert relative URLs to absolute and add inline styles to images
 //   return content.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (match, src)=>{
 //     // Ensure src is absolute
 //     const absoluteSrc = src.startsWith('http') ? src : `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${src}`;
 //     // Create new img tag with inline styles
 //     return `<img src="${absoluteSrc}" style="max-width: 100% !important; height: auto !important; display: block !important; margin: 10px auto !important;" />`;
 //   });
 // };
 // serve(async (req)=>{
 //   if (req.method === 'OPTIONS') {
 //     return new Response(null, {
 //       headers: corsHeaders
 //     });
 //   }
 //   try {
 //     const authHeader = req.headers.get('Authorization');
 //     if (!authHeader) {
 //       throw new Error('No authorization header');
 //     }
 //     const body = await req.json();
 //     const { subscribers, subject, content, logoUrl } = body;
 //     if (!Array.isArray(subscribers) || subscribers.length === 0) {
 //       throw new Error('No subscribers provided');
 //     }
 //     if (!subject || !content) {
 //       throw new Error('Subject and content are required');
 //     }
 //     const sanitizedSubject = sanitizeText(subject);
 //     const processedContent = processContent(content);
 //     // Create email template optimized for email clients
 //     const emailHtml = `
 // <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
 // <html xmlns="http://www.w3.org/1999/xhtml">
 // <head>
 //   <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
 //   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 //   <title>${sanitizedSubject}</title>
 // </head>
 // <body style="margin: 0; padding: 0; min-width: 100%; background-color: #f8f9fa;">
 //   <center style="width: 100%; table-layout: fixed; background-color: #f8f9fa; padding-top: 40px; padding-bottom: 40px;">
 //     <table align="center" width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto; max-width: 600px; background-color: #ffffff; border-spacing: 0; font-family: Arial, sans-serif; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
 //       <!-- Logo Section -->
 //       <tr>
 //         <td align="center" style="padding: 40px 30px 20px;">
 //           <img src="${logoUrl}" alt="YasMade Logo" style="width: 150px; height: auto; display: block; margin: 0 auto;" />
 //         </td>
 //       </tr>
 //       <!-- Content Section -->
 //       <tr>
 //         <td style="padding: 20px 30px 40px; text-align: left;">
 //           <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333;">
 //             ${processedContent}
 //           </div>
 //           <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666666; text-align: center;">
 //             <p style="margin: 0;">You received this email because you are subscribed to our updates.</p>
 //           </div>
 //         </td>
 //       </tr>
 //     </table>
 //   </center>
 // </body>
 // </html>`;
 //     // Create plain text version
 //     const plainText = content.replace(/<[^>]+>/g, '') // Remove HTML tags
 //     .replace(/&nbsp;/g, ' ') // Replace HTML entities
 //     .replace(/\s+/g, ' ') // Normalize whitespace
 //     .trim();
 //     const { data, error } = await resend.emails.send({
 //       from: 'YasMade <onboarding@resend.dev>',
 //       to: subscribers,
 //       subject: sanitizedSubject,
 //       html: emailHtml,
 //       text: plainText,
 //       reply_to: 'yasmeen.allam2405@gmail.com'
 //     });
 //     if (error) {
 //       throw error;
 //     }
 //     return new Response(JSON.stringify({
 //       success: true,
 //       data
 //     }), {
 //       headers: {
 //         ...corsHeaders,
 //         'Content-Type': 'application/json'
 //       },
 //       status: 200
 //     });
 //   } catch (error) {
 //     console.error('Error:', error);
 //     return new Response(JSON.stringify({
 //       success: false,
 //       error: error.message || 'An unexpected error occurred'
 //     }), {
 //       headers: {
 //         ...corsHeaders,
 //         'Content-Type': 'application/json'
 //       },
 //       status: error.status || 500
 //     });
 //   }
 // });
