# Módulo de Analítica Conversacional — Gypsophila Polar Bear
### Diseño de arquitectura v2.0 · ajustado a cultivo monovarietal de gypsophila

> **Cambio respecto de v1.0:** el diseño anterior asumía rosa de corte. Gypsophila cambia la unidad de medida del negocio, convierte "Apertura" en un proceso físico real, introduce el fotoperiodo como variable de control y de costo, y obliga a rediseñar el motor de proyección. Las secciones 2, 3, 5 y 7 se reescribieron.

---

## 0. Lo que cambia y por qué importa

| Dimensión | Rosa (v1.0) | **Gypsophila Polar Bear (v2.0)** |
|---|---|---|
| Unidad comercial | Tallo, clasificado por largo | **Gramos / bonche**. Se vende por peso y volumen, no por conteo de tallos |
| KPI maestro | tallos/m²/año | **gramos exportables/m²/ciclo** y **cajas/ha/semana** |
| Producción en el tiempo | Flujo continuo | **Pulsos por ciclo**. La producción es discreta, no continua |
| "Apertura" | Ambiguo | **Proceso físico real**: cámara de apertura, 5–7 días post-corte |
| Variable de control clave | Poda y pinch | **Fotoperiodo** (planta de día largo, 14–18 h): iluminación artificial nocturna |
| Regulador de crecimiento | Opcional | **Ácido giberélico obligatorio en protocolo**, 150 ppm post-pinch |
| Sensibilidad al etileno | Moderada | **Muy alta** — tratamiento con tiosulfato de plata o 1-MCP es imprescindible |
| Mix varietal | KPI central | Desaparece (monovarietal) → se convierte en **riesgo de concentración** |
| Punto de corte | Botón cerrado | **20% de flores abiertas** en Polar Bear (las variedades tradicionales van a 40–50%) |

**Consecuencia arquitectónica principal:** en rosa, la analítica vive en Postcosecha. En gypsophila, el centro de gravedad se mueve a **Apertura**, porque es donde se define la calidad final, donde está el mayor riesgo de pérdida en pocas horas, y donde nadie tiene datos hoy.

---

## 1. Contexto de mercado

Ecuador concentra cerca del **70% de la producción mundial de gypsophila**; es la segunda flor de exportación del país después de la rosa y aporta alrededor del **8% de las exportaciones florícolas**. La superficie ronda las **320 ha**, con una referencia productiva de **~35 cajas por hectárea por semana** y tallos de **80–90 cm** logrados en cultivo a la intemperie, favorecido por la luz perpendicular y el rango térmico de 5–27 °C.

Un rasgo del proceso que define todo el diseño: **la flor se corta cerrada y completa su apertura en cámara**, lo que preserva vitalidad y color y es precisamente lo que le da su ventaja competitiva en destino.

**Polar Bear** es una variedad de flor más grande y más blanca que las tradicionales, con un protocolo propio: requiere **menos luz** que las variedades convencionales (5–6 semanas máximo de iluminación), pinch a 5–6 pares de hojas para ciclo único o a 3 pares si se dejará más de un ciclo, y aplicaciones de ácido giberélico a 150 ppm a los 4 días del pinch y una semana después.

**Implicación de negocio:** el menor requerimiento de luz de Polar Bear es una ventaja de costo energético frente a Million Star o Xlence. Si no se mide el kWh por kilogramo exportado, esa ventaja no se ve en ningún reporte y el cliente no puede defenderla ni capitalizarla. **Ese es el primer KPI que debe existir.**

---

## 2. Modelo de dominio

### 2.1 Cadena de trazabilidad

```
Planta madre → Esqueje → Lote de propagación (enraizamiento)
      ↓
Trasplante a cama/bloque → Pinch → Ciclo de luz → Desarrollo
      ↓
CORTE (al 20% de apertura) → Hidratación (2 h, AVB)
      ↓
CÁMARA DE APERTURA (5–7 días, solución de apertura)
      ↓
POSTCOSECHA (clasificación, boncheo por peso, tratamiento anti-etileno, empaque)
      ↓
CUARTO FRÍO → Pallet → Guía / AWB
```

### 2.2 Cambio estructural: la unidad de medida

