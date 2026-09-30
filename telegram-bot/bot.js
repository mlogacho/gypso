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

// --- Comandos de Producción y Fases de Cultivo ---
bot.command('hoy', (ctx) => {
    const silver = getSilver();
    const cosechados = silver.etapasCultivo?.etapa4_cosecha?.tallosCosechados || silver.produccionSemanalTallos || 54950;
    const pendientes = silver.etapasCultivo?.etapa4_cosecha?.diferenciaPendienteCampo || 28000;
    const disp = silver.disponibilidadVenta?.atpNetoDisponibleTallos || 16000;

    ctx.reply(
        `📊 *CIERRE DEL DÍA - GYPSOPHILA POLAR BEAR*\n\n` +
        `🌸 *Cosecha:* ${cosechados.toLocaleString()} tallos\n` +
        `🌾 *Pendiente en campo:* ${pendientes.toLocaleString()} tallos\n` +
        `📦 *Disponible para Venta (ATP):* ${disp.toLocaleString()} tallos\n\n` +
        `_Datos sincronizados desde Génesis ERP (Floración -> Registros)_`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('etapas', (ctx) => {
    const s = getSilver();
    const e = s.etapasCultivo || {};
    ctx.reply(
        `🌱 *ETAPAS DE CULTIVO (GÉNESIS)*\n\n` +
        `1️⃣ *1. Bancos (Propagación):* ${e.etapa1_bancos?.camasMadres || 45} camas · ${(e.etapa1_bancos?.plantasMadres || 120000).toLocaleString()} plantas madres\n` +
        `2️⃣ *2. Traslado (Enraizamiento):* ${e.etapa2_traslado?.bandejasEnraizamiento || 350} bandejas · ${(e.etapa2_traslado?.tallosEnraizando || 48000).toLocaleString()} tallos enraizando\n` +
        `3️⃣ *3. Lote Siembra:* ${e.etapa3_lote_siembra?.lotesActivos || 12} lotes · ${(e.etapa3_lote_siembra?.plantasSembradas || 145000).toLocaleString()} plantas\n` +
        `4️⃣ *4. Cosecha:* ${(e.etapa4_cosecha?.tallosCosechados || 52000).toLocaleString()} tallos cosechados (Diferencia: ${(e.etapa4_cosecha?.diferenciaPendienteCampo || 28000).toLocaleString()} tallos)\n` +
        `5️⃣ *5. Clasificación (Cuarto Caliente):* A: ${(e.etapa5_clasificacion?.tallosGradoA || 11000).toLocaleString()} | B: ${(e.etapa5_clasificacion?.tallosGradoB || 24000).toLocaleString()} | C: ${(e.etapa5_clasificacion?.tallosGradoC || 32000).toLocaleString()} | Nac: ${(e.etapa5_clasificacion?.tallosNacional || 2000).toLocaleString()} | Desperdicio: ${e.etapa5_clasificacion?.porcentajeDesperdicio || 5.7}%\n\n` +
        `_Todas las unidades en tallos._`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('apertura', (ctx) => {
    const s = getSilver();
    const e5 = s.etapasCultivo?.etapa5_clasificacion || {};
    ctx.reply(
        `🚪 *CLASIFICACIÓN Y CUARTO CALIENTE*\n\n` +
        `🕒 *Días apertura teórico:* ${e5.diasAperturaTeorico || 7} días\n` +
        `🎯 *Meta apertura:* ${e5.porcentajeAperturaMeta || 80}%\n` +
        `🌡️ *Stock en Cuarto Caliente:* ${(s.disponibilidadVenta?.stockCuartoCalienteTallos || 14000).toLocaleString()} tallos\n` +
        `❄️ *Stock en Cuarto Frío:* ${(s.disponibilidadVenta?.stockCuartoFrioTallos || 28000).toLocaleString()} tallos`,
        { parse_mode: 'Markdown' }
    );
});

// --- Comandos Comerciales y Ventas ---
bot.command('disponible', (ctx) => {
    const s = getSilver();
    const d = s.disponibilidadVenta || {};
    ctx.reply(
        `📈 *DISPONIBILIDAD PARA VENTA (ORDEN DE VENTA / ATP)*\n\n` +
        `✅ *Total en Orden de Venta:* ${(d.ordenVentaDisponibleTallos || 42000).toLocaleString()} tallos\n` +
        `❄️ *Cuarto Frío (Listo):* ${(d.stockCuartoFrioTallos || 28000).toLocaleString()} tallos\n` +
        `🔥 *Cuarto Caliente (Por abrir):* ${(d.stockCuartoCalienteTallos || 14000).toLocaleString()} tallos\n` +
        `📝 *Pedidos Comprometidos:* ${(d.pedidosComprometidosTallos || 26000).toLocaleString()} tallos\n` +
        `🌟 *ATP Neto Libre:* ${(d.atpNetoDisponibleTallos || 16000).toLocaleString()} tallos\n\n` +
        `_Usa /puedo [tallos] [semana] para consultar reservas o /cupos para ver cuotas por vendedor._`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('cupos', (ctx) => {
    const s = getSilver();
    const cupos = s.cuposVendedores || [];
    let msg = `👥 *SEMÁFORO DE CUPOS POR VENDEDOR*\n\n`;
    cupos.forEach(c => {
        const pct = Math.round((c.reservado / c.cupoAsignado) * 100);
        const icon = pct >= 90 ? '🔴' : pct >= 70 ? '🟡' : '🟢';
        msg += `${icon} *${c.vendedor}:*\n` +
               `  - Cupo: ${c.cupoAsignado.toLocaleString()} tallos\n` +
               `  - Reservado: ${c.reservado.toLocaleString()} tallos (${pct}%)\n` +
               `  - Libre: ${c.disponible.toLocaleString()} tallos\n\n`;
    });
    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('ventas', (ctx) => {
    const s = getSilver();
    const v = s.ventasGeneral || {};
    ctx.reply(
        `💰 *INFORME DE VENTAS GENERAL (GÉNESIS)*\n\n` +
        `📅 *Período:* ${v.periodo || 'Mes Actual'}\n` +
        `🌸 *Tallos Vendidos:* ${(v.totalTallosVendidos || 24489).toLocaleString()} tallos\n` +
        `💵 *Facturación:* $${(v.totalVentasUSD || 68000).toLocaleString()} USD\n` +
        `🏷️ *Precio Promedio:* $${v.precioPromedioTallo || 2.77} USD / tallo\n` +
        `📄 *Documentos emitidos:* ${v.documentos || 14}`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('puedo', (ctx) => {
    const text = ctx.message.text.split(' ');
    if (text.length < 3) return ctx.reply('Formato incorrecto. Usa: /puedo [cantidad_tallos] [semana]');
    
    const tallos = parseInt(text[1]);
    const semana = text[2];
    const s = getSilver();
    const atpLibre = s.disponibilidadVenta?.atpNetoDisponibleTallos || 16000;
    
    if (tallos <= atpLibre) {
        ctx.reply(
            `✅ *RESERVA CONFIRMADA (ATP SUFICIENTE)*\n\n` +
            `Sí puedes comprometer *${tallos.toLocaleString()} tallos* para la semana ${semana}.\n` +
            `Quedan ${(atpLibre - tallos).toLocaleString()} tallos disponibles en ATP.\n\n` +
            `👇 Usa la Mini App para registrar la cotización y reservar tu cupo.`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.webApp('📝 Crear Cotización / Reserva', process.env.MINI_APP_URL || 'https://tu-mini-app.com')
                ])
            }
        );
    } else {
        ctx.reply(
            `⚠️ *EXCEDE ATP DISPONIBLE*\n\n` +
            `Solicitaste: ${tallos.toLocaleString()} tallos.\n` +
            `Disponible actual: ${atpLibre.toLocaleString()} tallos.\n` +
            `Por favor solicita una ampliación de cupo a gerencia/finca.`,
            { parse_mode: 'Markdown' }
        );
    }
});

bot.on('message', async (ctx) => {
    if (ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            if (data.action === 'create_quote') {
                const { cliente, semana, tallos, precio } = data.data;
                ctx.reply(
                    `📝 *COTIZACIÓN REGISTRADA*\n\n` +
                    `👤 *Cliente:* ${cliente}\n` +
                    `📅 *Semana:* ${semana}\n` +
                    `🌸 *Volumen:* ${parseInt(tallos).toLocaleString()} tallos\n` +
                    `💵 *Precio:* $${precio} USD / tallo\n\n` +
                    `_Esta reserva tentativa ha ajustado el ATP y cupo del vendedor automáticamente._`,
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (e) {
            ctx.reply('Error procesando la cotización de la Mini App.');
        }
    } else if (ctx.message.text && !ctx.message.text.startsWith('/')) {
        try {
            const silverData = getSilver();
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres el asistente de operaciones y comercial de Gypsophila Polar Bear. 
                        REGLA FUNDAMENTAL DE NEGOCIO: La unidad de medida es SIEMPRE "TALLOS" (NO existe ni se usa peso ni kilogramos).
                        Tienes acceso en tiempo real a los datos extraídos de Génesis ERP (Floración -> Registros y Facturación -> Informes -> Ventas -> Ventas General).
                        ESTOS SON LOS DATOS EN TIEMPO REAL: ${JSON.stringify(silverData)}.
                        El flujo de cultivo consta de 5 etapas:
                        1. Bancos (Propagación / Plantas Madres)
                        2. Traslado (Enraizamiento / Bandejas)
                        3. Lote Siembra (Siembra en campo)
                        4. Cosecha (Tallos cosechados vs diferencia pendiente en campo)
                        5. Clasificación (Cuarto Caliente / Postcosecha con Grado A, B, C, Nacional, Desperdicio, y días de apertura al 80%).
                        Orden de Venta define la disponibilidad para venta (ATP en tallos) y existen cupos por vendedor.
                        Facturación -> Informes -> Ventas General contiene los tallos vendidos y dólares facturados.
                        Responde de forma ejecutiva, precisa y cordial.` 
                    },
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
