# REGISTRO DE INSTALACIÓN EN PRODUCCIÓN: ACELERACIÓN WEB (2026-09-27)

> ⚠️ **¡ATENCIÓN A CUALQUIER AGENTE, SISTEMA O DESARROLLADOR!** 
> **NO SOBRESCRIBIR NI REEMPLAZAR LA CONFIGURACIÓN DE ESTE DOMINIO NI SU BASE DE DATOS SIN AUTORIZACIÓN.**
> Este proyecto convive en paralelo con el ERP Hidroluz en el mismo servidor. ¡Cualquier cambio brusco (como resetear PM2 o Nginx por completo) puede afectar a ambas plataformas!

---

## 1. Datos del Servidor y Acceso

- **Dominio Público:** `https://aceleracion.nexaflow-ia.com`
- **IP Pública (Compartida con Hidroluz):** `34.122.229.177`
- **Usuario SSH:** `mlogacho`
- **Llave de Autorización Local:** `~/.ssh/hidroluz_agent`
- **Ruta de la App en Servidor:** `/home/mlogacho/aceleracion-web`

## 2. Configuración de la Aplicación y PM2

- El proyecto actual es **puramente Frontend (React/Vite)** y produce un sitio web estático.
- Se compila localmente usando `npm run build` o `npx vite build`.
- Los archivos resultantes de la carpeta `dist/` se transfieren por SSH a la ruta de la app en el servidor.
- **Gestor de procesos:** El servicio estático se mantiene activo en PM2 utilizando el paquete `serve`.
- **Nombre en PM2:** `aceleracion-app`
- **Puerto Interno:** `3002`

*Para reiniciar o ver logs de la app en el servidor, ejecuta:*
`pm2 restart aceleracion-app`
`pm2 logs aceleracion-app`

## 3. Base de Datos (PostgreSQL)

Aunque la aplicación actual es estática, se dejó provisionada una base de datos 100% independiente para un eventual backend:
- **Base de datos:** `aceleracion_db`
- **Usuario:** `aceleracion_user`
- **Permisos:** El usuario `aceleracion_user` es el dueño del esquema `public` de su base de datos.
- **Seguridad:** Al igual que con Hidroluz, la base de datos sólo escucha conexiones locales (localhost:5432).

## 4. Proxy Inverso y SSL (Nginx + Certbot)

- Se generó el archivo de configuración exclusivo en `/etc/nginx/sites-available/aceleracion`.
- Se configuró el puerto `3002` como destino del proxy inverso.
- **Certificado SSL:** Let's Encrypt / Certbot (`certbot --nginx -d aceleracion.nexaflow-ia.com`). Se renueva de forma automática.
- Las cabeceras críticas para reenviar IPs y protocolos (`X-Forwarded-For`, `X-Real-IP`, etc.) están activas en este bloque.

---
*Cualquier futuro despliegue del frontend debe compilarse localmente y subirse directamente a `/home/mlogacho/aceleracion-web`, respetando el proceso de PM2 actual.*
