const fs = require('fs');

let content = fs.readFileSync('bot.js', 'utf8');

const openaiImport = "const { Telegraf, Markup } = require('telegraf');\nconst OpenAI = require('openai');\n";
content = content.replace("const { Telegraf, Markup } = require('telegraf');", openaiImport);

const openaiInit = "const app = express();\n\nconst openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });\n";
content = content.replace("const app = express();", openaiInit);

const messageHandler = `bot.on('message', async (ctx) => {
    if (ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            if (data.action === 'create_quote') {
                const { cliente, semana, kilos, precio } = data.data;
                ctx.reply(\`📝 *COTIZACIÓN REGISTRADA*\\n\\n👤 Cliente: \${cliente}\\n📅 Semana: \${semana}\\n⚖️ Volumen: \${kilos} kg\\n💵 Precio: $\${precio}/kg\\n\\n_Esta reserva tentativa ha ajustado el ATP automáticamente._\`, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            ctx.reply('Error procesando la cotización de la Mini App.');
        }
    } else if (ctx.message.text && !ctx.message.text.startsWith('/')) {
        try {
            const path = require('path');
            let silverData = {};
            try {
               silverData = JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8'));
            } catch(e) {}
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Eres un asistente experto de la plantación Gypsophila Polar Bear. Ayudas al equipo directivo y comercial dando respuestas naturales. Cuentas con esta información en tiempo real de la producción: " + JSON.stringify(silverData) },
                    { role: "user", content: ctx.message.text }
                ]
            });
            ctx.reply(response.choices[0].message.content);
        } catch (err) {
            console.error("OpenAI Error:", err);
            ctx.reply('Lo siento, tuve un problema procesando tu mensaje.');
        }
    }
});`;

content = content.replace(/bot\.on\('message'[\s\S]*?\}\);\n/m, messageHandler + '\n');

fs.writeFileSync('bot.js', content);
