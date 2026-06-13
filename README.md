# Mini E-commerce Distribuído

Atividade acadêmica de Sistemas Distribuídos: uma plataforma de e-commerce
composta por múltiplos microsserviços independentes (Node.js + Express),
armazenamento em arquivos JSON, autenticação via JWT, **replicação com
consistência forte** no serviço de Produtos, um **API Gateway** com proxy e
heartbeat/health-check, e uma **interface web (SPA)** completa para
navegação no catálogo, carrinho, checkout, histórico de pedidos e
administração.

- 📄 Instruções de execução e testes: [README_execucao.md](./README_execucao.md)
- 📄 Relatório técnico: [relatorio/relatorio.md](./relatorio/relatorio.md)

## Arquitetura

```text
                         ┌────────────────────────┐
                         │   UI (SPA estática)    │
                         │  nginx — host :8080    │
                         └────────────┬───────────┘
                                      │ HTTP (Authorization: Bearer <JWT>)
                                      ▼
                         ┌────────────────────────┐
                         │      API Gateway       │
                         │       host :5000       │
                         │ proxy + JWT + heartbeat│
                         │     (a cada 5s)        │
                         └──────┬──────┬──────┬───┘
                                │      │      │
              ┌─────────────────┘      │      └─────────────────┐
              ▼                        ▼                        ▼
   ┌────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
   │  Users — :5001     │   │ Products (primary)   │   │  Orders — :5003  │
   │  JWT + bcrypt      │   │       :5002          │   │ consulta Products│
   │  users.json        │   │ products-primary.json│   │  via HTTP interno│
   └────────────────────┘   └──────────┬───────────┘   │  orders.json     │
                                       │ replicação    └──────────────────┘
                                       │ (consistência forte)
                                       ▼
                               ┌──────────────────────┐
                               │ Products (replica)   │
                               │       :5012          │
                               │ products-replica.json│
                               └──────────────────────┘
```

## Stack

- **Backend:** Node.js + Express, armazenamento em JSON (`fs`/`path`), JWT
  (`jsonwebtoken`), hash de senha (`bcryptjs`), proxy reverso
  (`http-proxy-middleware`), comunicação interna via `node-fetch`.
- **Frontend:** SPA estática sem build step (ES Modules nativos), Tailwind
  CSS via CDN com tema TweakCN (claro/escuro), hash router próprio
  (`#/rota`), estado reativo com pub/sub e `localStorage`.
- **Infra:** Docker + Docker Compose, volumes nomeados por serviço, nginx
  servindo a UI.

## Serviços e portas

| Serviço | Porta host | Descrição |
| --- | --- | --- |
| `ui` | 8080 | Interface web (catálogo, carrinho, conta, admin...) |
| `gateway` | 5000 | API Gateway — proxy, autenticação, heartbeat |
| `users` | 5001 | Cadastro, login e dados de usuários |
| `products-primary` | 5002 | Catálogo de produtos (réplica primária) |
| `products-replica` | 5012 | Réplica do catálogo de produtos |
| `orders` | 5003 | Criação e consulta de pedidos |

## Funcionalidades da UI

- **Catálogo** com busca, filtro por categoria e ordenação por preço
- **Página de produto** com descrição, estoque e seletor de quantidade
- **Carrinho** (persistido em `localStorage`) e **checkout** (gera um pedido
  por item via `POST /orders`)
- **Meus Pedidos** — histórico com status e dados do produto
- **Login / Cadastro / Conta** — sessão via JWT
- **Admin** — criação de produtos (replicados automaticamente para a réplica)
- **Status (`#/status`)** — painel com heartbeat dos serviços (gateway,
  usuários, produtos, pedidos), atualizado a cada 5s
- Tema claro/escuro persistente

## Estrutura do projeto

```text
.
├── docker-compose.yml
├── .env.example
├── gateway/         # API Gateway (proxy, JWT, heartbeat)
├── users/           # Microsserviço de usuários (auth, JWT, bcrypt)
├── products/        # Microsserviço de produtos (primary + replica)
├── orders/          # Microsserviço de pedidos
├── ui/              # SPA estática (nginx)
├── README_execucao.md
└── relatorio/relatorio.md
```

## Credenciais de teste

| Papel | Email | Senha |
| --- | --- | --- |
| Admin | `admin@ecommerce.com` | `admin123` |
| Usuário | `olivia.wilson@x.dummyjson.com` | `password123` |

Veja [README_execucao.md](./README_execucao.md) para instruções completas de
execução, testes via `curl` e simulação de falhas.