Este es el error que hunde el proyecto si se copia el modelo de rosa. En gypsophila **el tallo no es la unidad económica**; el gramo lo es. El modelo de datos debe manejar ambas y convertir entre ellas:

```sql
evento_proceso (
  lote_id, proceso, tipo_evento, ts,
  cantidad_tallos   int,      -- para control agronómico
  peso_gramos       numeric,  -- para control comercial  ← la que manda
  uom_principal     text,     -- 'g' en apertura y postcosecha
  ...
)
```

**Métrica derivada obligatoria:** `gramos por tallo` — es el indicador de calidad de volumen y esponjosidad de Polar Bear, y el que explica por qué dos lotes con igual conteo de tallos rinden distinto número de bonches.

### 2.3 Nuevas entidades

- `ciclo_productivo` — la unidad de planificación: cama + fecha de pinch + n.º de ciclo + estrategia (ciclo único con pinch a 5–6 pares vs. multiciclo con pinch a 3 pares)
- `programa_luz` — horas/noche, semanas acumuladas, fecha de inicio y corte de iluminación por cama, consumo kWh
- `camara_apertura` — cámara física, con lecturas continuas y lotes en residencia
- `lote_solucion` — trazabilidad de la preparación de soluciones: hidratante, de apertura, anti-etileno. Con lote, concentración, pH, conductividad, hora de preparación y hora de descarte
- `aplicacion_ga3` — cada aplicación de ácido giberélico, con dosis, fecha relativa al pinch y cobertura

`lote_solucion` parece un detalle operativo. No lo es: cuando un embarque llega con apertura irregular a destino, la pregunta es siempre "¿qué solución tenía ese lote?", y hoy nadie puede responderla.

---

## 3. Catálogo de indicadores

### 3.1 Propagación

| Indicador | Fórmula | Frec. |
|---|---|---|
| % de enraizamiento | esquejes enraizados / esquejes sembrados | S |
| Días a enraizamiento (p50/p90) | mediana por lote y época | S |
| Esquejes por planta madre por ciclo | esquejes aptos / plantas madre activas | M |
| Mortalidad en cámara de enraizamiento | plantas muertas / ingresadas | S |
| Sanidad del banco de madres | incidencia de minador de hoja y trips por bandeja evaluada | S |
| Vigor del esqueje | % de esquejes que cumplen calibre y n.º de hojas | S |
| Cumplimiento del programa | plantas listas / plantas planificadas para la ventana de siembra | S |
| Costo por planta apta | costo total / plantas aptas | M |

### 3.2 Siembra y desarrollo

| Indicador | Fórmula | Frec. |
|---|---|---|
| Densidad efectiva | plantas establecidas / m² de cama | M |
| % de prendimiento a campo (30 d) | plantas vivas d+30 / trasplantadas | M |
| Uniformidad del pinch | % de plantas pinchadas dentro de la ventana objetivo | S |
| **Adherencia al protocolo GA3** | aplicaciones realizadas dentro de la ventana (d+4 y d+11) / aplicaciones programadas | S |
| **Semanas de luz aplicadas** | semanas acumuladas por cama vs. protocolo (5–6 en Polar Bear) | S |
| **Costo energético de iluminación** | kWh / m² / ciclo, y kWh / kg exportado | M |
| Días pinch → cosecha | fecha de corte − fecha de pinch, por cama | ciclo |
| Uniformidad del ciclo | desviación estándar de la fecha de corte dentro de una cama | ciclo |
| Edad de la plantación | distribución de camas por número de ciclo acumulado | M |
| Incidencia de plagas | minador de hoja, trips: capturas por trampa y % de camas afectadas | S |

**Nota sobre la uniformidad del ciclo.** En gypsophila es más importante que en rosa. Una cama que madura dispersa obliga a múltiples pasadas de corte, encarece la mano de obra y satura la cámara de apertura de forma irregular. Es un KPI de eficiencia operativa disfrazado de indicador agronómico.

### 3.3 Apertura *(proceso reescrito por completo)*

El proceso más crítico y el que hoy no tiene datos. La flor se corta al 20% de apertura y permanece 5–7 días en cámara.

