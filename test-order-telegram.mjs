const fs = await import("fs");

const env = fs.readFileSync(".env.local","utf8");

for (const line of env.split("\n")) {
  if (line.startsWith("TELEGRAM_BOT_TOKEN=")) {
    process.env.TELEGRAM_BOT_TOKEN=line.split("=").slice(1).join("=").trim();
  }
  if (line.startsWith("TELEGRAM_CHAT_ID=")) {
    process.env.TELEGRAM_CHAT_ID=line.split("=").slice(1).join("=").trim();
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const response = await fetch(
`https://api.telegram.org/bot${token}/sendMessage`,
{
 method:"POST",
 headers:{
  "Content-Type":"application/json"
 },
 body:JSON.stringify({
  chat_id:chatId,
  text:"🛒 GAMORA TEST ORDER\n\nSystem notification is working ✅"
 })
});

console.log(await response.json());
