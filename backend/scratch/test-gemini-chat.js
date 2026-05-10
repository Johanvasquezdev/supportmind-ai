const OpenAI = require('openai');
const client = new OpenAI({
  apiKey: "AIzaSyDVxOWiUyA23rrkHvMaiXuXaWzC39s-PoA",
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

async function main() {
  try {
    const completion = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ],
    });
    console.log('Success:', completion.choices[0].message.content);
  } catch (e) {
    console.log('Error:', e.message);
    if (e.response) {
      console.log('Status:', e.response.status);
      console.log('Data:', e.response.data);
    }
  }
}

main();
