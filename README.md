# 💎 deeBank Premium Admin Dashboard

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-latest-purple.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.x-sky.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Um dashboard administrativo de alto nível, desenvolvido para o ecossistema **deeBank**, com foco em gestão financeira, auditoria de transações (exclusivo para Angola +244) e monitoramento de usuários em tempo real.

---

## ✨ Características Principais

- 🚀 **Design Premium**: Interface moderna com glassmorphism, tons de azul profundos e animações fluidas.
- 📊 **Analytics Avançado**: Gráficos interativos com Recharts para monitoramento de crescimento e fluxo de caixa.
- 🛡️ **Segurança**: Porta de autenticação com suporte a **2FA (Two-Factor Authentication)**.
- 💰 **Gestão Financeira**: Módulo especializado para aprovação/rejeição de depósitos e saques.
- 📱 **Responsivo**: Layout adaptável para Desktop (Sidebar) e Mobile (Bottom Navigation).
- 📜 **Logs de Auditoria**: Registro detalhado de todas as ações administrativas para máxima transparência.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **Charts**: Recharts
- **Icons**: Lucide Icons (SVG implementation)
- **Deployment**: Vite (Build System)

---

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/paineldeebank.git
   cd paineldeebank/painell
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 📸 Screenshots

*(Adicione imagens aqui para impressionar no GitHub)*

---

## 🏗️ Estrutura do Projeto

- `/components`: Componentes reutilizáveis (Sidebar, StatCard, etc.)
- `/pages`: Páginas da aplicação (Dashboard, Users, Transactions, Logs)
- `/services`: Serviços de dados e integração com Supabase
- `/types`: Definições globais de TypeScript
- `index.css`: Sistema de design e variáveis globais

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  Desenvolvido com ❤️ por <strong>deeBank Team</strong>
</p>
