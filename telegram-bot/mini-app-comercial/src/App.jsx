import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, BarChart3, LayoutDashboard, ShoppingCart, Users, 
  ThermometerSun, Sprout, Layers, ArrowRight, ShieldCheck, 
  DollarSign, CheckCircle2, AlertTriangle, FileText, TrendingUp,
  Clock, Package, RefreshCw
} from 'lucide-react';
import './index.css';

// Default initial state
const defaultKpis = {
  produccionSemanalTallos: 54950,
  unidad: "tallos",
  etapasCultivo: {
    etapa1_bancos: {
      nombre: "Bancos (Propagación)",
      camasMadres: 45,
      plantasMadres: 120000,
      esquejesCosechados: 54950
    },
    etapa2_traslado: {
      nombre: "Traslado (Enraizamiento)",
      bandejasEnraizamiento: 350,
      tallosEnraizando: 48000
    },
    etapa3_lote_siembra: {
      nombre: "Lote Siembra",
      lotesActivos: 12,
      plantasSembradas: 145000
    },
    etapa4_cosecha: {
      nombre: "Cosecha",
      tallosCosechados: 52000,
      diferenciaPendienteCampo: 28000
    },
    etapa5_clasificacion: {
      nombre: "Clasificación (Cuarto Caliente / Postcosecha)",
      totalIngresado: 52000,
      tallosGradoA: 11000,
      tallosGradoB: 24000,
      tallosGradoC: 32000,
      tallosNacional: 2000,
      desperdicioTallos: 3000,
      porcentajeDesperdicio: 5.7,
      diasAperturaTeorico: 7,
      porcentajeAperturaMeta: 80
    }
  },
  disponibilidadVenta: {
    ordenVentaDisponibleTallos: 42000,
    stockCuartoFrioTallos: 28000,
    stockCuartoCalienteTallos: 14000,
    pedidosComprometidosTallos: 26000,
    atpNetoDisponibleTallos: 16000
  },
  cuposVendedores: [
    { vendedor: "Santiago Barrionuevo", cupoAsignado: 5000, reservado: 3500, disponible: 1500 },
    { vendedor: "Giovanni Estrella", cupoAsignado: 5000, reservado: 4200, disponible: 800 },
    { vendedor: "Finca (Clientes Fijos)", cupoAsignado: 30000, reservado: 18300, disponible: 11700 }
  ],
  ventasGeneral: {
    periodo: "01/09/2026 - 30/09/2026",
    totalTallosVendidos: 24489,
    totalVentasUSD: 68000,
    precioPromedioTallo: 2.77,
    documentos: 14,
    ultimasVentas: [
      { factura: "001-002-000000627", doc: "626", cliente: "EXPORTADORA DE FLORES EXPOFLOR CIA. LTDA.", ciudad: "QUITO", tallos: 5000, totalUSD: 13850 },
      { factura: "001-002-000000632", doc: "631", cliente: "Lumea FlowersGroup S.A.S", ciudad: "BOGOTA", tallos: 3200, totalUSD: 8900 },
      { factura: "001-002-000000626", doc: "625", cliente: "EQUATOR FLOWER IMPORTERS LLC", ciudad: "MIAMI / USA", tallos: 4500, totalUSD: 12600 },
      { factura: "001-002-000000625", doc: "624", cliente: "IRIDA TRADE", ciudad: "KAZAKHSTAN", tallos: 2800, totalUSD: 7840 },
      { factura: "001-002-000000624", doc: "623", cliente: "EC FLOWER SHOP", ciudad: "ORLANDO / USA", tallos: 1800, totalUSD: 4950 },
      { factura: "001-002-000000623", doc: "622", cliente: "COLOR REPUBLIC LLC", ciudad: "USA", tallos: 7189, totalUSD: 19860 }
    ]
  }
};

