/**
 * Base HTML wrapper for transactional emails.
 * Uses inline CSS for maximum compatibility.
 */
export const baseTemplate = (content: string, title: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #0C0C0F;
      font-family: 'IBM Plex Sans', Arial, sans-serif;
      color: #F0EEE9;
      -webkit-font-smoothing: antialiased;
    }
    
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0C0C0F;
      padding: 40px 0;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #131318;
      border: 1px solid #1E1E26;
    }
    
    .content {
      padding: 40px;
    }
    
    .header {
      margin-bottom: 30px;
      text-align: center;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00D4FF;
      text-decoration: none;
    }
    
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 20px;
      color: #F0EEE9;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 20px;
      color: #F0EEE9;
    }
    
    .muted {
      color: #6B6A72;
    }
    
    .button-container {
      margin: 30px 0;
      text-align: center;
    }
    
    .button {
      display: inline-block;
      background-color: #00D4FF;
      color: #0C0C0F !important;
      padding: 12px 24px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .footer {
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #6B6A72;
      border-top: 1px solid #1E1E26;
    }
    
    .footer a {
      color: #6B6A72;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="content">
        <div class="header">
          <a href="https://supportmind.ai" class="logo">SupportMind AI</a>
        </div>
        ${content}
      </div>
      <div class="footer">
        SupportMind AI &middot; <a href="https://supportmind.ai/unsubscribe">Unsubscribe</a> &middot; <a href="https://supportmind.ai/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
