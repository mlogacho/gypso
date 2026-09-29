# Arquitectura del Servidor y Guía para Despliegue de Nuevas Apps

Este documento detalla cómo está desplegado actualmente el **ERP Luki** en el servidor de producción (`34.59.113.130`) y establece las reglas de oro para **desplegar nuevas aplicaciones en el mismo servidor SIN dañar ni sobrescribir** el ERP existente (`erp.luki.ec`).

---

## 1. Arquitectura Actual del ERP Luki

El servidor funciona bajo un modelo de proxy inverso con múltiples procesos en segundo plano. Los recursos clave que **NO deben ser alterados** son los siguientes:

### A. Sistema de Archivos (Directorios)
- `/home/mlogacho/frontend/`: Contiene el código compilado de Next.js.
- `/home/mlogacho/backend/`: Contiene el código compilado de NestJS.
- `/home/mlogacho/telegram-bot/`: Contiene el bot de Python y su entorno virtual (`venv`).
> **Regla:** Cualquier aplicación nueva debe alojarse en su propio directorio (ej. `/home/mlogacho/mi-nueva-app/`). ¡NUNCA subas archivos a los directorios del ERP!

### B. Gestor de Procesos (PM2)
Actualmente, PM2 mantiene vivos tres procesos vitales para el ERP. Puedes verlos ejecutando `pm2 status`:
- `luki-frontend` (id: 1) -> Ocupando el puerto **3000**
- `luki-backend` (id: 0) -> Ocupando el puerto **4000**
- `luki-bot` (id: 2) -> Proceso en background (Python)
> **Regla:** Cuando agregues una nueva app a PM2, dale un nombre descriptivo y único (ej. `pm2 start npm --name "nueva-app" -- start`). **¡NUNCA EJECUTES `pm2 kill` NI `pm2 delete all`!** Si necesitas reiniciar la nueva app, hazlo por su nombre: `pm2 restart nueva-app`.

### C. Base de Datos (PostgreSQL)
- **Motor:** PostgreSQL 17 + PostGIS.
- **Puerto:** `5432` (restringido a `localhost` por seguridad).
- **Base de Datos del ERP:** `luki_erp`
> **Regla:** Si tu nueva aplicación requiere base de datos, **debes crear una base de datos nueva** (`CREATE DATABASE nueva_app_db;`) y preferiblemente un usuario nuevo. NO insertes tablas extrañas en `luki_erp`.

### D. Proxy Inverso (Nginx) y Dominios
- Nginx recibe todo el tráfico externo de los puertos **80 (HTTP)** y **443 (HTTPS)**.
- La configuración del ERP vive de forma aislada en `/etc/nginx/sites-available/erp.luki.ec`.
- Esta configuración enruta las peticiones de `erp.luki.ec/api` al puerto **4000** y el resto del tráfico al puerto **3000**.
> **Regla:** NUNCA modifiques el archivo de configuración `erp.luki.ec`. Para exponer una nueva aplicación a internet, debes crear un **nuevo archivo de bloque de servidor** en Nginx (ver Paso 2).

---

## 2. Cómo desplegar una NUEVA APP paso a paso

Si vas a subir un nuevo proyecto (ej. `mi-nueva-web.com`) al mismo servidor, sigue este flujo rigurosamente:

### Paso 2.1: Asignación de Puertos Internos
Ya sabemos que los puertos 3000 y 4000 están ocupados por el ERP. 
- Asigna un nuevo puerto a tu nueva app (ej. **3001**, **3005**, **5000**).
- Asegúrate de configurarlo en las variables de entorno de tu nueva app (`PORT=3001`).

### Paso 2.2: Subida de Código
Crea una carpeta nueva en el servidor y sube el código allí usando `rsync`:
```bash
# Ejemplo subiendo desde tu máquina local
rsync -avz --exclude 'node_modules' ./mi-nueva-app mlogacho@34.59.113.130:~/mi-nueva-app/
```

### Paso 2.3: Levantar la App con PM2
Entra al servidor, instala las dependencias de la nueva app y levántala con un nombre único:
```bash
cd ~/mi-nueva-app
npm install
npm run build
# Levantar en PM2 con un nombre claro
pm2 start npm --name "mi-nueva-app" -- start
# Guardar la lista de PM2 para que arranque en el reinicio
pm2 save
```

### Paso 2.4: Configurar el Proxy Inverso (Nginx) para el Nuevo Dominio
Para que el mundo exterior pueda acceder a tu nueva app, no toques la configuración de Luki. Crea una nueva:

1. Crea un nuevo archivo en Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/mi-nueva-web.com
   ```
2. Agrega la configuración enrutando al nuevo puerto (ej. 3001):
   ```nginx
   server {
       listen 80;
       server_name mi-nueva-web.com www.mi-nueva-web.com;

       location / {
           proxy_pass http://localhost:3001; # <--- TU NUEVO PUERTO AQUÍ
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Activa la configuración creando el enlace simbólico:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mi-nueva-web.com /etc/nginx/sites-enabled/
   ```
4. Prueba y reinicia Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Paso 2.5: Certificado SSL (Opcional)
Si quieres HTTPS para tu nueva app, usa Certbot especificando **solo tu nuevo dominio**. Certbot detectará el nuevo archivo de Nginx automáticamente:
```bash
sudo certbot --nginx -d mi-nueva-web.com -d www.mi-nueva-web.com
```

---

## 3. ⚠️ Monitoreo Crítico del Disco Duro

Debido a que estás alojando múltiples aplicaciones en un servidor con **recursos limitados (Disco de 10 GB a 30 GB)**, el problema principal al que te enfrentarás es que los logs de ambas aplicaciones llenen el disco. 

Si el disco llega al 100%, **TODAS LAS APLICACIONES (incluyendo el ERP Luki y la Base de Datos) COLAPSARÁN al mismo tiempo**.

**Comando rápido para verificar tu espacio:**
```bash
df -h /
```
Si ves que está arriba del 85%, limpia los logs inmediatamente o expande el disco en GCP.
