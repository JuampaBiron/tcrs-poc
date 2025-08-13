# TCRS Invoice Approval System 🏗️

Una aplicación web que permite gestionar solicitudes de aprobación de facturas con diferentes roles de usuario y flujos de trabajo automatizados.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** Neon PostgreSQL
- **ORM:** Drizzle ORM
- **Autenticación:** NextAuth.js

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.0 o superior ([Descargar aquí](https://nodejs.org/))
- **npm** o **yarn** (viene con Node.js)
- Una cuenta en **Neon** ([Registrarse aquí](https://neon.tech/))

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd tcrs-poc
```

### 2. Instalar dependencias
```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local

# Editar el archivo .env.local con tus credenciales
nano .env.local
```

### 4. Configurar `.env.local`
```env
# Base de Datos Neon PostgreSQL
DATABASE_URL="postgresql://[username]:[password]@[hostname]/[database]?sslmode=require"

# NextAuth Configuration
NEXTAUTH_SECRET="tu-secret-super-seguro-aqui"

# Microsoft Azure AD (Opcional)
AZURE_AD_CLIENT_ID="tu-client-id"
AZURE_AD_CLIENT_SECRET="tu-client-secret" 
AZURE_AD_TENANT_ID="tu-tenant-id"
```

### 5. Configurar Base de Datos

#### Opción A: Crear base de datos en Neon
1. Ve a [Neon Console](https://console.neon.tech/)
2. Crea un nuevo proyecto
3. Copia la cadena de conexión
4. Pégala en `DATABASE_URL` en tu `.env.local`

#### Opción B: Usar base de datos existente
Si ya tienes una base de datos PostgreSQL, asegúrate de que esté accesible y actualiza la `DATABASE_URL`.

### 6. Ejecutar migraciones y sembrar datos
```bash
# Verificar conexión a la base de datos
node scripts/test-db.js

# Sembrar datos de ejemplo
npm run db:seed
# o alternativamente:
node src/db/simple-seed.js
```

### 7. Ejecutar en desarrollo
```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📚 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar build de producción
npm run lint         # Ejecutar ESLint

# Base de Datos
npm run db:seed      # Sembrar datos de ejemplo
node scripts/test-db.js  # Verificar conexión DB

# Utilidades
npm run type-check   # Verificar tipos TypeScript
```

## 🏗️ Estructura del Proyecto

```
tcrs-poc/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── api/               # API Routes
│   │   │   ├── requests/      # Gestión de solicitudes
│   │   │   ├── stats/         # Estadísticas
│   │   │   └── export/        # Exportar datos
│   │   ├── dashboard/         # Dashboard principal
│   │   └── page.tsx           # Página de login
│   ├── components/            # Componentes React
│   │   ├── dashboard/         # Componentes del dashboard
│   │   └── login-page/        # Componentes de login
│   ├── db/                    # Base de datos
│   │   ├── schema.ts          # Esquema Drizzle
│   │   ├── queries.ts         # Consultas DB
│   │   └── seed.ts            # Datos de ejemplo
│   └── lib/                   # Utilidades
├── scripts/                   # Scripts de utilidad
├── public/                    # Archivos estáticos
└── README.md
```

## 👥 Roles de Usuario

### 🙋‍♂️ Requester (Solicitante)
- **Email:** `test@sisuadigital.com`
- **Permisos:** Crear solicitudes, ver sus propias solicitudes
- **Dashboard:** Muestra sus solicitudes y estadísticas personales

### ✅ Approver (Aprobador)
- **Email:** `manager1@sisuadigital.com`, `manager2@sisuadigital.com`, `manager3@sisuadigital.com`
- **Permisos:** Aprobar/rechazar solicitudes asignadas
- **Dashboard:** Muestra solicitudes pendientes de aprobación

### 👑 Admin (Administrador)
- **Email:** `admin@sisuadigital.com`
- **Permisos:** Ver todas las solicitudes, estadísticas globales
- **Dashboard:** Vista completa del sistema

## 🔧 Troubleshooting

### Error: "DATABASE_URL not found"
```bash
# Verificar que existe el archivo .env.local
ls -la .env.local

# Verificar contenido
cat .env.local
```

### Error: "Connection timeout" o "Database not accessible"
```bash
# Probar conexión
node scripts/test-db.js

# Verificar que Neon DB esté activo
# Ve a Neon Console y verifica el estado
```

### Error: "No tables found"
```bash
# Ejecutar seed para crear tablas y datos
npm run db:seed
```

### Error: TypeScript en desarrollo
```bash
# Verificar tipos
npm run type-check

# Limpiar cache de Next.js
rm -rf .next
npm run dev
```

### Puerto 3000 ocupado
```bash
# Ejecutar en puerto diferente
PORT=3001 npm run dev
```

## 🌐 Deployment

### Vercel (Recomendado)
1. Push tu código a GitHub
2. Conecta tu repo en [Vercel](https://vercel.com)
3. Configura las variables de entorno en Vercel
4. Deploy automático ✨

### Variables de entorno para producción:
- `DATABASE_URL` (Neon production DB)
- `NEXTAUTH_SECRET` (secreto único)
- `NEXTAUTH_URL` (tu dominio de producción)

## 📞 Soporte

### Desarrolladores:
- **Sisua Digital** - [www.sisuadigital.com](https://www.sisuadigital.com)

### Issues comunes:
1. **Base de datos:** Verificar `DATABASE_URL` y conectividad
2. **Autenticación:** Verificar `NEXTAUTH_SECRET` y configuración
3. **Tipos TypeScript:** Ejecutar `npm run type-check`

### Logs útiles:
```bash
# Ver logs de desarrollo
npm run dev -- --verbose

# Ver logs de base de datos
node scripts/test-db.js
```

## 📝 Notas Adicionales

- El proyecto usa **App Router** de Next.js 13+
- La base de datos se auto-migra en el primer uso
- Los datos de ejemplo se cargan automáticamente
- Configuración de roles basada en email domains

---

