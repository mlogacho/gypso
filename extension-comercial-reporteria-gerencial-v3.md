# Extensión comercial y reportería gerencial — v3.0
### Complemento al diseño de arquitectura v2.0 (gypsophila Polar Bear)

---

## 0. Qué cambia conceptualmente

Con la capa comercial, el módulo deja de ser un tablero de producción y se convierte en una **torre de control de oferta y demanda** (S&OP conversacional). Es un salto de categoría, no una función más.

La diferencia práctica: un tablero de producción responde *"¿cómo vamos?"*. Una torre de control responde *"¿puedo comprometer 1.200 kg para la semana 42 y a qué precio?"*. La segunda pregunta es la que hace que gerencia general abra el bot todos los días.

**Regla de diseño que ordena toda la capa:** producción y comercial deben leer el mismo número o el sistema pierde autoridad. Si el vendedor promete contra un Excel propio y producción proyecta contra el módulo, se reconstruye el problema que el proyecto viene a resolver. El ATP (disponible a comprometer) es la única fuente válida para ambos.

---

## 1. Nuevo dominio comercial

### 1.1 Entidades

| Entidad | Contenido clave |
|---|---|
| `cliente` | Mercado, canal (mayorista, bouquetero, supermercado, e-commerce), moneda, incoterm, condición de pago, calificación de riesgo |
| `vendedor` | Zona, cartera asignada, meta por periodo, estructura de comisión |
| `cotizacion` | Estado, vigencia, líneas, probabilidad de cierre |
| `pedido` | Fecha de ingreso, fecha requerida de despacho, estado, prioridad, vendedor, cliente |
| `linea_pedido` | Presentación, peso nominal del bonche, cajas, kg, precio unitario, descuento aplicado |
| `lista_precios` | Precio base por presentación, mercado y temporada; reglas de descuento autorizadas |
| `embarque` | Guía/AWB, aerolínea, fecha, temperatura de tránsito, pedidos consolidados |
| `factura` / `nota_credito` | Valor, fecha, vencimiento, estado de cobro |
| `reclamo` | Cliente, embarque, causa, kg y USD reclamados, resolución |
| `campana` | San Valentín, Día de la Madre por mercado, Difuntos, temporada de bodas: fechas, meta, precios |

### 1.2 Reserva: la entidad que evita la sobreventa

`reserva` vincula una línea de pedido con capacidad productiva de una semana específica. Sin ella, dos vendedores comprometen el mismo kilo. Estados: `tentativa` (cotización viva, expira), `firme` (pedido confirmado), `asignada` (lote real ya vinculado), `liberada`.

Una reserva tentativa que expira devuelve capacidad al ATP automáticamente. Es un mecanismo simple que resuelve el conflicto comercial más común en floricultura.

---

## 2. Motor ATP — disponible a comprometer

El corazón de la capa. Calcula, para cada semana futura y cada presentación:

```
ATP(semana w) =
      stock_frío_disponible
    + Σ kg en cámara de apertura con salida proyectada ≤ w
    + Σ kg en postcosecha en proceso
    + Σ kg de camas en ciclo con cosecha proyectada ≤ w
        × factor_conversión_acumulado
    − Σ reservas firmes y tentativas con despacho ≤ w
    − reserva de seguridad (%)
```

Donde `factor_conversión_acumulado` viene del yield bridge real de las últimas N semanas: `% salida de apertura × % exportable × % dentro de especificación de peso`. **No es un supuesto: es el histórico medido.** Ese es el aporte del módulo — hoy ese factor lo estima cada quien de memoria.

### 2.1 La decisión de diseño más importante de esta capa

**Se compromete contra p10. Se planifica contra p50. Se dimensiona capacidad contra p90.**

Vender contra la mediana de la proyección significa incumplir aproximadamente la mitad de las veces. En un mercado donde el reclamo por faltante cuesta la relación con el cliente, la banda conservadora no es prudencia excesiva: es la única política defendible. El bot debe mostrar las tres bandas y dejar explícito cuál corresponde a cada decisión.

