const fs = require('fs');
let content = fs.readFileSync('bot.js', 'utf8');

content = content.replace(
  "bot.command('hoy', (ctx) => {",
  "const path = require('path');\nbot.command('hoy', (ctx) => {\n  let prod = 1840;\n  try { const silver = JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8')); prod = silver.produccionSemanal; } catch(e){}"
);

content = content.replace(
  "Producción: 1,840 kg exportables (▲ 4% vs plan)",
  "Producción: ${prod} kg exportables (▲ 4% vs plan)"
);

content = content.replace(
  "ctx.reply(`📊 *CIERRE DEL DÍA",
  "ctx.reply(`📊 *CIERRE DEL DÍA"
); // It's already using backticks, so `${prod}` will just work!

fs.writeFileSync('bot.js', content);
