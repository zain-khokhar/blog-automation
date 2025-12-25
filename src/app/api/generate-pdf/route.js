import puppeteer from 'puppeteer';

export async function POST(req) {
  try {
    const { html, title } = await req.json();

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();

    // Construct the full HTML with Tailwind and Typography
    // We use a CDN for Tailwind to ensure styles are applied correctly in the PDF
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="p-8 bg-white">
          <div class="max-w-4xl mx-auto">
            <div class="mb-8 text-center border-b border-slate-200 pb-6">
                <p class="text-slate-500">Topic: ${title}</p>
            </div>
            <article class="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-700">
              ${html}
            </article>
          </div>
        </body>
      </html>
    `;

    // Set content and wait for network idle to ensure Tailwind loads
    await page.setContent(content, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    await browser.close();

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return Response.json({ error: 'Failed to generate PDF: ' + error.message }, { status: 500 });
  }
}
