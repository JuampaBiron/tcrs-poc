

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



## 📝 Notas Adicionales

- El proyecto usa **App Router** de Next.js 13+
- La base de datos se auto-migra en el primer uso
- Los datos de ejemplo se cargan automáticamente
- Configuración de roles basada en email domains

---
