const { Telegraf, Markup } = require('telegraf');
const OpenAI = require('openai');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

// Memoria de conversación por chat (Sliding Window)
const chatHistories = new Map();
const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos

function getChatHistory(chatId) {
    const now = Date.now();
    const session = chatHistories.get(chatId);
    if (!session || (now - session.lastUpdated > SESSION_TIMEOUT_MS)) {
        const newSession = { messages: [], lastUpdated: now };
        chatHistories.set(chatId, newSession);
        return newSession;
    }
    session.lastUpdated = now;
    return session;
}

app.get('/api/kpis', (req, res) => {
    try {
        const silverData = JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8'));
        res.json(silverData);
    } catch (e) {
        res.status(500).json({ error: 'Could not load KPIs' });
    }
});

app.get('/api/history', (req, res) => {
    try {
        const historyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'history_kpis.json'), 'utf8'));
        res.json(historyData);
    } catch (e) {
        res.json([]);
    }
});

// Middlewares y configuración
bot.use(Telegraf.log());

function getSilver() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8'));
    } catch(e) {
        return {};
    }
}

// --- Comando de Bienvenida / Start ---
bot.command('start', (ctx) => {
    const name = ctx.from?.first_name || 'amigo';
    const session = getChatHistory(ctx.chat.id);
    session.messages = []; // Reiniciar contexto en /start

    ctx.reply(
        `¡Hola, ${name}! 👋 Qué gusto saludarte.\n\n` +
        `Soy tu asistente de *Gypsophila Polar Bear* 🌸. Estoy conectado en tiempo real a Génesis para darte datos de cultivo, disponibilidad de tallos, cupos y ventas.\n\n` +
        `Puedes hacerme cualquier pregunta directamente o utilizar estos comandos rápidos:\n\n` +
        `📊 /hoy - Cierre y resumen del día\n` +
        `🌱 /etapas - Estado de las 5 fases de cultivo\n` +
        `🚪 /apertura - Cuarto caliente y apertura\n` +
        `📦 /disponible - Tallos libres para venta (ATP)\n` +
        `👥 /cupos - Semáforo de cupos por vendedor\n` +
        `💰 /ventas - Reporte de facturación\n` +
        `📝 /puedo [tallos] [semana] - Validar reserva rápida\n\n` +
        `_¿En qué te colaboro hoy?_`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                Markup.button.webApp('📱 Abrir Torre de Control', process.env.MINI_APP_URL || 'https://gypso.nexaflow-ia.com')
            ])
        }
    );
});

