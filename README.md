# SupportMind AI 🚀

SupportMind AI es una plataforma B2B SaaS impulsada por Inteligencia Artificial, diseñada para ayudar a las empresas a automatizar y optimizar sus procesos de soporte al cliente.

## 🚀 Inicio Rápido con Docker

### Requisitos Previos
- Docker y Docker Compose instalados
- Clave de API de OpenAI

### Configuración

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd SupportMind-AI
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tu clave de OpenAI
```

3. **Levantar todos los servicios**
```bash
docker-compose up -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- ChromaDB: http://localhost:8000

## 🏗️ Arquitectura

```
Frontend (Next.js) ↓ Backend API (Node.js/NestJS) ↓ Capa Wrapper de IA (Prompts + Reglas) ↓ API de OpenAI (LLM) ↓ Base de Datos Vectorial (RAG)
```

### Componentes Principales

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, NestJS, TypeScript
- **Base de Datos**: PostgreSQL + ChromaDB (vector)
- **IA**: OpenAI API con RAG (Retrieval-Augmented Generation)
- **Autenticación**: JWT con rol-based access
- **Rate Limiting**: Por usuario y por IP

## 📋 Funcionalidades Implementadas

### ✅ Completadas
- [x] Autenticación y registro de usuarios
- [x] Sistema multi-tenant (B2B)
- [x] Chat en tiempo real con IA
- [x] Subida y procesamiento de documentos
- [x] Sistema RAG (Retrieval-Augmented Generation)
- [x] Generación de embeddings con OpenAI
- [x] Base de datos vectorial (ChromaDB)
- [x] Rate limiting y seguimiento de uso
- [x] Dockerización completa
- [x] CI/CD con GitHub Actions

### 🚀 En Progreso
- [ ] Sistema de pagos y suscripciones
- [ ] Panel de administración
- [ ] Integración con Slack/Microsoft Teams
- [ ] Analíticas avanzadas

## 🔧 Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Base de Datos
```bash
cd backend
npx prisma migrate dev
npx prisma studio
```

## 📊 Uso de la API

### Autenticación
```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Registro
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "My Company"
  }'
```

### Chat
```bash
# Enviar mensaje
curl -X POST http://localhost:3001/chat/{chatId}/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "¿Cómo reseteo mi contraseña?",
    "useRag": true,
    "maxContext": 3
  }'
```

### Documentos
```bash
# Subir documento
curl -X POST http://localhost:3001/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

## 🔒 Seguridad

- **Autenticación JWT** con tokens expirables
- **Rate limiting** configurable por empresa
- **Validación de inputs** con class-validator
- **Sanitización de archivos** subidos
- **CORS** configurado para producción
- **Helmet** para headers de seguridad

## 📈 Monitoreo y Analytics

- **Uso de tokens** por empresa
- **Cost tracking** en tiempo real
- **Métricas de rendimiento**
- **Logs estructurados** con Winston
- **Health checks** para Docker/K8s

## 🐳 Docker y Deployment

### Imágenes Docker
```bash
# Backend
docker build -t supportmind-backend ./backend

# Frontend  
docker build -t supportmind-frontend ./frontend

# Full application
docker build -t supportmind-app .
```

### Docker Compose
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🚀 Deployment

### Render
1. Conectar repositorio a Render
2. Configurar variables de entorno
3. Deploy automático en push a main

### Railway
Similar a Render, configurar Dockerfile y variables de entorno

### Manual (VPS)
```bash
# Clonar repositorio
git clone <repo-url>
cd SupportMind-AI

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env

# Levantar con PM2
pm2 start ecosystem.config.js
```

## 🧪 Testing

### Backend
```bash
cd backend
npm run test
npm run test:e2e
npm run test:cov
```

### Frontend
```bash
cd frontend
npm test
npm run test:e2e
```

## 📝 Variables de Entorno

### Backend
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
CHROMA_HOST=http://localhost:8000
REDIS_URL=redis://localhost:6379
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=SupportMind AI
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error de conexión a ChromaDB**
   - Verificar que ChromaDB esté corriendo en puerto 8000
   - Revisar la configuración de red en Docker

2. **Error de OpenAI API**
   - Verificar la clave de API sea válida
   - Chequear el límite de uso de la API

3. **Migraciones de base de datos**
   - Limpiar la base de datos: `npx prisma migrate reset`
   - Regenerar cliente: `npx prisma generate`

4. **Problemas con uploads**
   - Verificar permisos del directorio `uploads/`
   - Chequear tamaño máximo de archivo (10MB por defecto)

## 🤝 Contribución

1. Fork del repositorio
2. Crear feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE)

## 👤 Autor

**Johan Gabriel Vásquez Camacho**
- Estudiante de Desarrollo de Software
- Backend & IA Especialista
- LinkedIn: [tu-perfil]

---

🚀 **¡SupportMind AI - Transformando el soporte con IA!**