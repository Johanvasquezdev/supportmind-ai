const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Keys of pdf:', Object.keys(pdf || {}));
if (pdf.PDFParse) {
  console.log('Type of pdf.PDFParse:', typeof pdf.PDFParse);
  try {
    const p = new pdf.PDFParse({ data: Buffer.from([]) });
    console.log('Testing getText()...');
    p.getText().then(res => {
      console.log('getText() result keys:', Object.keys(res || {}));
      console.log('getText() result text type:', typeof res.text);
    }).catch(e => {
      console.log('getText() failed (expected on empty buffer):', e.message);
    });
  } catch (e) {
    console.log('PDFParse test failed:', e.message);
  }
}