### 2.2 Salidas del motor

- **Gráfico de cobertura semanal:** barras de oferta proyectada con línea de demanda comprometida encima, ocho semanas de horizonte. Es el gráfico que va primero en todo reporte gerencial.
- **Brecha por semana:** positiva (producción sin vender) o negativa (sobreventa). Ambas son alertas, no solo la segunda.
- **Respuesta a consulta puntual:** "¿puedo comprometer 1.200 kg para la semana 42?" → sí / no / parcial, con el número y la banda.

---

## 3. Catálogo de indicadores comerciales

### 3.1 Pedidos y demanda

| Indicador | Fórmula | Frec. |
|---|---|---|
| Pedidos ingresados | conteo y valor USD | D |
| Backlog | kg y USD comprometidos aún no despachados | D |
| Cobertura de producción | kg comprometidos / kg proyectados, por semana | D |
| Ticket promedio | USD / pedido | S |
| Antigüedad del backlog | distribución de días entre ingreso y despacho requerido | S |
| Tasa de conversión | pedidos confirmados / cotizaciones emitidas | M |
| Ciclo de venta | días desde cotización hasta confirmación | M |
| Estacionalidad de demanda | pedidos por semana ISO vs. mismo periodo del año anterior | S |

### 3.2 Cumplimiento

| Indicador | Fórmula | Frec. |
|---|---|---|
| **OTIF** | pedidos completos y a tiempo / pedidos despachados | D |
| Fill rate en kg | kg despachados / kg comprometidos | D |
| Faltante por causa | producción, calidad, logística, error comercial | S |
| Pedidos en riesgo | pedidos sin ATP suficiente en su semana | T |
| Días de retraso promedio | ponderado por valor | S |
| Tasa de reclamo | USD reclamados / USD facturados | M |
| Costo de incumplimiento | notas de crédito + reclamos + flete de reposición | M |

### 3.3 Desempeño comercial

| Indicador | Fórmula | Frec. |
|---|---|---|
| **Ranking de vendedores** | kg, USD y margen por vendedor y periodo | S, M |
| Cumplimiento de meta | ventas / meta asignada | M |
| **Precio realizado vs. lista** | precio efectivo / precio base | S |
| Erosión por descuento | USD no facturados por descuentos autorizados | M |
| Margen de contribución por vendedor | USD − costo directo por kg | M |
| Clientes nuevos y reactivados | conteo por vendedor y periodo | M |
| Cartera activa | clientes con al menos un pedido en los últimos 90 días | M |
| Productividad comercial | USD vendidos / USD de costo comercial | M |

### 3.4 Cliente y mercado

| Indicador | Fórmula | Frec. |
|---|---|---|
| **Concentración de clientes (HHI)** | Σ (participación de cada cliente)² | M |
| Participación por mercado | % de kg y USD por destino | M |
| Precio promedio por mercado | USD / kg por destino y presentación | S |
| Recompra | % de clientes con pedido en el periodo anterior que repiten | M |
| Valor de vida del cliente | margen acumulado por cliente | T |
| Rentabilidad neta por cliente | margen − reclamos − costo de servicio | M |
| **DSO** | días promedio de cobro | M |
| Cartera vencida | % de cartera por tramo de mora | S |

**HHI y concentración merecen espacio propio en el tablero de directorio.** Una finca monovarietal con tres clientes que representan el 70% de sus ventas tiene un perfil de riesgo distinto al que muestra su estado de resultados. Es la clase de hallazgo que justifica el proyecto ante el directorio.

### 3.5 Integrados producción–comercial

Los que ninguna de las dos áreas puede calcular sola. Son el diferencial del módulo.

| Indicador | Qué revela |
|---|---|
| **Margen por metro cuadrado por ciclo** | Une costo de producción con precio realizado. El KPI definitivo de una finca |
| **Costo del kilo no vendido** | Producción exportable que se liquidó a spot o se descartó por falta de pedido |
| **Costo de la sobreventa** | Compras a terceros, fletes extraordinarios, notas de crédito |
| Precio realizado vs. calidad entregada | ¿El cliente que paga más recibe mejor calidad? Suele no ser así |
| Elasticidad de campaña | Cómo respondió el precio al volumen ofertado en cada campaña |
| Retorno de la iluminación | Margen incremental del ciclo forzado vs. su costo energético |

