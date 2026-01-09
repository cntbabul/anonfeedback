import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
    console.error("No API key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Checking models... (Using key prefix: ${apiKey.substring(0, 5)})`);

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("API Error:", data.error);
        } else {
            console.log("Available Models:");
            if (data.models) {
                data.models.forEach(m => {
                    console.log(m.name);
                });
            } else {
                console.log("No models found in response.");
                console.log(JSON.stringify(data, null, 2));
            }
        }
    })
    .catch(err => console.error("Fetch Error:", err));