| Indicador | Fórmula | Frec. |
|---|---|---|
| **% de apertura al corte** | flores abiertas / flores totales en la inflorescencia | D |
| Cumplimiento del punto de corte | lotes cortados en 18–22% / lotes cortados | D |
| Tiempo corte → hidratación | ts entrada a solución − ts corte | T |
| Cumplimiento de hidratación previa | lotes con ≥ 2 h en solución hidratante antes de apertura / total | D |
| **Días en cámara de apertura** | ts salida − ts entrada | D |
| **Curva de apertura** | % de apertura medido por día de residencia | D |
| % de apertura al despacho | medición al salir de cámara | D |
| Uniformidad de apertura | desviación del % de apertura dentro del mismo lote | D |
| **Merma en apertura por causa** | Botrytis, deshidratación, apertura incompleta, sobreapertura, quema por solución | D |
| Temperatura y HR de cámara | serie continua | T |
| **Etileno ambiental en cámara** | ppm o ppb medidos | T |
| Trazabilidad de solución | % de lotes con `lote_solucion` registrado | D |
| Vida útil de la solución | horas desde preparación hasta descarte, y n.º de lotes procesados por solución | D |
| Ocupación de cámara | lotes en residencia / capacidad | D |
| Costo de apertura por kg | insumos + energía + mano de obra / kg que sale de cámara | M |

**Riesgo específico que este proceso debe vigilar:** la solución de apertura lleva azúcar en concentración alta (del orden de 50 g/l). Azúcar más humedad más temperatura es un medio de cultivo. Si la desinfección y el recambio de solución no se controlan, la cámara de apertura se convierte en un foco de Botrytis que arruina el lote completo en 48 horas. El KPI de vida útil de la solución no es burocracia; es prevención de pérdida total.

### 3.4 Postcosecha

| Indicador | Fórmula | Frec. |
|---|---|---|
| **% exportable en peso** | gramos exportables / gramos ingresados a postcosecha | D |
| **Rendimiento de boncheo** | bonches producidos / kg ingresado | D |
| Precisión de peso del bonche | % de bonches dentro de tolerancia del peso objetivo | D |
| **Sobrepeso regalado** | gramos entregados por encima del peso nominal × precio | D |
| **Cobertura de tratamiento anti-etileno** | lotes con STS o 1-MCP aplicado y verificado / lotes despachados | D |
| Concentración y tiempo de inmersión | valores registrados vs. protocolo | D |
| Merma por causa (Pareto) | tallos o gramos descartados por causa | D |
| Cajas por hectárea por semana | cajas despachadas / ha productiva | S |
| Fill rate / OTIF | pedidos completos y a tiempo / pedidos | D |
| Tasa de reclamo | USD reclamados / USD facturados, por causa y cliente | M |
| Productividad de mano de obra | kg procesados / hora-hombre | D |
| Costo de postcosecha por kg | costo del área / kg procesado | M |

**Sobrepeso regalado** merece énfasis. Es dinero que se pierde en silencio: si el bonche objetivo es de X gramos y el promedio real es 6% mayor, el cliente está regalando el 6% de su producción exportable y no aparece en ningún estado financiero. Un histograma de peso de bonche con la línea del nominal es de los gráficos que pagan el proyecto en la primera semana.

### 3.5 Cuarto frío

| Indicador | Fórmula | Frec. |
|---|---|---|
| Temperatura y HR | serie continua por cámara | T |
| **Etileno acumulado** | ppb·hora de exposición por lote | T |
| Excursiones térmicas | eventos fuera de rango por cada 1.000 envíos | D |
| Severidad de excursión | °C·min fuera de rango (área bajo la curva) | T |
| Tiempo de preenfriamiento | ts a temperatura objetivo − ts ingreso | T |
| Permanencia y cumplimiento FIFO | horas en cámara; % de pallets fuera de orden | D |
| Ocupación | pallets ocupados / capacidad | D |
| Eficiencia energética | kWh / tonelada almacenada | M |
| Tiempo de puerta abierta | minutos/día por cámara | D |
| **Vase life estimada** | modelo sobre etileno acumulado, excursión térmica, % de apertura y cobertura de STS | S |

