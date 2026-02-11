// Generates small demo files locally (no external URLs).
// Seeder will write these into /scripts/demo_assets and then copy into /uploads/* with UUID names.

export type DemoAsset = {
  relativePath: string // inside scripts/demo_assets/
  bytesBase64: string
}

// Minimal valid PDF (tiny) with a single page and text label.
function tinyPdfBase64(label: string) {
  // A super small PDF template; the label is embedded in a text object.
  const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${40 + label.length} >>stream
BT
/F1 24 Tf
72 720 Td
(${label}) Tj
ET
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000117 00000 n 
0000000276 00000 n 
0000000390 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
470
%%EOF`
  return Buffer.from(pdf, 'utf8').toString('base64')
}

// 1x1 transparent PNG
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ax+ZQAAAABJRU5ErkJggg=='

// Plain text “docx” placeholder (not a real docx zip, but good enough for downloads in demo).
function docxPlaceholderBase64(label: string) {
  const txt = `DEMO DOCUMENT (placeholder)\n\n${label}\n\nThis is demo content for Realty Maitra.`
  return Buffer.from(txt, 'utf8').toString('base64')
}

export function getDemoAssets(): DemoAsset[] {
  const assets: DemoAsset[] = []

  // Training PDFs (12)
  for (let i = 1; i <= 12; i++) {
    assets.push({
      relativePath: `training/training-${String(i).padStart(2, '0')}.pdf`,
      bytesBase64: tinyPdfBase64(`Training PDF ${i}`),
    })
  }

  // Training docs/notes (8)
  for (let i = 1; i <= 8; i++) {
    assets.push({
      relativePath: `training/notes-${String(i).padStart(2, '0')}.docx`,
      bytesBase64: docxPlaceholderBase64(`Training Notes ${i}`),
    })
  }

  // Project PDFs (4)
  for (let i = 1; i <= 4; i++) {
    assets.push({
      relativePath: `projects/project-doc-${i}.pdf`,
      bytesBase64: tinyPdfBase64(`Project Document ${i}`),
    })
  }

  // Project images (4)
  for (let i = 1; i <= 4; i++) {
    assets.push({
      relativePath: `projects/project-image-${i}.png`,
      bytesBase64: tinyPngBase64,
    })
  }

  // Offer banners (8)
  for (let i = 1; i <= 8; i++) {
    assets.push({
      relativePath: `offers/offer-banner-${i}.png`,
      bytesBase64: tinyPngBase64,
    })
  }

  return assets
}

