import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Activity, BarChart3, LayoutDashboard, ShoppingCart, Users, ThermometerSun } from 'lucide-react';
import './index.css';

// --- MOCK DATA ---
const curvaAperturaData = [
  { dia: 'Día 1', esperado: 5, real: 6 },
  { dia: 'Día 2', esperado: 12, real: 15 },
  { dia: 'Día 3', esperado: 22, real: 23 },
  { dia: 'Día 4', esperado: 35, real: 34 },
  { dia: 'Día 5', esperado: 50, real: 48 },
];


function Dashboard() {
  const [kpis, setKpis] = useState({ produccionSemanal: 12400, calidadGramos: 402, otif: 96.2, backlog: 8400 });

  useEffect(() => {
    fetch('/api/kpis')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setKpis(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Gypsophila BI</h2>
        <div className="nav-item active"><LayoutDashboard size={20} /> Resumen S&OP</div>
        <div className="nav-item"><ThermometerSun size={20} /> Apertura y Frío</div>
        <div className="nav-item"><ShoppingCart size={20} /> Pedidos y ATP</div>
        <div className="nav-item">
          <Link to="/history" style={{color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <Activity size={20} /> Histórico y Sincronizaciones
          </Link>
        </div>
        <div className="nav-item">
          <Link to="/quote" style={{color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <Users size={20} /> Registrar Cotización
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1>Torre de Control - Polar Bear</h1>
          <button className="btn-primary" style={{width: 'auto', padding: '10px 20px'}} onClick={() => window.location.href='/quote'}>
            + Nueva Reserva
          </button>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title"><span>Producción Semanal</span> <Activity size={16} /></div>
            <div className="kpi-value">{kpis.produccionSemanal.toLocaleString()} kg</div>
            <div className="kpi-trend positive">▲ 4% vs proyectado (p50)</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title"><span>Calidad (Gramos / Bonche)</span> <BarChart3 size={16} /></div>
            <div className="kpi-value">{kpis.calidadGramos} g</div>
            <div className="kpi-trend negative">▼ Nominal es 400g (Sobrepeso 0.5%)</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title"><span>OTIF (Cumplimiento)</span> <ShoppingCart size={16} /></div>
            <div className="kpi-value">{kpis.otif}%</div>
            <div className="kpi-trend positive">▲ 1.2% vs mes anterior</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title"><span>Backlog</span> <Users size={16} /></div>
            <div className="kpi-value">{kpis.backlog.toLocaleString()} kg</div>
            <div className="kpi-trend">Pendientes de despacho</div>
          </div>
        </div>

        <div className="charts-grid">
          {/* Chart 1: Cobertura Semanal */}
          <div className="chart-card">
            <div className="chart-title">Cobertura Semanal (Oferta vs Demanda)</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[
                { semana: 'W40', oferta: 14000, demanda: 13500 },
                { semana: 'W41', oferta: 15200, demanda: 15000 },
                { semana: 'W42', oferta: kpis.produccionSemanal, demanda: 11900 },
                { semana: 'W43', oferta: 11200, demanda: 12000 },
                { semana: 'W44', oferta: 15000, demanda: 13000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="semana" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Legend />
                <Bar dataKey="oferta" fill="#3b82f6" name="Oferta Proyectada (kg)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="demanda" stroke="#ef4444" strokeWidth={3} name="Demanda Comprometida" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Curva de Apertura */}
          <div className="chart-card">
            <div className="chart-title">Curva de Apertura (% Lote GP-0912)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={curvaAperturaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="dia" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Legend />
                <Line type="monotone" dataKey="esperado" stroke="#94a3b8" strokeDasharray="5 5" name="Corredor Esperado" />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} name="% Real Abierto" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ cliente: '', semana: '', kilos: '', precio: '' });

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      window.Telegram.WebApp.sendData(JSON.stringify({ action: 'create_quote', data: formData }));
    } else {
      alert('Cotización registrada (Modo Desarrollo): ' + JSON.stringify(formData));
      navigate('/');
    }
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem'}}>
      <div className="telegram-form kpi-card" style={{width: '100%'}}>
        <h2 className="chart-title">Nueva Cotización</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cliente</label>
            <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Semana de Despacho</label>
            <input type="number" name="semana" value={formData.semana} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Volumen (Kg)</label>
            <input type="number" name="kilos" value={formData.kilos} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Precio Objetivo (USD/kg)</label>
            <input type="number" name="precio" value={formData.precio} onChange={handleChange} step="0.01" required />
          </div>
          <button type="submit" className="btn-primary">Registrar Reserva</button>
          <button type="button" onClick={() => navigate('/')} style={{width: '100%', padding: '14px', marginTop: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', cursor: 'pointer'}}>Cancelar</button>
        </form>
      </div>
    </div>
  );
}

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(console.error);
  }, []);

  // Formatear datos para el gráfico
  const chartData = history.map(item => ({
    fecha: new Date(item.timestamp).toLocaleString(),
    produccion: item.kpis.produccionSemanal
  }));

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Gypsophila BI</h2>
        <div className="nav-item">
          <Link to="/" style={{color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <LayoutDashboard size={20} /> Resumen S&OP
          </Link>
        </div>
        <div className="nav-item active">
          <Activity size={20} /> Histórico y Sincronizaciones
        </div>
        <div className="nav-item">
          <Link to="/quote" style={{color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <Users size={20} /> Registrar Cotización
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1>Registro Histórico y Sincronizaciones</h1>
        </div>

        <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
          {/* Chart: Histórico de Producción */}
          <div className="chart-card">
            <div className="chart-title">Evolución de Producción Sincronizada</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fecha" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Legend />
                <Line type="monotone" dataKey="produccion" stroke="#3b82f6" strokeWidth={3} name="Producción (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Sincronizaciones */}
        <div className="kpi-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
          <div className="kpi-card" style={{ width: '100%', overflowX: 'auto' }}>
            <h2 className="chart-title" style={{ marginBottom: '15px' }}>Bitácora de Sincronizaciones (Extracción Genesis)</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px' }}>Fecha y Hora</th>
                  <th style={{ padding: '10px' }}>Producción (kg)</th>
                  <th style={{ padding: '10px' }}>OTIF (%)</th>
                  <th style={{ padding: '10px' }}>Backlog (kg)</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px' }}>{new Date(item.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '10px', color: '#10b981' }}>{item.kpis.produccionSemanal.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{item.kpis.otif}%</td>
                    <td style={{ padding: '10px' }}>{item.kpis.backlog.toLocaleString()}</td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>No hay sincronizaciones registradas todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quote" element={<QuoteForm />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
