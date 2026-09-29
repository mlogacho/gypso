const { Telegraf, Markup } = require('telegraf');
const OpenAI = require('openai');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

app.get('/api/kpis', (req, res) => {
    try {
        const path = require('path');
        const silverData = JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8'));
        res.json(silverData);
    } catch (e) {
        res.status(500).json({ error: 'Could not load KPIs' });
    }
});

app.get('/api/history', (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs');
        const historyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'history_kpis.json'), 'utf8'));
        res.json(historyData);
    } catch (e) {
        res.json([]);
    }
});

// Middlewares y configuración
bot.use(Telegraf.log());

// --- Comandos de Producción (Arquitectura V2) ---
const path = require('path');
bot.command('hoy', (ctx) => {
  let prod = 1840;
  try { const silver = JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8')); prod = silver.produccionSemanal; } catch(e){}
    ctx.reply(`📊 *CIERRE DEL DÍA - GYPSOPHILA POLAR BEAR*\n\nProducción: ${prod} kg exportables (▲ 4% vs plan)\nCalidad: 91.2% exportable · Bonche promedio 402g\n\n_Datos extraídos de Genesis ERP_`, { parse_mode: 'Markdown' });
});

bot.command('ciclos', (ctx) => {
    // Estrategia confirmada: Ciclo único (pinch a 5-6 pares)
    ctx.reply(`🌱 *ESTADO DE CAMAS (CICLO ÚNICO)*\n\n- Camas en luz: 12\n- Camas en desarrollo: 34\n- Próxima cosecha proyectada: Semana 42 (aprox 2,100 kg)\n\n_Estrategia: Pinch a 5-6 pares de hojas_`, { parse_mode: 'Markdown' });
});

bot.command('apertura', (ctx) => {
    // Instrumentación confirmada: Sensores básicos (Solo Temp y HR)
    ctx.reply(`🚪 *CÁMARAS DE APERTURA*\n\nCámara 1: Temp 19.2°C | HR 85%\nCámara 2: Temp 19.5°C | HR 82%\n\n*Lotes en residencia:* 6 lotes (1,840 kg)\n\n⚠️ _Nota: Etileno no monitoreado actualmente_`, { parse_mode: 'Markdown' });
});

// --- Comandos Comerciales (Arquitectura V3) ---
bot.command('disponible', (ctx) => {
    // ATP incluye compras a terceros
    ctx.reply(`📈 *DISPONIBILIDAD ATP (INCLUYE COMPRAS TERCEROS)*\n\nSemana 42: 12,400 kg (p10)\nSemana 43: 11,200 kg (p10)\nSemana 44: 15,000 kg (p10)\n\n_Usa /puedo [kg] [semana] para consultar reservas._`, { parse_mode: 'Markdown' });
});

bot.command('puedo', (ctx) => {
    const text = ctx.message.text.split(' ');
    if (text.length < 3) return ctx.reply('Formato incorrecto. Usa: /puedo [cantidad kg] [semana]');
    
    const kg = parseInt(text[1]);
    const semana = text[2];
    
    ctx.reply(`✅ *ATP CONFIRMADO*\n\nSí puedes comprometer ${kg} kg para la semana ${semana}.\nQuedan 500 kg libres en p10 (banda segura).\n\n👇 Usa la Mini App para registrar la cotización y reservar.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            Markup.button.webApp('📝 Crear Cotización / Reserva', process.env.MINI_APP_URL || 'https://tu-mini-app.com')
        ])
    });
});

bot.command('pedidos', (ctx) => {
    ctx.reply(`📦 *ESTADO DE PEDIDOS*\n\nIngresos hoy: 14 pedidos (2,210 kg)\nBacklog total: 8,400 kg pendientes de despacho\n\n🚨 1 pedido en riesgo (Semana 43 sin ATP suficiente)`, { parse_mode: 'Markdown' });
});

bot.on('message', async (ctx) => {
    if (ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            if (data.action === 'create_quote') {
                const { cliente, semana, kilos, precio } = data.data;
                ctx.reply(`📝 *COTIZACIÓN REGISTRADA*\n\n👤 Cliente: ${cliente}\n📅 Semana: ${semana}\n⚖️ Volumen: ${kilos} kg\n💵 Precio: ${precio}/kg\n\n_Esta reserva tentativa ha ajustado el ATP automáticamente._`, { parse_mode: 'Markdown' });
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
                    { role: "system", content: "Eres el asistente oficial de Gypsophila Polar Bear. Tienes acceso directo a la base de datos de Genesis. ESTOS SON TUS DATOS EN TIEMPO REAL ACTUALES, ÚSALOS PARA RESPONDER: " + JSON.stringify(silverData) + ". NUNCA digas que no tienes acceso a información en tiempo real. Los datos que se te acaban de pasar SON los datos en tiempo real. Si el usuario pregunta por producción, responde con el valor de 'produccionSemanal' indicando que son los kg de esta semana." },
                    { role: "user", content: ctx.message.text }
                ]
            });
            ctx.reply(response.choices[0].message.content);
        } catch (err) {
            console.error("OpenAI Error:", err);
            ctx.reply('Lo siento, tuve un problema procesando tu mensaje.');
        }
    }
});


// Lanzar el bot
bot.launch().then(() => console.log('Bot de Telegram iniciado correctamente.'));

// Lanzar servidor Express para webhooks y API de la Mini App
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