Para gypsophila el **etileno es tan importante como la temperatura** — una diferencia sustantiva frente al diseño para rosa. Un sensor de etileno por cámara y un registro de la cobertura de tratamiento son requisitos, no opcionales.

### 3.6 Transversales

- **Yield bridge en gramos:** esquejes → plantas establecidas → kg cortados → kg que salen de apertura → kg exportados
- **Costo por kilogramo exportado**, abierto por proceso
- **Intensidad energética:** kWh totales (iluminación + apertura + frío) por kg exportado. Es el indicador de sostenibilidad más defendible que puede tener una finca de gypsophila, y encaja con certificación y con el discurso comercial en Europa
- **Riesgo de concentración varietal:** al ser monovarietal, un problema fitosanitario o una caída de precio de Polar Bear no tiene amortiguación. Un panel de alerta temprana sobre precio y demanda de la variedad es parte del tablero de gerencia, no un lujo

---

## 4. Visualizaciones que cambian

Se mantiene la biblioteca de v1.0, con estas sustituciones:

| Antes (rosa) | Ahora (gypsophila) |
|---|---|
| Área apilada de mix de largos | **Histograma de peso de bonche** con línea de nominal y zona de tolerancia |
| Serie continua de producción | **Gráfico de pulsos por ciclo**: barras por semana de cosecha, con la ventana proyectada superpuesta |
| Mix varietal | **Curva de apertura**: % de apertura vs. día de residencia en cámara, una línea por lote, con la banda del corredor objetivo |
| Boxplot de largos | **Boxplot de gramos por tallo**, por cama y ciclo |
| — | **Gantt de ocupación de cámara de apertura**: lotes en el eje Y, días en el eje X, color por % de apertura |
| — | **Termograma combinado temperatura + etileno** para cámara de apertura y cuarto frío |
| Waterfall de tallos | **Waterfall en kilogramos** (yield bridge) |

La **curva de apertura** es el gráfico distintivo de esta implementación. Hoy el jefe de postcosecha lleva ese criterio en la cabeza; graficarlo por lote, con el corredor objetivo, convierte conocimiento tácito en activo de la empresa.

---

## 5. Motor de proyecciones *(reescrito)*

La producción de gypsophila es **discreta y pulsante**, no un flujo continuo. Esto simplifica y complica a la vez: hay menos que predecir, pero cada error pesa más porque no hay diversificación varietal que promedie.

### 5.1 Corto plazo (0–14 semanas) — modelo determinista de ciclo

**Entradas:** fecha de pinch por cama, estrategia de pinch (3 vs. 5–6 pares de hojas), semanas de luz aplicadas y por aplicar, grados-día acumulados, densidad, historial de rendimiento de la cama.

**Método:** por cada cama con ciclo abierto se estima una **ventana de cosecha** (no una fecha) mediante:

```
fecha_cosecha ≈ f(fecha_pinch, semanas_luz, GDA acumulado, ciclo_n)
kg_esperados  ≈ area_m2 × densidad × tallos_planta(ciclo_n) × g_por_tallo(cama)
```

La agregación de todas las camas produce el **calendario de pulsos**: cuántos kilogramos entran a cámara de apertura cada semana. Salida en bandas p10/p50/p90.

**Esto es lo que el área comercial necesita para comprometer volumen.** En una finca monovarietal, saber con tres meses de anticipación qué semanas tendrán pico y qué semanas tendrán valle es la diferencia entre vender bien y liquidar a precio de mercado spot.

### 5.2 Planificación inversa — el módulo con mayor retorno

Invertir el modelo: dada una fecha objetivo de despacho (San Valentín, Día de la Madre por mercado, temporada de bodas), calcular hacia atrás la **fecha de pinch y la ventana de iluminación** requeridas.

```
fecha_pinch_requerida = fecha_objetivo − días_apertura − ciclo_estimado
semanas_luz           = protocolo_variedad ajustado por radiación esperada
```

Es un asistente de planificación, no solo un reporte. Cambia la relación del cliente con la herramienta: pasa de mirar lo que pasó a decidir lo que va a pasar.

### 5.3 Modelo de apertura
Predicción del **día de salida de cámara** por lote, a partir de % de apertura al ingreso, temperatura y HR de cámara, y lote de solución. Alimenta la planificación de personal de postcosecha con 48 h de anticipación y evita el cuello de botella clásico: cámara llena y postcosecha sin gente.

