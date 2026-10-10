export interface WelcomeEmailProps {
  to: string;
  userName?: string | null;
  companyName: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  dashboardUrl: string;
}

export function generateWelcomeEmailHtml({
  userName,
  companyName,
  jobTitle,
  departmentName,
  dashboardUrl,
}: WelcomeEmailProps): string {
  const name = userName ? userName : "there";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141920;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FBF8F3; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E8DFD1; box-shadow: 0 4px 12px rgba(28, 25, 23, 0.04); overflow: hidden;" cellspacing="0" cellpadding="0">
          
          <tr>
            <td style="background-color: #0C1E32; padding: 28px 36px;">
              <span style="display: inline-block; background-color: #153354; color: #FFFFFF; font-weight: bold; font-size: 14px; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 4px; margin-right: 8px;">A</span>
              <span style="color: #FFFFFF; font-size: 18px; font-weight: 700; vertical-align: middle;">Ascent Onboarding</span>
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0C1E32;">
                Welcome aboard, ${name}!
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                Your employee profile has been verified at <strong>${companyName}</strong>. You are now ready to commence your onboarding milestones.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F5EE; border: 1px solid #E8DFD1; border-radius: 6px; margin: 20px 0 28px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #0C1E32;"><strong>Title:</strong> ${jobTitle || "Team Member"}</p>
                    <p style="margin: 0; font-size: 13px; color: #0C1E32;"><strong>Department:</strong> ${departmentName || "General Division"}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #0C1E32;">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 6px; background-color: #0C1E32;">
                      Go to Your Onboarding Hub &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #F8F5EE; padding: 16px 36px; border-top: 1px solid #E8DFD1; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #718096;">
                Ascent Enterprise Workspace Notification
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
