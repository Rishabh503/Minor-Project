export interface InvitationEmailProps {
  to: string;
  inviterName?: string | null;
  companyName: string;
  role: string;
  inviteUrl: string;
}

export function generateInvitationEmailHtml({
  inviterName,
  companyName,
  role,
  inviteUrl,
}: InvitationEmailProps): string {
  const formattedRole = role.replace("_", " ");
  const senderDisplay = inviterName ? inviterName : "Your organization administrator";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${companyName} on Ascent</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141920;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FBF8F3; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E8DFD1; box-shadow: 0 4px 12px rgba(28, 25, 23, 0.04); overflow: hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Editorial Header -->
          <tr>
            <td style="background-color: #0C1E32; padding: 28px 36px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #153354; color: #FFFFFF; font-weight: bold; font-size: 14px; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 4px; margin-right: 8px;">A</span>
                    <span style="color: #FFFFFF; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; vertical-align: middle;">Ascent Onboarding</span>
                  </td>
                  <td align="right">
                    <span style="background-color: #1A3E66; color: #F07E69; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;">Workspace Invite</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0C1E32; line-height: 1.3;">
                You've been invited to join <span style="color: #E85D42;">${companyName}</span>
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                ${senderDisplay} has granted you access to the <strong>${companyName}</strong> enterprise workspace on Ascent.
              </p>

              <!-- Role & Tenancy Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F5EE; border: 1px solid #E8DFD1; border-radius: 6px; margin: 20px 0 28px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; padding-bottom: 4px;">Assigned Role</td>
                        <td align="right" style="font-size: 13px; font-weight: 700; color: #0C1E32;">${formattedRole}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; padding-top: 8px; border-top: 1px dashed #E2D9CC;">Organization</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #0C1E32; padding-top: 8px; border-top: 1px dashed #E2D9CC;">${companyName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #4A5568;">
                Click below to activate your account, complete your employee identity record, and begin your onboarding track:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #E85D42;">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 6px; background-color: #E85D42; letter-spacing: 0.01em;">
                      Accept Invitation &amp; Get Started &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 0 0; font-size: 12px; color: #718096; line-height: 1.5;">
                Or copy and paste this URL into your browser:<br>
                <a href="${inviteUrl}" style="color: #0C1E32; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F5EE; padding: 20px 36px; border-top: 1px solid #E8DFD1; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #718096; line-height: 1.4;">
                This invitation was sent specifically to this email address. If you were not expecting this, you can safely disregard this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