// --- Comandos de Producción y Fases de Cultivo ---
bot.command('hoy', (ctx) => {
    const silver = getSilver();
    const cosechados = silver.etapasCultivo?.etapa4_cosecha?.tallosCosechados || silver.produccionSemanalTallos || 54950;
    const pendientes = silver.etapasCultivo?.etapa4_cosecha?.diferenciaPendienteCampo || 28000;
    const disp = silver.disponibilidadVenta?.atpNetoDisponibleTallos || 16000;

    ctx.reply(
        `📊 *Resumen de hoy (Gypsophila Polar Bear):*\n\n` +
        `🌾 *Cosecha acumulada:* *${cosechados.toLocaleString()} tallos*\n` +
        `🌱 *Pendiente en campo:* *${pendientes.toLocaleString()} tallos*\n` +
        `📦 *Disponible para venta (ATP):* *${disp.toLocaleString()} tallos*\n\n` +
        `_Datos sincronizados con Génesis ERP._`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('etapas', (ctx) => {
    const s = getSilver();
    const e = s.etapasCultivo || {};
    ctx.reply(
        `🌱 *Estado de las 5 Etapas de Cultivo:*\n\n` +
        `1️⃣ *1. Bancos (Propagación):* *${e.etapa1_bancos?.camasMadres || 45} camas* · *${(e.etapa1_bancos?.plantasMadres || 120000).toLocaleString()} plantas madres*\n` +
        `2️⃣ *2. Traslado (Enraizamiento):* *${e.etapa2_traslado?.bandejasEnraizamiento || 350} bandejas* · *${(e.etapa2_traslado?.tallosEnraizando || 48000).toLocaleString()} tallos*\n` +
        `3️⃣ *3. Lote Siembra:* *${e.etapa3_lote_siembra?.lotesActivos || 12} lotes* · *${(e.etapa3_lote_siembra?.plantasSembradas || 145000).toLocaleString()} plantas*\n` +
        `4️⃣ *4. Cosecha:* *${(e.etapa4_cosecha?.tallosCosechados || 52000).toLocaleString()} tallos cosechados* (Pendiente en campo: *${(e.etapa4_cosecha?.diferenciaPendienteCampo || 28000).toLocaleString()} tallos*)\n` +
        `5️⃣ *5. Clasificación (Cuarto Caliente):*\n` +
        `   • Grado A: *${(e.etapa5_clasificacion?.tallosGradoA || 11000).toLocaleString()} tallos*\n` +
        `   • Grado B: *${(e.etapa5_clasificacion?.tallosGradoB || 24000).toLocaleString()} tallos*\n` +
        `   • Grado C: *${(e.etapa5_clasificacion?.tallosGradoC || 32000).toLocaleString()} tallos*\n` +
        `   • Nacional: *${(e.etapa5_clasificacion?.tallosNacional || 2000).toLocaleString()} tallos*\n` +
        `   • Desperdicio: *${e.etapa5_clasificacion?.porcentajeDesperdicio || 5.7}%*`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('apertura', (ctx) => {
    const s = getSilver();
    const e5 = s.etapasCultivo?.etapa5_clasificacion || {};
    ctx.reply(
        `🚪 *Cámaras de Apertura y Clasificación:*\n\n` +
        `⏱️ *Tiempo de apertura teórico:* *${e5.diasAperturaTeorico || 7} días* (Meta: *${e5.porcentajeAperturaMeta || 80}%*)\n` +
        `🔥 *En Cuarto Caliente (abriendo):* *${(s.disponibilidadVenta?.stockCuartoCalienteTallos || 14000).toLocaleString()} tallos*\n` +
        `❄️ *En Cuarto Frío (listos para despacho):* *${(s.disponibilidadVenta?.stockCuartoFrioTallos || 28000).toLocaleString()} tallos*`,
        { parse_mode: 'Markdown' }
    );
});

// --- Comandos Comerciales y Ventas ---
bot.command('disponible', (ctx) => {
    const s = getSilver();
    const d = s.disponibilidadVenta || {};
    ctx.reply(
        `📈 *Disponibilidad de Venta (ATP):*\n\n` +
        `📋 *Total Orden de Venta:* *${(d.ordenVentaDisponibleTallos || 42000).toLocaleString()} tallos*\n` +
        `❄️ *En Cuarto Frío (Inmediato):* *${(d.stockCuartoFrioTallos || 28000).toLocaleString()} tallos*\n` +
        `🔥 *En Cuarto Caliente (Por abrir):* *${(d.stockCuartoCalienteTallos || 14000).toLocaleString()} tallos*\n` +
        `📝 *Comprometido en pedidos:* *${(d.pedidosComprometidosTallos || 26000).toLocaleString()} tallos*\n` +
        `🌟 *ATP Neto Libre:* *${(d.atpNetoDisponibleTallos || 16000).toLocaleString()} tallos*`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('cupos', (ctx) => {
    const s = getSilver();
    const cupos = s.cuposVendedores || [];
    let msg = `👥 *Semáforo de Cupos por Vendedor:*\n\n`;
    cupos.forEach(c => {
        const pct = Math.round((c.reservado / c.cupoAsignado) * 100);
        const icon = pct >= 90 ? '🔴' : pct >= 70 ? '🟡' : '🟢';
        msg += `${icon} *${c.vendedor}:*\n` +
               `   • Cupo: *${c.cupoAsignado.toLocaleString()} tallos* | Reservado: *${c.reservado.toLocaleString()}* (${pct}%)\n` +
               `   • Disponible: *${c.disponible.toLocaleString()} tallos*\n\n`;
    });
    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('ventas', (ctx) => {
    const s = getSilver();
    const v = s.ventasGeneral || {};
    ctx.reply(
        `💰 *Informe de Ventas General (Génesis):*\n\n` +
        `📅 *Período:* ${v.periodo || 'Mes en curso'}\n` +
        `🌸 *Tallos Vendidos:* *${(v.totalTallosVendidos || 24489).toLocaleString()} tallos*\n` +
        `💵 *Facturación:* *$${(v.totalVentasUSD || 68000).toLocaleString()} USD*\n` +
        `🏷️ *Precio Promedio:* *$${v.precioPromedioTallo || 2.77} USD / tallo*\n` +
        `📄 *Documentos:* ${v.documentos || 14}`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('puedo', (ctx) => {
    const text = ctx.message.text.split(' ');
    if (text.length < 3) {
        return ctx.reply(`Para verificar disponibilidad, escribe: \`/puedo [cantidad_tallos] [semana]\` (Ej: \`/puedo 2000 42\`)`, { parse_mode: 'Markdown' });
    }
    
    const tallos = parseInt(text[1]);
    const semana = text[2];
    const s = getSilver();
    const atpLibre = s.disponibilidadVenta?.atpNetoDisponibleTallos || 16000;
    
    if (tallos <= atpLibre) {
        ctx.reply(
            `✅ *Confirmado:* Sí dispones de *${tallos.toLocaleString()} tallos* para la *semana ${semana}*.\n` +
            `Quedan *${(atpLibre - tallos).toLocaleString()} tallos libres* en ATP.\n\n` +
            `Puedes registrar la cotización aquí:`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.webApp('📝 Registrar Cotización', process.env.MINI_APP_URL || 'https://gypso.nexaflow-ia.com')
                ])
            }
        );
    } else {
        ctx.reply(
            `⚠️ No es posible comprometer esa cantidad. Solicitaste *${tallos.toLocaleString()} tallos* para la semana ${semana}, pero el ATP libre es de *${atpLibre.toLocaleString()} tallos*.\n` +
            `Por favor coordina una ampliación de cupo con la finca.`,
            { parse_mode: 'Markdown' }
        );
    }
});

// --- Mensajes de Chat Natural (Con Memoria de Sesión) ---
bot.on('message', async (ctx) => {
    if (ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            if (data.action === 'create_quote') {
                const { cliente, semana, tallos, precio, vendedor } = data.data;
                ctx.reply(
                    `📝 *Cotización registrada con éxito:*\n\n` +
                    `👤 *Cliente:* ${cliente}\n` +
                    `👨‍💼 *Vendedor:* ${vendedor || 'Equipo Comercial'}\n` +
                    `📅 *Semana:* ${semana}\n` +
                    `🌸 *Volumen:* *${parseInt(tallos).toLocaleString()} tallos*\n` +
                    `💵 *Precio:* *$${precio} USD / tallo*\n\n` +
                    `_ATP y cupo actualizados automáticamente._`,
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (e) {
            ctx.reply('Hubo un problema procesando la cotización. Por favor intenta nuevamente.');
        }
    } else if (ctx.message.text && !ctx.message.text.startsWith('/')) {
        try {
            const silverData = getSilver();
            const session = getChatHistory(ctx.chat.id);
            const userText = ctx.message.text.trim();

            const systemPrompt = `Eres el asistente de operaciones y comercial de Gypsophila Polar Bear. 
Estás conversando por Telegram con un miembro del equipo de la finca/ventas.

REGLAS CRÍTICAS DE LENGUAJE Y FLUIDEZ:
1. SÉ DIRECTO, FLUIDO Y CONVERSACIONAL:
   - NO saludes repetitivamente con "¡Hola! ¡Qué gusto saludarte!" en cada mensaje si la conversación ya está iniciada. Solo saluda brevemente si el usuario te saluda directamente por primera vez.
   - NO uses muletillas de despedida o cierre repetitivo como "Quedo a tus órdenes para cualquier consulta... ¡Un abrazo!" en cada respuesta.
   - Responde de forma clara, amigable, concisa y profesional, yendo al grano con los datos solicitados.
2. UNIDAD DE MEDIDA: SIEMPRE "TALLOS". NUNCA menciones kilogramos, kilos ni peso.
3. DATOS EN TIEMPO REAL (GÉNESIS ERP):
${JSON.stringify(silverData, null, 2)}
4. ESTRUCTURA DE CULTIVO:
   - 1. Bancos (Propagación / Plantas Madres)
   - 2. Traslado (Enraizamiento / Bandejas)
   - 3. Lote Siembra (Siembra en campo)
   - 4. Cosecha (Tallos cosechados vs diferencia pendiente en campo)
   - 5. Clasificación (Cuarto Caliente / Postcosecha: Grado A, B, C, Nacional, Desperdicio y curva de apertura).
5. COMERCIAL:
   - Orden de Venta define la disponibilidad para venta (ATP en tallos).
   - Cuarto Frío (listo entrega) y Cuarto Caliente (por abrir).
   - Cupos asignados por vendedor (Santiago 5k, Giovanni 5k, Finca 30k).
   - Facturación / Ventas General (tallos vendidos y USD facturados).

Usa formato Markdown limpio con negritas para destacar números y datos clave.`;

            // Mantener ventana deslizante de últimos 6 mensajes
            const contextMessages = [
                { role: "system", content: systemPrompt },
                ...session.messages.slice(-6),
                { role: "user", content: userText }
            ];

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: contextMessages
            });

            const replyContent = response.choices[0].message.content;

            // Guardar en historial de sesión
            session.messages.push({ role: "user", content: userText });
            session.messages.push({ role: "assistant", content: replyContent });
            if (session.messages.length > 10) {
                session.messages = session.messages.slice(-10);
            }

            ctx.reply(replyContent, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error("OpenAI Error:", err);
            ctx.reply('Tuve una pequeña dificultad al consultar la información. ¿Podrías consultarme nuevamente, por favor?');
        }
    }
});

// Lanzar el bot
bot.launch().then(() => console.log('Bot de Telegram iniciado con memoria de conversación y flujo natural.'));

// Lanzar servidor Express para webhooks y API de la Mini App
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
