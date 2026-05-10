const pdf = require('pdf-parse');
const PDFParse = pdf.PDFParse;
console.log('PDFParse type:', typeof PDFParse);
const parser = new PDFParse({ data: new Uint8Array([0,0,0,0]) });
console.log('Parser methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
