# REGISTRO DE INSTALACIÓN EN PRODUCCIÓN (2026-09-27)

> ⚠️ **¡ATENCIÓN A CUALQUIER AGENTE, SISTEMA O DESARROLLADOR!** 
> **NO SOBRESCRIBIR, NO FORMATEAR NI MODIFICAR ESTE SERVIDOR SIN AUTORIZACIÓN EXPLÍCITA Y PREVIA.**
> Este servidor contiene el sistema ERP Hidroluz completamente funcional, hardened y en entorno de Producción real.

---

## 1. Datos del Servidor y Acceso

- **Dominio Público:** `https://app.hidroluz.nexaflow-ia.com`
- **IP Pública:** `34.122.229.177`
- **Usuario SSH:** `mlogacho`
- **Llave de Autorización Local:** `~/.ssh/hidroluz_agent`
- **Ruta de la App en Servidor:** `/home/mlogacho/hidroluz-next`

## 2. Configuración de Seguridad y Hardening Aplicado

Para evitar la infección del virus "Kinsing" o vulnerabilidades futuras, se ha configurado estrictamente:
- **Firewall (UFW + GCP VPC):** Sólo tráfico entrante en los puertos `22` (SSH), `80` (HTTP) y `443` (HTTPS) está abierto. Todo el resto está por defecto en **DENY**.
- **PostgreSQL Blindado:** Se modificó `postgresql.conf` para forzar `listen_addresses = 'localhost'`. El puerto `5432` no es accesible desde internet.
- **Fail2Ban:** Configurado y activo para prevenir fuerza bruta SSH.

## 3. Base de Datos (PostgreSQL)
- **Base de datos:** `hidroluz_db`
- **Dueño y Privilegios:** El usuario `hidroluz` fue establecido como owner y se le otorgaron permisos explícitos en el schema `public` (`ALTER SCHEMA public OWNER TO hidroluz`).
- **Problema Conocido Solucionado (Parsing Bash):** Al definir el `password_hash` con caracteres especiales (`$#`) se forzó el uso de sentencias SQL crudas sin interpolación, porque bash detectaba `$#` como argumentos, truncando contraseñas.
- **Backup Restaurado:** Se subió con éxito un `.sql` completo del día 2026-08-19.

## 4. Next.js (Standalone) y PM2
- El código se sube empaquetado y se ejecuta `npm run build`.
- Se copiaron manualmente las carpetas `public/` y `.next/static/` dentro de `.next/standalone/` como requiere Next.js Standalone, o la interfaz carecerá de CSS/assets.
- **Gestor de procesos:** El servicio se levantó usando `pm2` bajo el nombre `hidroluz-erp`. PM2 está vinculado a `systemd` y arranca junto con el sistema.
- Para ver logs en el servidor, ejecuta: `pm2 logs hidroluz-erp`

## 5. Proxy Inverso y SSL (Nginx + Certbot)
- Se generó el archivo de configuración en `/etc/nginx/sites-available/hidroluz`.
- **Certificado SSL:** Let's Encrypt / Certbot (`certbot --nginx`). Se renueva de forma automática.
- **Cabeceras obligatorias para NextAuth:**
  ```nginx
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  ```
  *(Si faltan, NextAuth redirige a http://localhost:3000 de forma errática)*.

## 6. Credenciales de Ingreso

- Las contraseñas de acceso al frontend de **todos los usuarios del sistema** fueron reestablecidas en la FASE 6 a la contraseña segura de recuperación de emergencia estandarizada: `H!dr0luz_2026$#S3c`

---
*Cualquier despliegue futuro debe empaquetar el código, enviarlo, realizar npm run build localmente en el servidor, mover los archivos estáticos a `.next/standalone`, y usar `pm2 restart hidroluz-erp`.*