---

## 4. Visualizaciones nuevas

| Gráfico | Para qué |
|---|---|
| **Cobertura semanal** (barras de oferta + línea de demanda) | La vista maestra. Ocho semanas. Zona sombreada donde hay brecha |
| **Embudo comercial** | Cotización → confirmado → producido → despachado → facturado → cobrado |
| **Barras horizontales ordenadas** | Ranking de vendedores y de clientes. Nunca torta |
| **Cascada de precio** | Precio lista → descuento → notas de crédito → precio realizado |
| **Matriz de cartera** (dispersión) | Volumen en X, margen en Y, tamaño = riesgo de cartera. Segmenta clientes en un vistazo |
| **Curva de Pareto de clientes** | Concentración acumulada. Con línea del 80% |
| **Mapa de calor de demanda** | Semana × mercado, intensidad = kg. Revela la estacionalidad real |
| **Gantt de pedidos** | Pedidos en el eje Y, semana de despacho en X, color por estado de riesgo |
| **Fan chart de ingresos** | Proyección de facturación con bandas, derivada del ATP y de la lista de precios |

Regla de composición para reportes gerenciales: **máximo un gráfico por decisión**. Un reporte con doce gráficos no se lee. Cada visual debe poder completar la frase "esto lo miro para decidir si…".

---

## 5. Reportes gerenciales

Cuatro paquetes, con destinatario, hora y contenido fijos. La disciplina del formato fijo es lo que hace que se lean.

### A. Flash diario — 06:30, gerencia y jefaturas
Una sola pantalla. Si necesita scroll, está mal diseñado.

```
CIERRE DEL 12 DE MAYO

Producción     1.840 kg exportables   ▲ 4% vs. plan
Calidad        % exportable 91,2%  ·  bonche 402 g (nominal 400)
Despacho       14 pedidos · 2.210 kg · USD 18.640
Cumplimiento   OTIF 96%  ·  1 pedido con faltante parcial

COBERTURA SEMANA EN CURSO
Oferta p10 12.400 kg  ·  Comprometido 11.900 kg  ·  Libre 500 kg

⚠ 2 alertas abiertas
  · Pedido #4471 (semana 21) sin ATP: faltan 340 kg
  · Etileno cámara 2 sobre umbral hace 40 min

[Detalle producción] [Detalle comercial] [Alertas] [Tablero ↗]
```

### B. Cierre semanal S&OP — lunes 07:00, comité de gerencia
El reporte que dispara decisiones. Estructura fija:

1. **Cobertura a 8 semanas** — el gráfico maestro, primero y sin excepción
2. Producción de la semana vs. proyección, con explicación de la desviación
3. **Brechas que requieren decisión**, listadas con opciones: qué semana está sobrevendida, qué semana tiene producción libre
4. Ranking comercial de la semana: kg, USD, margen, cumplimiento de meta
5. Yield bridge en kg: dónde se perdió producto
6. Precio realizado promedio vs. lista, por mercado
7. Pedidos en riesgo y plan de acción
8. Estado de campañas activas

### C. Paquete mensual de directorio — día 5, gerencia general y accionistas
Formato documento (PDF por el bot o enlace a la Mini App), no mensaje de chat.

- P&L operativo por kilogramo, abierto por proceso
- **Margen por m² por ciclo**, por bloque
- Precio realizado vs. lista, con cascada de erosión
- **Concentración de clientes (HHI)** y de vendedores
- Rentabilidad neta por cliente, top 10 y bottom 10
- DSO y cartera por tramo de mora
- Intensidad energética: kWh por kg exportado
- OTIF, reclamos y costo de incumplimiento
- Proyección de producción y facturación a 6 meses, con bandas
- Riesgos abiertos y decisiones pendientes del mes anterior