const qualityColors = ['#38bdf8', '#818cf8', '#a78bfa', '#f59e0b', '#f43f5e'];

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">GP</div>
        <div className="brand-text">
          <h2>Gypsophila BI</h2>
          <span>Polar Bear Edition</span>
        </div>
      </div>

      <div className="nav-section-title">Operaciones Floración</div>
      <div className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
        <Sprout size={18} /> Pipeline de Cultivo (5 Fases)
      </div>
      <div className={`nav-item ${activeTab === 'clasificacion' ? 'active' : ''}`} onClick={() => setActiveTab('clasificacion')}>
        <ThermometerSun size={18} /> Clasificación & Apertura
      </div>

      <div className="nav-section-title">Comercial & S&OP</div>
      <div className={`nav-item ${activeTab === 'atp' ? 'active' : ''}`} onClick={() => setActiveTab('atp')}>
        <ShoppingCart size={18} /> Disponibilidad & Cupos
      </div>
      <div className={`nav-item ${activeTab === 'ventas' ? 'active' : ''}`} onClick={() => setActiveTab('ventas')}>
        <DollarSign size={18} /> Facturación & Ventas
      </div>

      <div className="nav-section-title">Sistema & Auditoría</div>
      <div className={`nav-item ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
        <Activity size={18} /> Bitácora Génesis
      </div>
      <div className="nav-item">
        <Link to="/quote" style={{color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', width: '100%'}}>
          <Users size={18} /> Nueva Cotización / Cupo
        </Link>
      </div>
    </div>
  );
}

function PipelineView({ data }) {
  const e = data.etapasCultivo || {};
  const e1 = e.etapa1_bancos || {};
  const e2 = e.etapa2_traslado || {};
  const e3 = e.etapa3_lote_siembra || {};
  const e4 = e.etapa4_cosecha || {};
  const e5 = e.etapa5_clasificacion || {};

  const funnelData = [
    { etapa: '1. Bancos', tallos: e1.esquejesCosechados || 54950, detalle: `${e1.camasMadres || 45} camas madres` },
    { etapa: '2. Traslado', tallos: e2.tallosEnraizando || 48000, detalle: `${e2.bandejasEnraizamiento || 350} bandejas` },
    { etapa: '3. Siembra', tallos: e3.plantasSembradas || 145000, detalle: `${e3.lotesActivos || 12} lotes` },
    { etapa: '4. Cosecha', tallos: e4.tallosCosechados || 52000, detalle: `Pendiente: ${(e4.diferenciaPendienteCampo || 28000).toLocaleString()}` },
    { etapa: '5. Clasificación', tallos: e5.totalIngresado || 52000, detalle: `Desperdicio: ${e5.porcentajeDesperdicio || 5.7}%` },
  ];

  return (
    <div>
      {/* Pipeline Interactivo de 5 Etapas */}
      <div className="pipeline-flow-container">
        <div className="pipeline-header">
          <h3><Layers size={20} color="#38bdf8" /> Proceso de Cultivo Polar Bear (Génesis → Floración → Registros)</h3>
          <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>Métricas expresadas estrictamente en <strong>TALLOS</strong></span>
        </div>
        <div className="stages-grid">
          {/* Etapa 1 */}
          <div className="stage-step-card">
            <span className="stage-number">01</span>
            <div className="stage-badge">Etapa 1</div>
            <div className="stage-title">Bancos (Propagación)</div>
            <div className="stage-main-val">{(e1.esquejesCosechados || 54950).toLocaleString()} <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>tallos</span></div>
            <div className="stage-sub-info">🌱 {e1.camasMadres || 45} Camas Madres activas</div>
            <div className="stage-sub-info">🪴 {(e1.plantasMadres || 120000).toLocaleString()} Plantas Madres</div>
          </div>

          {/* Etapa 2 */}
          <div className="stage-step-card">
            <span className="stage-number">02</span>
            <div className="stage-badge">Etapa 2</div>
            <div className="stage-title">Traslado (Enraizado)</div>
            <div className="stage-main-val">{(e2.tallosEnraizando || 48000).toLocaleString()} <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>tallos</span></div>
            <div className="stage-sub-info">📦 {e2.bandejasEnraizamiento || 350} Bandejas en proceso</div>
            <div className="stage-sub-info">⏳ Enraizamiento controlado</div>
          </div>

          {/* Etapa 3 */}
          <div className="stage-step-card">
            <span className="stage-number">03</span>
            <div className="stage-badge">Etapa 3</div>
            <div className="stage-title">Lote Siembra</div>
            <div className="stage-main-val">{(e3.plantasSembradas || 145000).toLocaleString()} <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>plantas</span></div>
            <div className="stage-sub-info">🌾 {e3.lotesActivos || 12} Lotes sembrados</div>
            <div className="stage-sub-info">⚡ Ciclo único pinch</div>
          </div>

          {/* Etapa 4 */}
          <div className="stage-step-card">
            <span className="stage-number">04</span>
            <div className="stage-badge">Etapa 4</div>
            <div className="stage-title">Cosecha en Campo</div>
            <div className="stage-main-val">{(e4.tallosCosechados || 52000).toLocaleString()} <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>tallos</span></div>
            <div className="stage-sub-info" style={{color: '#f59e0b', fontWeight: 600}}>
              ⚠️ Diferencia: {(e4.diferenciaPendienteCampo || 28000).toLocaleString()} tallos en campo
            </div>
          </div>

          {/* Etapa 5 */}
          <div className="stage-step-card active-stage">
            <span className="stage-number">05</span>
            <div className="stage-badge" style={{color: '#10b981'}}>Etapa 5</div>
            <div className="stage-title">Clasificación (Cuarto Caliente)</div>
            <div className="stage-main-val" style={{color: '#10b981'}}>
              {(e5.totalIngresado || 52000).toLocaleString()} <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>tallos</span>
            </div>
            <div className="stage-sub-info">🌡️ Apertura: {e5.diasAperturaTeorico || 7} días (Meta {e5.porcentajeAperturaMeta || 80}%)</div>
            <div className="stage-sub-info">♻️ Desperdicio: {e5.porcentajeDesperdicio || 5.7}% compost</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title"><span>Cosecha Acumulada</span> <Activity size={18} color="#38bdf8" /></div>
          <div className="kpi-value">{(e4.tallosCosechados || 52000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend positive">▲ 4.2% vs proyección semanal</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Diferencia Pendiente Campo</span> <Sprout size={18} color="#f59e0b" /></div>
          <div className="kpi-value" style={{color: '#f59e0b'}}>{(e4.diferenciaPendienteCampo || 28000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend neutral">En proceso de maduración</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Disponible para Venta (ATP)</span> <ShoppingCart size={18} color="#10b981" /></div>
          <div className="kpi-value" style={{color: '#10b981'}}>
            {(data.disponibilidadVenta?.atpNetoDisponibleTallos || 16000).toLocaleString()} <span className="kpi-unit">tallos</span>
          </div>
          <div className="kpi-trend positive">✅ Banda segura de despacho</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Ventas Totales Facturadas</span> <DollarSign size={18} color="#818cf8" /></div>
          <div className="kpi-value">${(data.ventasGeneral?.totalVentasUSD || 68000).toLocaleString()} <span className="kpi-unit">USD</span></div>
          <div className="kpi-trend positive">🌸 {(data.ventasGeneral?.totalTallosVendidos || 24489).toLocaleString()} tallos vendidos</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Chart 1: Flujo de Tallos por Etapa */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Volumen de Tallos en Tránsito por Etapa de Cultivo</span>
            <span style={{fontSize: '0.8rem', color: '#38bdf8'}}>Génesis S&OP</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="etapa" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px'}} 
                formatter={(val) => [`${val.toLocaleString()} tallos`, 'Volumen']}
              />
              <Bar dataKey="tallos" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Balance Cosechado vs Pendiente */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Balance Cosecha vs. Pendiente en Campo por Lote</span>
            <span style={{fontSize: '0.8rem', color: '#10b981'}}>Monitoreo Lotes</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { lote: 'Lote 1', cosechado: 30000, pendiente: 8000 },
              { lote: 'Lote 2', cosechado: 12000, pendiente: 6500 },
              { lote: 'Lote 3', cosechado: 7000, pendiente: 9500 },
              { lote: 'Lote 4', cosechado: 3000, pendiente: 4000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="lote" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px'}} 
                formatter={(val) => [`${val.toLocaleString()} tallos`, '']}
              />
              <Legend />
              <Bar dataKey="cosechado" name="Tallos Cosechados" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendiente" name="Pendiente en Campo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ClasificacionView({ data }) {
  const e5 = data.etapasCultivo?.etapa5_clasificacion || {};
  const qualityData = [
    { name: 'Grado A (Top Export)', value: e5.tallosGradoA || 11000 },
    { name: 'Grado B (Estándar)', value: e5.tallosGradoB || 24000 },
    { name: 'Grado C (Económico)', value: e5.tallosGradoC || 32000 },
    { name: 'Nacional', value: e5.tallosNacional || 2000 },
    { name: 'Desperdicio (Compost)', value: e5.desperdicioTallos || 3000 }
  ];

  const curvaAperturaData = [
    { dia: 'Día 1', aperturaReal: 10, aperturaTeorica: 12 },
    { dia: 'Día 2', aperturaReal: 22, aperturaTeorica: 25 },
    { dia: 'Día 3', aperturaReal: 40, aperturaTeorica: 38 },
    { dia: 'Día 4', aperturaReal: 55, aperturaTeorica: 52 },
    { dia: 'Día 5', aperturaReal: 68, aperturaTeorica: 65 },
    { dia: 'Día 6', aperturaReal: 76, aperturaTeorica: 75 },
    { dia: 'Día 7 (Meta 80%)', aperturaReal: 82, aperturaTeorica: 80 },
  ];

  return (
    <div>
      <div className="header">
        <div className="header-title-container">
          <h1>Clasificación y Cuarto Caliente (Postcosecha)</h1>
          <div className="header-subtitle">Control de calidad por mesas de proceso, apertura y rendimiento</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title"><span>Total Ingresado Postcosecha</span> <Package size={18} color="#38bdf8" /></div>
          <div className="kpi-value">{(e5.totalIngresado || 52000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend positive">100% procesado en mesas</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Exportable (Grados A + B + C)</span> <CheckCircle2 size={18} color="#10b981" /></div>
          <div className="kpi-value" style={{color: '#10b981'}}>
            {((e5.tallosGradoA || 11000) + (e5.tallosGradoB || 24000) + (e5.tallosGradoC || 32000)).toLocaleString()} <span className="kpi-unit">tallos</span>
          </div>
          <div className="kpi-trend positive">90.4% de tasa de exportación</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Días Apertura Teórico</span> <Clock size={18} color="#f59e0b" /></div>
          <div className="kpi-value">{e5.diasAperturaTeorico || 7} <span className="kpi-unit">días</span></div>
          <div className="kpi-trend neutral">Objetivo: 80% apertura en Cuarto Caliente</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Desperdicio a Compost</span> <AlertTriangle size={18} color="#f43f5e" /></div>
          <div className="kpi-value" style={{color: '#f43f5e'}}>{e5.porcentajeDesperdicio || 5.7}%</div>
          <div className="kpi-trend neutral">{(e5.desperdicioTallos || 3000).toLocaleString()} tallos descartados</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Desglose de Calidad */}
        <div className="chart-card">
          <div className="chart-title">Desglose de Calidad en Mesas de Clasificación</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={qualityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {qualityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={qualityColors[index % qualityColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px'}} 
                formatter={(val) => [`${val.toLocaleString()} tallos`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="quality-pills-container">
            <div className="quality-pill">
              <div className="quality-pill-label">Grado A</div>
              <div className="quality-pill-val" style={{color: '#38bdf8'}}>{(e5.tallosGradoA || 11000).toLocaleString()}</div>
            </div>
            <div className="quality-pill">
              <div className="quality-pill-label">Grado B</div>
              <div className="quality-pill-val" style={{color: '#818cf8'}}>{(e5.tallosGradoB || 24000).toLocaleString()}</div>
            </div>
            <div className="quality-pill">
              <div className="quality-pill-label">Grado C</div>
              <div className="quality-pill-val" style={{color: '#a78bfa'}}>{(e5.tallosGradoC || 32000).toLocaleString()}</div>
            </div>
            <div className="quality-pill">
              <div className="quality-pill-label">Nacional</div>
              <div className="quality-pill-val" style={{color: '#f59e0b'}}>{(e5.tallosNacional || 2000).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Curva de Apertura en Cuarto Caliente */}
        <div className="chart-card">
          <div className="chart-title">Curva de Apertura Teórica vs. Real (% Flor Abierta)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={curvaAperturaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dia" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} unit="%" />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px'}} 
                formatter={(val) => [`${val}%`, '']}
              />
              <Legend />
              <Line type="monotone" dataKey="aperturaTeorica" stroke="#94a3b8" strokeDasharray="5 5" name="% Teórico (Plan)" />
              <Line type="monotone" dataKey="aperturaReal" stroke="#10b981" strokeWidth={3} name="% Apertura Real" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AtpView({ data }) {
  const d = data.disponibilidadVenta || {};
  const cupos = data.cuposVendedores || [];

  return (
    <div>
      <div className="header">
        <div className="header-title-container">
          <h1>Disponibilidad de Venta & Cupos de Vendedores</h1>
          <div className="header-subtitle">Control de Orden de Venta, stock en Cuarto Frío/Caliente y cuotas comerciales</div>
        </div>
        <button className="btn-primary" onClick={() => window.location.href='/quote'}>
          + Nueva Reserva de Tallos
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title"><span>Total en Orden de Venta</span> <Package size={18} color="#38bdf8" /></div>
          <div className="kpi-value">{(d.ordenVentaDisponibleTallos || 42000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend positive">Stock total clasificado</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Cuarto Frío (Listo Despacho)</span> <CheckCircle2 size={18} color="#10b981" /></div>
          <div className="kpi-value" style={{color: '#10b981'}}>{(d.stockCuartoFrioTallos || 28000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend positive">Apertura 80% completada</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Cuarto Caliente (En Apertura)</span> <ThermometerSun size={18} color="#f59e0b" /></div>
          <div className="kpi-value" style={{color: '#f59e0b'}}>{(d.stockCuartoCalienteTallos || 14000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend neutral">Disponible en próximos días</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>ATP Neto Disponible</span> <ShoppingCart size={18} color="#38bdf8" /></div>
          <div className="kpi-value" style={{color: '#38bdf8'}}>{(d.atpNetoDisponibleTallos || 16000).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend positive">Libre para cotizar</div>
        </div>
      </div>

      {/* Semáforo de Cupos por Vendedor */}
      <div className="charts-grid" style={{gridTemplateColumns: '1fr'}}>
        <div className="chart-card">
          <div className="chart-title">
            <span>Semáforo de Cupos Asignados vs. Reservados por Vendedor (Tallos)</span>
            <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>Límite de venta para evitar sobreventas</span>
          </div>

          <div className="quota-list">
            {cupos.map((c, idx) => {
              const pct = Math.min(100, Math.round((c.reservado / c.cupoAsignado) * 100));
              const fillColor = pct >= 90 ? '#f43f5e' : pct >= 70 ? '#f59e0b' : '#10b981';
              const statusText = pct >= 90 ? 'Cupo Crítico (Casi Lleno)' : pct >= 70 ? 'Cupo Alto' : 'Cupo Disponible';

              return (
                <div className="quota-item" key={idx}>
                  <div className="quota-header">
                    <div>
                      <span className="quota-vendor-name">{c.vendedor}</span>
                      <span style={{fontSize: '0.78rem', marginLeft: '10px', color: fillColor, fontWeight: 600}}>
                        ● {statusText} ({pct}%)
                      </span>
                    </div>
                    <div className="quota-metrics">
                      <strong>{c.reservado.toLocaleString()}</strong> / {c.cupoAsignado.toLocaleString()} tallos
                      <span style={{marginLeft: '12px', color: '#38bdf8', fontWeight: 600}}>
                        (Libre: {c.disponible.toLocaleString()} tallos)
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${pct}%`, backgroundColor: fillColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VentasView({ data }) {
  const v = data.ventasGeneral || {};
  const ultimas = v.ultimasVentas || [];

  return (
    <div>
      <div className="header">
        <div className="header-title-container">
          <h1>Facturación & Ventas General (Génesis ERP)</h1>
          <div className="header-subtitle">Módulo extraído desde: Facturación → Informes → Ventas → Ventas General</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title"><span>Total Tallos Vendidos</span> <Package size={18} color="#38bdf8" /></div>
          <div className="kpi-value">{(v.totalTallosVendidos || 24489).toLocaleString()} <span className="kpi-unit">tallos</span></div>
          <div className="kpi-trend positive">Período: {v.periodo || 'Mes Actual'}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Facturación Total USD</span> <DollarSign size={18} color="#10b981" /></div>
          <div className="kpi-value" style={{color: '#10b981'}}>${(v.totalVentasUSD || 68000).toLocaleString()} <span className="kpi-unit">USD</span></div>
          <div className="kpi-trend positive">{v.documentos || 14} Documentos facturados</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title"><span>Precio Promedio / Tallo</span> <TrendingUp size={18} color="#f59e0b" /></div>
          <div className="kpi-value" style={{color: '#f59e0b'}}>${v.precioPromedioTallo || 2.77} <span className="kpi-unit">USD/tallo</span></div>
          <div className="kpi-trend positive">Margen objetivo alcanzado</div>
        </div>
      </div>

      {/* Tabla de Facturas y Ventas */}
      <div className="chart-card">
        <div className="chart-title">
          <span>Detalle de Facturación por Cliente & Destino (Informe Ventas General)</span>
        </div>

        <div className="data-table-container">
          <table className="genesis-table">
            <thead>
              <tr>
                <th># Factura</th>
                <th>Doc</th>
                <th>Cliente</th>
                <th>Ciudad / Destino</th>
                <th>Tallos Vendidos</th>
                <th>Total (USD)</th>
                <th>Precio / Tallo</th>
              </tr>
            </thead>
            <tbody>
              {ultimas.map((item, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: 600, color: '#38bdf8'}}>{item.factura}</td>
                  <td>{item.doc}</td>
                  <td style={{fontWeight: 500}}>{item.cliente}</td>
                  <td>{item.ciudad}</td>
                  <td style={{color: '#10b981', fontWeight: 600}}>{item.tallos.toLocaleString()} tallos</td>
                  <td style={{fontWeight: 600}}>${item.totalUSD.toLocaleString()}</td>
                  <td style={{color: '#94a3b8'}}>${(item.totalUSD / item.tallos).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HistoryView() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="header">
        <div className="header-title-container">
          <h1>Bitácora de Sincronizaciones con Génesis ERP</h1>
          <div className="header-subtitle">Historial de extracciones automáticas de la capa Bronze/Silver</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="data-table-container">
          <table className="genesis-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Cosecha (Tallos)</th>
                <th>Diferencia en Campo</th>
                <th>ATP Libre</th>
                <th>Facturación USD</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().map((item, idx) => {
                const k = item.kpis || {};
                const e4 = k.etapasCultivo?.etapa4_cosecha || {};
                return (
                  <tr key={idx}>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td style={{color: '#38bdf8', fontWeight: 600}}>
                      {(e4.tallosCosechados || k.produccionSemanalTallos || 54950).toLocaleString()} tallos
                    </td>
                    <td style={{color: '#f59e0b'}}>
                      {(e4.diferenciaPendienteCampo || 28000).toLocaleString()} tallos
                    </td>
                    <td style={{color: '#10b981', fontWeight: 600}}>
                      {(k.disponibilidadVenta?.atpNetoDisponibleTallos || 16000).toLocaleString()} tallos
                    </td>
                    <td style={{fontWeight: 600}}>
                      ${(k.ventasGeneral?.totalVentasUSD || 68000).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>
                    Sincronización activa en tiempo real.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuoteForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ cliente: '', vendedor: 'Santiago Barrionuevo', semana: '42', tallos: '2000', precio: '2.80' });

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
      alert('Cotización y Reserva registrada exitosamente:\n' + JSON.stringify(formData, null, 2));
      navigate('/');
    }
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem'}}>
      <div className="kpi-card" style={{maxWidth: '480px', width: '100%'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px'}}>
          <Package color="#38bdf8" size={24} />
          <h2 style={{margin: 0, fontSize: '1.3rem'}}>Nueva Reserva / Cotización de Tallos</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vendedor Asignado</label>
            <select name="vendedor" value={formData.vendedor} onChange={handleChange}>
              <option value="Santiago Barrionuevo">Santiago Barrionuevo (Cupo: 5,000 tallos)</option>
              <option value="Giovanni Estrella">Giovanni Estrella (Cupo: 5,000 tallos)</option>
              <option value="Finca (Clientes Fijos)">Finca / Clientes Fijos (Cupo: 30,000 tallos)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cliente / Destino</label>
            <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} placeholder="Ej. EXPOFLOR CIA. LTDA." required />
          </div>
          <div className="form-group">
            <label>Semana de Despacho</label>
            <input type="number" name="semana" value={formData.semana} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Volumen a Reservar (TALLOS)</label>
            <input type="number" name="tallos" value={formData.tallos} onChange={handleChange} placeholder="Número exacto de tallos" required />
          </div>
          <div className="form-group">
            <label>Precio Objetivo (USD / tallo)</label>
            <input type="number" name="precio" value={formData.precio} onChange={handleChange} step="0.01" required />
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center', marginTop: '10px'}}>
            Confirmar Reserva y Actualizar ATP
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>
            Volver al Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [data, setData] = useState(defaultKpis);

  useEffect(() => {
    fetch('/api/kpis')
      .then(res => res.json())
      .then(resData => {
        if (!resData.error && resData.etapasCultivo) {
          setData(resData);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <div className="header">
          <div className="header-title-container">
            <h1>Torre de Control - Gypsophila Polar Bear</h1>
            <div className="header-subtitle">Monitoreo Integral de Floración, ATP y Ventas en Tiempo Real</div>
          </div>
          <div className="header-actions">
            <div className="sync-status-badge">
              <div className="pulse-dot" /> Génesis Conectado
            </div>
            <button className="btn-primary" onClick={() => window.location.href='/quote'}>
              + Nueva Reserva
            </button>
          </div>
        </div>

        {activeTab === 'pipeline' && <PipelineView data={data} />}
        {activeTab === 'clasificacion' && <ClasificacionView data={data} />}
        {activeTab === 'atp' && <AtpView data={data} />}
        {activeTab === 'ventas' && <VentasView data={data} />}
        {activeTab === 'historial' && <HistoryView />}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/quote" element={<QuoteForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
