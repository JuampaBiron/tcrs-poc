# TCRS - Sistema de Seguimiento de Solicitudes de Construcción

Este es un proyecto [Next.js](https://nextjs.org) para el sistema TCRS (Sistema de Seguimiento de Solicitudes de Construcción) con autenticación Microsoft Entra ID y gestión de roles.

## 🚀 Configuración de Entorno

### Variables de Entorno Requeridas

#### 1. Autenticación NextAuth

```env
AUTH_SECRET="tu_secret_aleatorio_aqui"
AUTH_MICROSOFT_ENTRA_ID_ID="tu_microsoft_client_id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="tu_microsoft_client_secret"
```

#### 2. Base de Datos

```env
DATABASE_URL="tu_string_conexion_postgresql"
```

#### 3. **NUEVAS** Variables de Seguridad

##### Dominios Permitidos (CRÍTICO)
```env
# Dominios de email permitidos para autenticación (separados por comas)
ALLOWED_EMAIL_DOMAINS=@sisuadigital.com,@ejemplo.com
```

**⚠️ IMPORTANTE:** Esta variable reemplaza el hardcoding anterior y es **obligatoria**. Sin ella, la autenticación fallará.

##### Configuración de Roles
```env
# Emails específicos para roles de administrador (separados por comas)
ADMIN_EMAILS=admin@sisuadigital.com,administrator@sisuadigital.com

# Emails específicos para roles de aprobador (separados por comas)
APPROVER_EMAILS=manager@sisuadigital.com,approver@sisuadigital.com
```

#### 4. Configuración de Entorno

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuración Paso a Paso

#### Paso 1: Copiar Variables de Entorno

```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env

# 2. Edita el archivo .env con tus valores reales
```

#### Paso 2: Configurar Dominios Permitidos

Reemplaza `@sisuadigital.com` con tu(s) dominio(s) organizacional(es):

```env
# Para un solo dominio
ALLOWED_EMAIL_DOMAINS=@miempresa.com

# Para múltiples dominios
ALLOWED_EMAIL_DOMAINS=@miempresa.com,@subsidiaria.com,@partner.com
```

#### Paso 3: Configurar Roles de Usuario

Define emails específicos para cada rol:

```env
# Administradores - acceso completo al sistema
ADMIN_EMAILS=ceo@miempresa.com,admin@miempresa.com,ti@miempresa.com

# Aprobadores - pueden aprobar/rechazar solicitudes
APPROVER_EMAILS=gerente@miempresa.com,supervisor@miempresa.com,finanzas@miempresa.com
```

#### Paso 4: Verificar Configuración

```bash
# Ejecuta el build para verificar que no hay errores
npm run build

# Inicia el servidor de desarrollo
npm run dev
```

## 🔧 Getting Started

Después de configurar las variables de entorno, ejecuta el servidor de desarrollo:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## ✅ Verificación de Funcionamiento

### Test de Autenticación por Dominio

1. **Acceso Permitido**: Usuarios con emails `@dominio-configurado.com` podrán autenticarse
2. **Acceso Denegado**: Usuarios con otros dominios serán rechazados
3. **Logs**: Los rechazos aparecerán en la consola del servidor

### Test de Roles

1. **Admin**: Emails en `ADMIN_EMAILS` tendrán permisos completos
2. **Approver**: Emails en `APPROVER_EMAILS` podrán aprobar requests
3. **Requester**: Todos los demás usuarios autenticados serán requesters

## 🔒 Mejoras de Seguridad Implementadas

### Antes (Hardcoded - INSEGURO)
```typescript
// ❌ Hardcoded en el código fuente
const allowedDomains = ['@sisuadigital.com']
```

### Después (Configurable - SEGURO)
```typescript
// ✅ Configurable por environment
const allowedDomainsEnv = process.env.ALLOWED_EMAIL_DOMAINS
const allowedDomains = allowedDomainsEnv.split(',')
```

## ⚡ Beneficios de la Nueva Configuración

1. **Seguridad**: No más secrets en el código fuente
2. **Flexibilidad**: Fácil cambio de configuración sin redeploy
3. **Multi-tenant**: Soporte para múltiples dominios
4. **Auditabilidad**: Logs de acceso denegado
5. **Escalabilidad**: Roles configurables por environment

## 🚨 Troubleshooting

### Error: "ALLOWED_EMAIL_DOMAINS environment variable not configured"

**Causa**: La variable `ALLOWED_EMAIL_DOMAINS` no está definida en `.env`

**Solución**:
```env
# Añade esta línea a tu archivo .env
ALLOWED_EMAIL_DOMAINS=@tudominio.com
```

### Error: "Sign-in rejected for domain"

**Causa**: El dominio del usuario no está en la lista permitida

**Solución**:
1. Verifica el dominio del usuario en los logs
2. Añade el dominio a `ALLOWED_EMAIL_DOMAINS`

### Usuario no tiene permisos correctos

**Causa**: El email no está en las listas de roles específicos

**Solución**:
```env
# Añade el email a la lista correspondiente
ADMIN_EMAILS=usuario@empresa.com,admin@empresa.com
APPROVER_EMAILS=manager@empresa.com,supervisor@empresa.com
```

## 📚 Recursos Adicionales

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Microsoft Entra ID Setup](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**✅ Estado**: Configuración completada y verificada  
**📅 Fecha**: Agosto 2025  
**🔧 Versión**: TCRS v0.1.0
