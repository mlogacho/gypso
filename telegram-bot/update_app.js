const fs = require('fs');

// Update bot.js to serve /api/kpis
let botCode = fs.readFileSync('bot.js', 'utf8');
const apiRoute = `
app.get('/api/kpis', (req, res) => {
    try {
        const path = require('path');
        const silverData = JSON.parse(fs.readFileSync(path.join(__dirname, 'silver_kpis.json'), 'utf8'));
        res.json(silverData);
    } catch (e) {
        res.status(500).json({ error: 'Could not load KPIs' });
    }
});
`;
botCode = botCode.replace("app.use(express.json());", "app.use(express.json());\n" + apiRoute);
fs.writeFileSync('bot.js', botCode);

// Update App.jsx to fetch the data
const appPath = 'mini-app-comercial/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// Replace Dashboard function to use state
const newDashboardStart = `function Dashboard() {
  const [kpis, setKpis] = useState({ produccionSemanal: 12400, calidadGramos: 402, otif: 96.2, backlog: 8400 });

  useEffect(() => {
    fetch('http://localhost:3000/api/kpis')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setKpis(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="dashboard-layout">`;

appCode = appCode.replace(/function Dashboard\(\) \{\n  return \(\n    <div className="dashboard-layout">/, newDashboardStart);
appCode = appCode.replace(/12,400 kg/g, "{kpis.produccionSemanal.toLocaleString()} kg");
appCode = appCode.replace(/402 g/g, "{kpis.calidadGramos} g");
appCode = appCode.replace(/96\.2%/g, "{kpis.otif}%");
appCode = appCode.replace(/8,400 kg/g, "{kpis.backlog.toLocaleString()} kg");

fs.writeFileSync(appPath, appCode);
