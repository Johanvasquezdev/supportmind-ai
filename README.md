# supportmind-ai
B2B SaaS – AI-powered support assistant 


# SupportMind AI 🚀

**SupportMind AI** es una **plataforma B2B SaaS impulsada por Inteligencia Artificial**, diseñada para ayudar a las empresas a **automatizar y optimizar sus procesos de soporte al cliente** utilizando técnicas modernas de IA como **LLMs, RAG (Retrieval-Augmented Generation)** y una **arquitectura backend escalable**.

Este proyecto está construido como un **SaaS real**, no como un demo ni un clon de ChatGPT, siguiendo buenas prácticas de **arquitectura de software, DevOps e integración de IA**.

---

## 🧠 Problema

Los equipos de soporte dedican una gran cantidad de tiempo a:
- Responder preguntas repetitivas
- Buscar información en documentación interna
- Resolver tickets simples que podrían automatizarse

Esto provoca:
- Altos costos operativos
- Respuestas lentas
- Mala experiencia del cliente
- Sobrecarga del equipo de soporte

---

## ✅ Solución

SupportMind AI ofrece un **asistente de soporte impulsado por IA** que:

- Responde preguntas de soporte automáticamente
- Utiliza documentación interna de la empresa (RAG)
- Mantiene el contexto de las conversaciones
- Funciona bajo una **arquitectura B2B multi-tenant**
- Reduce el tiempo de respuesta y la carga operativa

---

## 🏗️ Visión general de la arquitectura

Frontend (Next.js)
↓
Backend API (Node.js)
↓
Capa Wrapper de IA (Prompts + Reglas)
↓
API de OpenAI (LLM)
↓
Base de Datos Vectorial (RAG)

PostgreSQL → Usuarios, Empresas, Tickets, Historial


---

## 🧩 Funcionalidades principales

- 🔐 Autenticación (JWT)
- 🏢 Arquitectura multi-tenant (B2B)
- 🤖 Respuestas automáticas con IA
- 📄 Carga de documentos y embeddings (RAG)
- 💬 Historial de conversaciones
- 📊 Control de uso y rate limiting
- 🐳 Aplicación dockerizada
- 🔄 CI/CD con GitHub Actions

---

## 🛠️ Stack Tecnológico

### Frontend
- Next.js
- React
- Tailwind CSS

### Backend
- Node.js
- NestJS (o Express)
- API REST

### IA y Datos
- OpenAI API
- Base de datos vectorial (Pinecone / Weaviate / Chroma)
- PostgreSQL
- Redis (opcional)

### DevOps
- Docker
- GitHub Actions
- Deploy en Render / Railway / Cloud

---

## 🧠 Diseño del Wrapper de IA

SupportMind AI **no es solo un chatbot**.

Implementa una **capa wrapper de IA** que:
- Define prompts del sistema
- Aplica reglas de negocio
- Inyecta contexto específico de cada empresa
- Controla el uso de tokens y costos
- Evita respuestas fuera de contexto

Ejemplo de prompt del sistema:


---

## 📅 Plan de desarrollo del MVP (14 días)

### Semana 1
- Configuración del proyecto y repositorio
- Backend API + autenticación
- Modelos de base de datos (usuarios y empresas)
- Integración con OpenAI
- Interfaz básica de chat (frontend)

### Semana 2
- Carga de documentos y embeddings
- Implementación de RAG
- Rate limiting y logging
- Dockerización
- Pipeline CI/CD
- Deploy en la nube
- Documentación y demo

---

## 🎯 Usuarios objetivo

- Empresas SaaS
- Startups
- Equipos de soporte técnico
- Departamentos de soporte interno

---

## 📈 Por qué este proyecto es importante

Este proyecto demuestra:
- Arquitectura real de un SaaS B2B
- Integración de IA más allá de un simple chatbot
- Diseño multi-tenant
- Automatización con CI/CD
- Uso responsable y escalable de IA

Está diseñado como un **proyecto de portafolio profesional**, ideal para roles de **Backend, DevOps o IA aplicada**.

---

## 🚀 Roadmap

- Sistema de pagos y suscripciones
- Panel de administración
- Integración con Slack / Microsoft Teams
- Analíticas avanzadas
- Despliegue con Kubernetes y Vercel

---

## 👤 Autor

**Johan Gabriel Vásquez Camacho**  
Estudiante de Desarrollo de Software | Backend & IA  

---

## 📜 Licencia

MIT License