### 5.4 Modelo de calidad en destino
Vase life estimada = regresión sobre etileno acumulado, °C·min de excursión, % de apertura al despacho y cobertura de tratamiento anti-etileno. Se valida contra pruebas de florero propias y contra reclamos reales de cliente. Con dos temporadas de datos, es un argumento de venta verificable.

### 5.5 Gobierno del modelo
Backtesting con ventana deslizante. Umbrales sugeridos de MAPE para publicación: 10% a 4 semanas, 18% a 12 semanas. Toda proyección se muestra con banda, nunca como punto. Cada predicción emitida se archiva para poder auditar el acierto contra el resultado real.

---

## 6. Arquitectura técnica

Se mantiene íntegra la de v1.0 (ingesta desacoplada por CDC, medallón sobre PostgreSQL + TimescaleDB, dbt, capa semántica en YAML, `metrics-api` sin SQL libre expuesto, `render-service`, `alert-engine`, `nlu-service`, bot en modo webhook, Mini App con validación HMAC de `initData`, Redis para estado y colas).

**Adiciones propias de gypsophila:**

**Sensórica ampliada.** Además de temperatura y HR: sensores de **etileno** en cámara de apertura y cuarto frío, medidor de energía por circuito de iluminación, y luxómetro o contador de horas por sector de luz. Es la inversión de hardware que este cambio de cultivo hace obligatoria.

**Visión por computador para el % de apertura.** Hoy el porcentaje de apertura se estima a ojo, con variación entre evaluadores del 10–15 puntos. Una foto desde el celular del supervisor, subida por la Mini App, procesada por un modelo de segmentación que cuenta flores abiertas sobre flores totales, convierte una apreciación subjetiva en una serie de tiempo confiable. Es el componente de IA aplicada con retorno más claro del proyecto — y el que hace que la analítica de la cámara de apertura sea posible, porque sin medición objetiva no hay curva que graficar.

Ruta técnica sugerida: partir con un modelo ligero tipo YOLO o SAM afinado con 500–1.000 imágenes etiquetadas por el equipo de calidad del cliente; ejecución en el servidor, no en el dispositivo, para poder reentrenar sin redesplegar. Fase 4 del roadmap, no fase 1 — necesita datos etiquetados que hoy no existen.

**Captura en cámara.** La cámara de apertura es un ambiente húmedo y frío. La captura de datos debe hacerse desde la Mini App en un dispositivo protegido, con formularios de tres campos y funcionamiento sin conexión con sincronización diferida. Si la captura toma más de veinte segundos, no se hace, y el módulo se queda sin su dato más valioso.

---

## 7. Diseño conversacional

Cambian los comandos y sobre todo el reporte push.

```
/hoy          Cierre del día: kg cortados, en apertura, exportados
/ciclos       Estado de camas: pinch, luz, cosecha proyectada
/apertura     Cámaras, curva de apertura, lotes por salir
/calidad      % exportable, peso de bonche, Pareto de merma
/frio         Temperatura, etileno, excursiones, FIFO
/proyeccion   Calendario de pulsos con bandas
/planificar   Planificación inversa desde fecha objetivo
/definicion   Fórmula y linaje de cualquier KPI
```

**Alertas de mayor valor**, en orden de urgencia:

1. Lote que supera el tiempo objetivo corte → hidratación
2. Etileno en cámara de apertura sobre umbral
3. Lote cuya curva de apertura se desvía del corredor (riesgo de llegar sobreabierto o cerrado a destino)
4. Solución de apertura que excede su vida útil
5. Peso promedio de bonche fuera de tolerancia por más de dos horas de turno
6. Cama sin la aplicación de GA3 dentro de la ventana del protocolo
7. Excursión térmica en cuarto frío

Las tres primeras son accionables en menos de una hora y con impacto económico directo. Son las que hacen que el operativo mantenga el bot abierto — y la adopción del operativo es lo que sostiene el proyecto cuando termina el entusiasmo inicial de gerencia.

**Ejemplo de respuesta:**

