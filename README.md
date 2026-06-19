# 💈 Elinho do Corte — Sistema de Gestão

Sistema de gestão completo para barbearia, desenvolvido em HTML/CSS/JavaScript puro com integração ao Firebase Firestore. Funciona em qualquer dispositivo via navegador, sem instalação.




## 📋 Funcionalidades

### 💰 Vendas (Walk-in)
- Registro rápido de atendimentos na hora
- Seleção de serviço por botões ou campo livre
- 4 formas de pagamento: Pix, Dinheiro, Débito, Crédito
- Resumo antes de confirmar
- Filtro por: Hoje / Esta semana / Todas
- Total do dia em tempo real

### 🗓️ Agendamentos
- Cadastro de clientes com data e horário
- Atribuição por barbeiro
- Registro de sinal/entrada
- Confirmação de pagamento com forma escolhida
- Cancelamento de pagamento

### 📅 Calendário
- Visualização mensal de agendamentos e vendas
- Pontos coloridos por tipo de atendimento
- Detalhe do dia ao clicar

### 👤 Clientes
- Ficha individual por cliente
- Histórico de preferências, alergias e observações
- Salvo diretamente no agendamento

### 📊 Dashboard
- Receita total (vendas + agendamentos pagos)
- Lucro líquido, ticket médio e margem
- Walk-in vs Agendamentos
- Gráficos por: categoria de serviço, barbeiro e forma de pagamento
- Navegação por mês

### 💸 Gastos
- Lançamento de despesas por categoria
- Suporte a quantidade (ex: 3x R$ 20,00)
- Total geral de gastos

---

## 🛠️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Banco de dados:** Firebase Firestore (tempo real)
- **Gráficos:** Chart.js 4.4
- **Fontes:** Google Fonts (Playfair Display + Inter)
- **Deploy:** Vercel

---

## 🔥 Firebase — Coleções utilizadas

| Coleção | Descrição |
|---------|-----------|
| `vendas` | Vendas walk-in registradas |
| `agendamentos` | Agendamentos com pagamento e ficha |
| `gastos` | Despesas da barbearia |

---

## ☁️ Deploy na Vercel

1. Faça fork ou upload deste repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**
3. Importe o repositório do GitHub
4. Clique em **Deploy**
5. Acesse o link gerado — pronto!

> **Dica:** Renomeie o arquivo para `index.html` para que a Vercel sirva automaticamente sem configuração extra.

---

## 📁 Estrutura do projeto

```
ElinhoDoCorte/
├── index.html     # Sistema completo (single file)
└── README.md      # Este arquivo
```

---

## ✂️ Serviços cadastrados

- Corte Simples
- Corte Degradê
- Corte Navalhado
- Barba
- Barba Completa
- Barba + Bigode
- Corte + Barba
- Relaxamento
- Pigmentação
- Luzes / Mechas
- Hidratação
- Sobrancelha
- Combo Completo

---

## 💈 Sobre

Desenvolvido sob medida para a **Barbearia Elinho do Corte**.  
Sistema 100% responsivo — funciona no celular, tablet e computador.