### D. Cierre de campaña — dentro de los 10 días posteriores
San Valentín, Día de la Madre por mercado, Difuntos, temporada de bodas.

- Comprometido vs. producido vs. despachado
- Precio de campaña vs. precio base: prima efectivamente capturada
- Merma de campaña vs. periodo normal
- Sobrecosto operativo (horas extra, flete, compra a terceros)
- Clientes ganados y perdidos en la campaña
- **Lecciones cuantificadas** para el modelo de planificación inversa del año siguiente

Este último punto es el que convierte el módulo en un sistema que aprende. Cada campaña recalibra el modelo del año siguiente con datos propios, no con intuición acumulada.

---

## 6. Alertas comerciales

| Alerta | Disparador | Destinatario | Urgencia |
|---|---|---|---|
| Pedido en riesgo | ATP p10 < comprometido para esa semana | Comercial + producción | Alta |
| Sobreventa de semana | brecha negativa a 3 semanas o menos | Gerencia | Alta |
| Producción sin vender | brecha positiva > umbral a 4 semanas | Comercial | Alta |
| Reserva tentativa por expirar | 24 h antes del vencimiento | Vendedor asignado | Media |
| Precio bajo el piso autorizado | descuento sobre el límite de la lista | Gerencia comercial | Alta |
| Cliente inactivo | sin pedido en 60 días | Vendedor de la cuenta | Media |
| Cartera vencida | factura sobre plazo | Financiero + vendedor | Media |
| Meta en riesgo | proyección de cierre < 85% de meta a 10 días del cierre | Vendedor + gerencia | Media |
| Reclamo abierto | ingreso de reclamo | Calidad + comercial | Alta |

**"Producción sin vender" es la alerta con mayor retorno del sistema completo.** Producto exportable que se liquida a precio spot porque nadie supo con cuatro semanas de anticipación que iba a estar disponible es la pérdida más grande y más invisible de una finca. Detectarla temprano no requiere ningún desarrollo adicional: sale del mismo motor ATP.

---

## 7. Comandos del bot

```
/pedidos       Backlog, ingresos del día, pedidos en riesgo
/disponible    ATP por semana y presentación
/puedo         "¿puedo comprometer X kg para la semana N?"
/ranking       Desempeño comercial del periodo
/clientes      Cartera, concentración, rentabilidad
/precios       Precio realizado vs. lista por mercado
/cobertura     Gráfico maestro a 8 semanas
/campana       Estado de la campaña activa
/flash         Reporte del día bajo demanda
```

`/puedo` es el comando que cambia el comportamiento del equipo comercial. Un vendedor en llamada con un cliente escribe *"puedo 1.200 kg semana 42"* y recibe una respuesta en dos segundos, con el número, la banda y el botón para crear una reserva tentativa. Ese es el momento en el que el módulo deja de ser un reporte y pasa a ser parte de la operación.

---

## 8. Seguridad y consideraciones de personas

La capa comercial trae datos que la capa productiva no tenía, y con ellos, riesgos nuevos.

**Segregación por rol, estricta:**

| Rol | Ve |
|---|---|
| Vendedor | Su cartera, sus números, el ATP. **No ve** el ranking completo ni las cifras de sus pares |
| Gerencia comercial | Todo lo comercial, ranking completo, márgenes |
| Producción | ATP, cobertura, pedidos en kg. **No ve** precios ni márgenes |
| Gerencia general y directorio | Todo |
| Financiero | Cartera, DSO, facturación. No ve detalle agronómico |

**Sobre el ranking de vendedores.** La pregunta "quién vendió más" tiene una respuesta técnica trivial y una implicación de gestión de personas que no lo es. Publicar un ranking nominal en un grupo de Telegram tiene efectos predecibles: presión sobre los últimos, canibalización de cuentas, y descuentos concedidos para no aparecer abajo. Recomendación de diseño: **cada vendedor ve su posición y la distribución del equipo sin nombres; gerencia ve el ranking nominal completo.** Y el ranking se ordena por margen, no por volumen — ordenar por volumen es literalmente pagar por regalar descuentos.