```
[Gantt de ocupación de cámara]

*Cámara de apertura 2 — día 4*
6 lotes en residencia · 1.840 kg
Lote GP-0912 va 8 pts bajo el corredor: 34% vs. 42% esperado.
A este ritmo sale el día 8, no el día 6.
Etileno: 0,4 ppm (normal). Temp: 19,2 °C.

[Ver curva del lote] [Histórico de la cámara] [Reprogramar salida]
[Abrir tablero ↗]
```

---

## 8. Hoja de ruta ajustada

| Fase | Duración | Alcance | Criterio de salida |
|---|---|---|---|
| **0 — Descubrimiento** | 2–3 sem | Protocolo real de Polar Bear en esta finca vs. ficha técnica; diccionario de causas de merma; auditoría del origen | Catálogo de KPIs firmado |
| **1 — Cimientos** | 4 sem | Ingesta, medallón, capa semántica; KPIs de Postcosecha y Cuarto Frío en gramos | Los números cuadran con los reportes actuales del cliente |
| **2 — Bot v1** | 3 sem | Push matutino, menús, alertas de frío y etileno | 80% de usuarios objetivo activos en 2 semanas |
| **3 — Apertura instrumentada** | 4 sem | Sensórica de cámara, captura móvil, curva de apertura, trazabilidad de soluciones | Curva de apertura viva para el 100% de lotes |
| **4 — Campo y ciclos** | 5 sem | Propagación, siembra, programa de luz, GA3, yield bridge en kg | Los 5 procesos con KPIs vivos |
| **5 — Proyecciones** | 4 sem | Calendario de pulsos, planificación inversa, fan charts | MAPE dentro de umbral a 4 semanas |
| **6 — Visión e IA** | 5 sem | Modelo de % de apertura por imagen; NLU; Mini App | Concordancia del modelo con el evaluador experto > 90% |

**Cambio de orden respecto de v1.0:** Apertura sube a la fase 3, antes de campo. Es donde está el valor no capturado y donde el cliente ve el diferencial más rápido. Propagación sigue siendo el último proceso de campo por la misma razón de antes: es el que peor calidad de dato tiene en cualquier finca.

---

## 9. Riesgos nuevos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| El % de apertura se sigue midiendo a ojo y la curva no es confiable | Alta | Protocolo de evaluación estandarizado desde fase 3; visión por computador en fase 6 |
| Sin sensórica de etileno, el KPI de calidad en destino no se puede construir | Alta | Cotizar sensores en fase 0; sin ellos, el modelo de vase life no se promete |
| Monovarietal: un evento fitosanitario o de precio compromete el negocio completo | Media | Panel de alerta temprana sobre incidencia y precio de la variedad |
| El protocolo real difiere de la ficha técnica de la casa obtentora | Alta | Fase 0 documenta el protocolo real; los umbrales se parametrizan, no se codifican |
| Ambiente de cámara daña dispositivos de captura | Media | Equipos con protección IP, formularios cortos, sincronización diferida |
| Costo energético de iluminación sin medición por circuito | Media | Medidores dedicados; sin ellos el KPI se estima y pierde credibilidad |

---

## 10. Lo que necesito confirmar antes de cotizar

1. **Estrategia de ciclo:** ¿pinch a 3 pares (multiciclo) o a 5–6 pares (ciclo único)? Define el modelo de proyección completo.
2. **¿Cuántas cámaras de apertura hay y qué instrumentación tienen hoy?** Es la variable de mayor impacto en presupuesto y alcance.
3. **Peso nominal del bonche y tolerancia comercial** por cliente y mercado.
4. **¿Se hace tratamiento anti-etileno hoy?** ¿STS, 1-MCP, ninguno? ¿Se registra?
5. **¿La iluminación tiene medición eléctrica independiente?**
6. **¿Hay línea de teñido o valor agregado?** Añadiría un sexto proceso al modelo.
7. **¿Producción monovarietal estricta o hay otras variedades y cultivos?**
8. Motor y versión de la base del sistema actual; posibilidad de réplica de solo lectura.
9. Certificaciones vigentes o buscadas — sus indicadores obligatorios conviene incorporarlos desde el diseño.

---

*Documento de arquitectura — v2.0 · gypsophila Polar Bear*
