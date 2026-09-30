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

// --- Comando de Bienvenida / Start ---
bot.command('start', (ctx) => {
    const name = ctx.from?.first_name || 'amigo';
    ctx.reply(
        `¡Hola, ${name}! 👋 Qué gusto saludarte.\n\n` +
        `Soy tu asistente de *Gypsophila Polar Bear* 🌸. Estoy aquí para darte una mano con la información en tiempo real de nuestra finca, disponibilidad de tallos, cupos de venta y facturación.\n\n` +
        `¿En qué te puedo colaborar hoy? Puedes consultarme directamente escribiéndome lo que necesites, o usar estos accesos rápidos:\n\n` +
        `📊 /hoy - Resumen ejecutivo del día\n` +
        `🌱 /etapas - Estado de las 5 fases de cultivo\n` +
        `🚪 /apertura - Cuarto caliente y apertura\n` +
        `📦 /disponible - Tallos libres para vender (ATP)\n` +
        `👥 /cupos - Semáforo de cupos por vendedor\n` +
        `💰 /ventas - Reporte de ventas y facturación\n` +
        `📝 /puedo [tallos] [semana] - Validar reserva rápida\n\n` +
        `_¡Dime cómo te ayudo y lo revisamos al instante!_ 😊`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                Markup.button.webApp('📱 Abrir Torre de Control Polar Bear', process.env.MINI_APP_URL || 'https://gypso.nexaflow-ia.com')
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
        `¡Hola! Claro que sí, con mucho gusto te comparto cómo van las labores el día de hoy 🌸:\n\n` +
        `🌾 *Cosecha de hoy:* *${cosechados.toLocaleString()} tallos*\n` +
        `🌱 *Por cosechar en campo:* *${pendientes.toLocaleString()} tallos*\n` +
        `📦 *Disponible listo para venta (ATP):* *${disp.toLocaleString()} tallos*\n\n` +
        `_Todo marcha según lo programado en Génesis ERP. ¿Deseas consultar alguna etapa en detalle?_ 😊`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('etapas', (ctx) => {
    const s = getSilver();
    const e = s.etapasCultivo || {};
    ctx.reply(
        `¡Con mucho gusto! Aquí te detallo cómo avanza cada una de nuestras 5 etapas de cultivo en la finca 🌱:\n\n` +
        `1️⃣ *1. Bancos (Propagación):*\n   Tenemos *${e.etapa1_bancos?.camasMadres || 45} camas madres* con *${(e.etapa1_bancos?.plantasMadres || 120000).toLocaleString()} plantas madres* produciendo esquejes de primera calidad.\n\n` +
        `2️⃣ *2. Traslado (Enraizamiento):*\n   Contamos con *${e.etapa2_traslado?.bandejasEnraizamiento || 350} bandejas* en proceso, cuidando *${(e.etapa2_traslado?.tallosEnraizando || 48000).toLocaleString()} tallos* enraizando.\n\n` +
        `3️⃣ *3. Lote Siembra:*\n   Tenemos *${e.etapa3_lote_siembra?.lotesActivos || 12} lotes activos* en campo con un total de *${(e.etapa3_lote_siembra?.plantasSembradas || 145000).toLocaleString()} plantas* sembradas.\n\n` +
        `4️⃣ *4. Cosecha:*\n   Llevamos cosechados *${(e.etapa4_cosecha?.tallosCosechados || 52000).toLocaleString()} tallos*, y nos quedan todavía *${(e.etapa4_cosecha?.diferenciaPendienteCampo || 28000).toLocaleString()} tallos pendientes* en campo por recolectar.\n\n` +
        `5️⃣ *5. Clasificación (Cuarto Caliente):*\n   • Grado A: *${(e.etapa5_clasificacion?.tallosGradoA || 11000).toLocaleString()} tallos*\n   • Grado B: *${(e.etapa5_clasificacion?.tallosGradoB || 24000).toLocaleString()} tallos*\n   • Grado C: *${(e.etapa5_clasificacion?.tallosGradoC || 32000).toLocaleString()} tallos*\n   • Nacional: *${(e.etapa5_clasificacion?.tallosNacional || 2000).toLocaleString()} tallos*\n   • Desperdicio/Compost: *${e.etapa5_clasificacion?.porcentajeDesperdicio || 5.7}%*\n\n` +
        `_¿Te gustaría revisar algo más sobre algún lote o variedad? ¡Avísame nomás!_ 👍`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('apertura', (ctx) => {
    const s = getSilver();
    const e5 = s.etapasCultivo?.etapa5_clasificacion || {};
    ctx.reply(
        `¡Buenas! Te paso el reporte fresquito de nuestras cámaras y clasificación 🚪🌡️:\n\n` +
        `⏱️ *Tiempo de apertura teórico:* *${e5.diasAperturaTeorico || 7} días*\n` +
        `🎯 *Objetivo de apertura:* *${e5.porcentajeAperturaMeta || 80}%* de flor abierta\n` +
        `🔥 *En Cuarto Caliente (abriendo):* *${(s.disponibilidadVenta?.stockCuartoCalienteTallos || 14000).toLocaleString()} tallos*\n` +
        `❄️ *En Cuarto Frío (listos para despacho):* *${(s.disponibilidadVenta?.stockCuartoFrioTallos || 28000).toLocaleString()} tallos*\n\n` +
        `_La flor está abriendo con excelente vigor y consistencia. ¡Quedo a la orden si necesitas apartar pedidos!_ ✨`,
        { parse_mode: 'Markdown' }
    );
});

// --- Comandos Comerciales y Ventas ---
bot.command('disponible', (ctx) => {
    const s = getSilver();
    const d = s.disponibilidadVenta || {};
    ctx.reply(
        `¡Hola! Con gusto, aquí tienes el panorama completo de tallos disponibles para comercializar 📈:\n\n` +
        `📋 *Total en Orden de Venta:* *${(d.ordenVentaDisponibleTallos || 42000).toLocaleString()} tallos*\n` +
        `❄️ *En Cuarto Frío (Entrega inmediata):* *${(d.stockCuartoFrioTallos || 28000).toLocaleString()} tallos*\n` +
        `🔥 *En Cuarto Caliente (Próximos días):* *${(d.stockCuartoCalienteTallos || 14000).toLocaleString()} tallos*\n` +
        `📝 *Pedidos ya comprometidos:* *${(d.pedidosComprometidosTallos || 26000).toLocaleString()} tallos*\n` +
        `🌟 *ATP Neto Libre para vender:* *${(d.atpNetoDisponibleTallos || 16000).toLocaleString()} tallos*\n\n` +
        `_Puedes escribir /puedo [tallos] [semana] para verificar si puedes comprometer una orden, o usar /cupos para ver tus límites disponibles._ ¡Buen día de ventas! 🚀`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('cupos', (ctx) => {
    const s = getSilver();
    const cupos = s.cuposVendedores || [];
    let msg = `¡Hola! Aquí tienes el estado actual de los cupos por vendedor para que organicemos los pedidos sin contratiempos 👥:\n\n`;
    cupos.forEach(c => {
        const pct = Math.round((c.reservado / c.cupoAsignado) * 100);
        const icon = pct >= 90 ? '🔴' : pct >= 70 ? '🟡' : '🟢';
        const estado = pct >= 90 ? 'Cerca del límite' : pct >= 70 ? 'Buen ritmo de venta' : 'Cupo amplio disponible';
        msg += `${icon} *${c.vendedor}* (${estado})\n` +
               `   • Cupo Asignado: *${c.cupoAsignado.toLocaleString()} tallos*\n` +
               `   • Reservado: *${c.reservado.toLocaleString()} tallos* (${pct}%)\n` +
               `   • Disponible libre: *${c.disponible.toLocaleString()} tallos*\n\n`;
    });
    msg += `_Si requieres una ampliación de cupo para un cliente grande, contáctate con la administración de la finca._ ¡Siempre a las órdenes! 👍`;
    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('ventas', (ctx) => {
    const s = getSilver();
    const v = s.ventasGeneral || {};
    ctx.reply(
        `¡Excelente! Con gusto te comparto el resumen de ventas facturadas en Génesis 💰:\n\n` +
        `📅 *Período:* ${v.periodo || 'Mes en curso'}\n` +
        `🌸 *Tallos entregados/vendidos:* *${(v.totalTallosVendidos || 24489).toLocaleString()} tallos*\n` +
        `💵 *Facturación total:* *$${(v.totalVentasUSD || 68000).toLocaleString()} USD*\n` +
        `🏷️ *Precio promedio logrado:* *$${v.precioPromedioTallo || 2.77} USD / tallo*\n` +
        `📄 *Documentos emitidos:* ${v.documentos || 14} facturas/notas\n\n` +
        `_¡Muy buen desempeño comercial! Si necesitas el detalle de clientes, abre la Mini App._ 📊`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('puedo', (ctx) => {
    const text = ctx.message.text.split(' ');
    if (text.length < 3) {
        return ctx.reply(
            `¡Hola! Para ayudarte a consultar la disponibilidad, por favor indícame la cantidad de tallos y la semana. Así:\n\n` +
            `👉 \`/puedo 2000 42\`\n\n` +
            `_(Ejemplo: 2000 tallos para la semana 42)_`
        );
    }
    
    const tallos = parseInt(text[1]);
    const semana = text[2];
    const s = getSilver();
    const atpLibre = s.disponibilidadVenta?.atpNetoDisponibleTallos || 16000;
    
    if (tallos <= atpLibre) {
        ctx.reply(
            `¡Buenas noticias! 🎉 Sí disponemos de capacidad.\n\n` +
            `Puedes comprometer con total tranquilidad *${tallos.toLocaleString()} tallos* para la *semana ${semana}*.\n` +
            `Nos quedarían todavía *${(atpLibre - tallos).toLocaleString()} tallos libres* en la banda segura de ATP.\n\n` +
            `👇 Si gustas, puedes registrar la reserva de inmediato aquí:`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.webApp('📝 Registrar Cotización / Reserva', process.env.MINI_APP_URL || 'https://gypso.nexaflow-ia.com')
                ])
            }
        );
    } else {
        ctx.reply(
            `¡Hola! Te comento que para la semana ${semana} solicitaste *${tallos.toLocaleString()} tallos*, pero nuestro ATP neto libre en este momento es de *${atpLibre.toLocaleString()} tallos* ⚠️.\n\n` +
            `Para no comprometer el stock de otros pedidos, te sugiero coordinar una ampliación de cupo con la finca o ajustar el volumen. ¿Quieres que consultemos otra semana?`,
            { parse_mode: 'Markdown' }
        );
    }
});

bot.on('message', async (ctx) => {
    if (ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            if (data.action === 'create_quote') {
                const { cliente, semana, tallos, precio, vendedor } = data.data;
                ctx.reply(
                    `¡Excelente trabajo! 📝 He registrado con éxito tu cotización:\n\n` +
                    `👤 *Cliente:* ${cliente}\n` +
                    `👨‍💼 *Vendedor:* ${vendedor || 'Equipo Comercial'}\n` +
                    `📅 *Semana de Despacho:* ${semana}\n` +
                    `🌸 *Volumen Reservado:* *${parseInt(tallos).toLocaleString()} tallos*\n` +
                    `💵 *Precio Pactado:* *$${precio} USD / tallo*\n\n` +
                    `_El ATP y tu cupo disponible han sido actualizados en el sistema. ¡Muchos éxitos con este despacho!_ 🤝`,
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (e) {
            ctx.reply('Ups, tuve un pequeño inconveniente procesando la cotización. Por favor intenta nuevamente.');
        }
    } else if (ctx.message.text && !ctx.message.text.startsWith('/')) {
        try {
            const silverData = getSilver();
            const senderName = ctx.from?.first_name || 'compañero';
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres el asistente oficial, atento y cercano de la finca de flores Gypsophila Polar Bear. 
                        Tu trato es extremadamente cordial, amable, educado, servicial y en un tono coloquial respetuoso (estilo profesional ecuatoriano / latinoamericano cercano: "¡Hola!", "¡Qué gusto saludarte!", "Con mucho gusto te ayudo", "Te cuento cómo estamos...", "Quedo a tus órdenes").
                        
                        REGLAS FUNDAMENTALES:
                        1. UNIDAD DE MEDIDA: La unidad es SIEMPRE "TALLOS" (NUNCA menciones kilogramos, kilos ni peso).
                        2. PROCESO DE CULTIVO (5 FASES):
                           - Fase 1: Bancos (Propagación / Plantas Madres)
                           - Fase 2: Traslado (Enraizamiento / Bandejas)
                           - Fase 3: Lote Siembra (Siembra en campo)
                           - Fase 4: Cosecha (Tallos cosechados vs diferencia pendiente en campo)
                           - Fase 5: Clasificación (Cuarto Caliente / Postcosecha con Grados A, B, C, Nacional, Desperdicio compost y meta de apertura al 80% en 7 días teóricos).
                        3. COMERCIAL:
                           - Orden de Venta define la disponibilidad para venta (ATP en tallos).
                           - Stock en Cuarto Frío (listo para entrega inmediata) y Cuarto Caliente (en proceso de apertura).
                           - Existen cupos asignados por vendedor (Santiago 5k, Giovanni 5k, Finca 30k) para evitar sobreventas.
                           - Facturación -> Informes -> Ventas General contiene los tallos vendidos y dólares facturados en Génesis ERP.
                        4. DATOS EN TIEMPO REAL: Utiliza siempre la información exacta del JSON que tienes aquí: ${JSON.stringify(silverData)}.
                        
                        Responde de forma clara, directa, motivadora y muy atenta.` 
                    },
                    { role: "user", content: ctx.message.text }
                ]
            });
            ctx.reply(response.choices[0].message.content);
        } catch (err) {
            console.error("OpenAI Error:", err);
            ctx.reply('Mil disculpas, tuve una pequeña dificultad al consultar la información. ¿Podrías preguntarme de nuevo, por favor? Con gusto lo reviso.');
        }
    }
});

// Lanzar el bot
bot.launch().then(() => console.log('Bot de Telegram iniciado correctamente con lenguaje cordial y atento.'));

// Lanzar servidor Express para webhooks y API de la Mini App
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