**LOPDP.** El desempeño individual de un trabajador es dato personal. Requiere base de licitud, finalidad declarada, minimización y registro de la actividad de tratamiento. El acceso al detalle individual se limita a la línea de supervisión, y queda auditado.

**Precios y márgenes** son la información más sensible de la empresa. Cifrado en reposo, acceso auditado, y ninguna exportación masiva sin registro. Si el bot puede generar un Excel con la lista completa de precios por cliente, ese Excel se va a filtrar eventualmente: se limita la exportación a la cartera propia del solicitante.

---

## 9. Integraciones

| Sistema | Modo | Nota |
|---|---|---|
| ERP / facturación | CDC o réplica de solo lectura | Igual que producción: nunca escribir |
| CRM (si existe) | API o CDC | Si no existe, las cotizaciones se capturan en la Mini App |
| Contabilidad | Lectura de cartera y cobros | Para DSO y rentabilidad por cliente |
| Agencia de carga / courier | API o correo estructurado | Estado de embarque y confirmación de entrega |

**Si el cliente no tiene CRM**, no es bloqueante y no conviene proponer implementar uno: la Mini App captura cotización y pedido con un formulario de seis campos. Meter un CRM en el alcance triplica el proyecto y duplica el riesgo de que no termine.

---

## 10. Roadmap actualizado

Se intercalan las fases comerciales con las productivas de v2.0:

| Fase | Dur. | Alcance |
|---|---|---|
| 0 — Descubrimiento | 2–3 sem | Se amplía: proceso comercial, listas de precios, política de descuentos, definición de OTIF |
| 1 — Cimientos | 4 sem | Sin cambio |
| 2 — Bot v1 | 3 sem | Sin cambio |
| **2.5 — Pedidos y cumplimiento** | **3 sem** | **Ingesta comercial, backlog, OTIF, flash diario** |
| 3 — Apertura instrumentada | 4 sem | Sin cambio |
| 4 — Campo y ciclos | 5 sem | Sin cambio |
| 5 — Proyecciones | 4 sem | Sin cambio |
| **5.5 — Motor ATP** | **4 sem** | **Cobertura, `/puedo`, reservas, alertas de brecha, cierre semanal S&OP** |
| **5.6 — Analítica comercial** | **3 sem** | **Ranking, rentabilidad por cliente, cascada de precio, paquete de directorio** |
| 6 — Visión e IA | 5 sem | Sin cambio |

**Por qué el ATP va después de las proyecciones y no antes:** el ATP sin proyección confiable es una promesa que se incumple. Comprometer contra un modelo sin backtesting valida da peor resultado que el Excel actual, porque además le pone autoridad institucional al error. Fase 2.5 entrega valor comercial temprano (backlog y OTIF, que solo requieren datos históricos); el ATP espera a que el motor de proyección apruebe su umbral de error.

---

## 11. Lo que hay que confirmar

1. **¿Existe CRM o las cotizaciones viven en correo y Excel?** Define si la Mini App captura o solo lee.
2. **¿Cómo se define OTIF hoy?** ¿Contra fecha de despacho de finca o fecha de llegada a destino? Es la definición más peleada de todo el proyecto.
3. **¿Hay política formal de descuentos con piso autorizado?** Sin piso, la alerta de precio no se puede construir.
4. **¿Los vendedores tienen cartera exclusiva o hay cuentas compartidas?** Determina cómo se atribuye la venta en el ranking.
5. **¿La comisión se paga sobre volumen, facturación o margen?** El sistema debe medir lo mismo que remunera la empresa, o generará conflicto en la primera quincena.
6. **¿Se compra producto a terceros para completar pedidos?** Cambia el modelo de ATP y el costeo.
7. **¿Quién es el dueño formal del número de disponibilidad hoy?** Alguien lo está calculando en algún archivo. Esa persona es el aliado o el opositor del proyecto, y conviene definirlo en la fase 0.

---

*Extensión comercial y reportería gerencial — v3.0 · complementa la arquitectura v2.0*
