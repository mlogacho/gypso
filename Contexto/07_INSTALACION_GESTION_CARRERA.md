# REGISTRO DE INSTALACIÓN EN PRODUCCIÓN - GESTIÓN DE CARRERA (2026-09-27)

> ⚠️ **¡ATENCIÓN A CUALQUIER AGENTE, SISTEMA O DESARROLLADOR!** 
> **NO SOBRESCRIBIR, NO MODIFICAR NI ELIMINAR ESTA APLICACIÓN SIN AUTORIZACIÓN.**
> Este servidor (IP: `34.122.229.177`) es un entorno consolidado y compartido. Altera cualquiera de estas configuraciones bajo tu propio riesgo.

---

## 1. Datos de la Aplicación y Acceso

- **Aplicación:** Gestión de Carrera (Eleva Assessment)
- **Dominio Público:** `https://gestioncarrera.nexaflow-ia.com`
- **IP del Servidor:** `34.122.229.177`
- **Usuario SSH:** `mlogacho`
- **Llave de Autorización Local:** `~/.ssh/hidroluz_agent`
- **Ruta de la App en Servidor:** `/home/mlogacho/gestioncarrera`
- **Puerto Interno (PM2):** `3001`

---

## 2. Prevención de Conflictos en el Servidor (¡IMPORTANTE!)

Este servidor aloja múltiples aplicaciones simultáneas. **Es vital mantener el aislamiento.**

| Aplicación | Puerto Local | Base de Datos (PostgreSQL) | Proceso PM2 |
| :--- | :--- | :--- | :--- |
| Hidroluz ERP | 3000 | `hidroluz_db` | `hidroluz-erp` |
| **Gestión Carrera** | **3001** | **`gestioncarrera_db`** | **`gestioncarrera`** |
| Aceleración App | 3002 | *[Aislada]* | `aceleracion-app` |

**Bajo ninguna circunstancia debes:**
1. Reiniciar `pm2` afectando a todos los procesos (Usa siempre `pm2 restart gestioncarrera`).
2. Utilizar el puerto `3000` o `3002`.
3. Sobrescribir la configuración global de Nginx; usa un archivo de bloque `server` independiente en `/etc/nginx/sites-available/gestioncarrera`.

---

## 3. Base de Datos (PostgreSQL)

- **Base de datos:** `gestioncarrera_db`
- **Usuario / Owner:** `gestioncarrera`
- **Aislamiento:** La base de datos es gestionada localmente (`localhost:5432`) usando el usuario dedicado con permisos limitados a su propia base de datos.
- **ORM:** Prisma (`npx prisma db push`).

---

## 4. Despliegue y Mantenimiento (Next.js + PM2)

El código se sube al servidor (sin `node_modules` ni `.next`) y se compila localmente.

**Comandos para actualizar en el futuro:**
```bash
cd ~/gestioncarrera
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart gestioncarrera
```

## 5. Proxy Inverso y SSL (Nginx + Certbot)
- **Archivo Nginx:** `/etc/nginx/sites-available/gestioncarrera`
- **SSL:** Certbot Let's Encrypt, auto-renovable.
- Las cabeceras críticas para la correcta lectura de IPs y protocolos (`X-Forwarded-For`, `X-Forwarded-Proto`, etc.) están activas en Nginx.
