# README de Execução — Mini E-commerce Distribuído

Instruções para colocar o sistema completo (5 microsserviços + gateway + UI)
em execução, testar os principais fluxos via `curl` e simular falhas de
serviço.

## 1. Pré-requisitos

- Docker >= 24
- Docker Compose >= 2 (plugin `docker compose`)

Verifique com:

```bash
docker --version
docker compose version
```

## 2. Como rodar

Na raiz do projeto:

```bash
cp .env.example .env
docker compose up --build
```

> No Windows (PowerShell), execute os dois comandos separadamente:
> `Copy-Item .env.example .env` e depois `docker compose up --build`.

O `.env` define o `JWT_SECRET` compartilhado por todos os serviços (o
arquivo `.env.example` já traz um valor padrão; troque por um segredo
próprio se desejar).

Após o build, os seguintes containers devem estar em execução:

| Serviço | Porta host | Descrição |
| --- | --- | --- |
| `ui` | 8080 | Interface web (SPA) |
| `gateway` | 5000 | API Gateway — proxy, autenticação, heartbeat |
| `users` | 5001 | Cadastro, login e dados de usuários |
| `products-primary` | 5002 | Catálogo de produtos (réplica primária) |
| `products-replica` | 5012 | Réplica do catálogo de produtos |
| `orders` | 5003 | Criação e consulta de pedidos |

Para subir em segundo plano: `docker compose up --build -d`.
Para parar tudo: `docker compose down`.

## 3. Como acessar o dashboard

Abra **<http://localhost:8080>** no navegador.

- `#/` — home com produtos em destaque
- `#/catalog` — catálogo com busca/filtro/ordenação
- `#/cart` — carrinho e checkout
- `#/orders` — meus pedidos (requer login)
- `#/admin` — cadastro de produtos (requer login como admin)
- `#/status` — painel com o status dos 4 serviços (heartbeat a cada 5s)

### Credenciais de teste

| Papel | Email | Senha |
| --- | --- | --- |
| Admin | `admin@ecommerce.com` | `admin123` |
| Usuário | `olivia.wilson@x.dummyjson.com` | `password123` |

## 4. Como testar via curl

Todos os comandos abaixo passam pelo **API Gateway** (`localhost:5000`).
Em PowerShell, os exemplos com JSON inline podem ser executados via
`curl.exe` (presente no Windows 10+) usando aspas duplas escapadas, ou
rodados diretamente em um terminal bash (Git Bash/WSL).

### 4.1 Registro de um novo usuário

```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Novo Usuario","email":"novo@teste.com","password":"senha123"}'
```

### 4.2 Login (usuário comum)

```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"olivia.wilson@x.dummyjson.com","password":"password123"}'
```

A resposta traz `{ "token": "...", "user": {...} }`. Guarde o `token` em
uma variável para os próximos passos:

```bash
USER_TOKEN="<cole o token aqui>"
```

### 4.3 Listar produtos (rota pública)

```bash
curl http://localhost:5000/products
```

Copie o `id` de um produto da lista para usar no pedido (`PRODUCT_ID`).

### 4.4 Criar produto — deve falhar (403) com usuário comum

```bash
curl -i -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"Produto X","price":10,"stock":5}'
```

Esperado: `HTTP/1.1 403` e `{"error":"Apenas admins podem criar produtos"}`.

### 4.5 Login como admin e criar produto (201 + replicação)

```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecommerce.com","password":"admin123"}'
```

```bash
ADMIN_TOKEN="<cole o token do admin aqui>"

curl -i -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Produto Demo","description":"Criado via curl","category":"demo","price":29.9,"stock":10,"brand":"Demo","thumbnail":"https://placehold.co/300x300?text=Demo"}'
```

Esperado: `HTTP/1.1 201` com o produto criado. Para confirmar a
**replicação com consistência forte**, consulte diretamente a réplica
(porta 5012) e veja o mesmo produto:

```bash
curl http://localhost:5012/products | grep "Produto Demo"
```

### 4.6 Criar pedido (checkout)

```bash
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}"
```

### 4.7 Listar pedidos do usuário

O `id` do usuário vem no campo `user.id` da resposta de login:

```bash
USER_ID="<cole o id do usuário aqui>"

curl http://localhost:5000/orders/$USER_ID \
  -H "Authorization: Bearer $USER_TOKEN"
```

## 5. Como simular falhas

### 5.1 Serviço de Pedidos indisponível

```bash
docker compose stop orders
```

Acompanhe os logs do gateway (o heartbeat roda a cada 5s):

```bash
docker compose logs -f gateway
```

Após ~5-10s, o heartbeat marca `orders` como `down`. Confirme via:

```bash
curl http://localhost:5000/api/health
```

Qualquer chamada a `/orders/*` passa a responder `503`:

```bash
curl -i -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}"
# HTTP/1.1 503 {"error":"Serviço orders indisponível"}
```

Os serviços `users` e `products` continuam respondendo normalmente. No
dashboard (`#/status`), o card "Pedidos" aparece como "Offline".

Para restaurar:

```bash
docker compose start orders
```

Após o próximo heartbeat (~5s), o serviço volta a `up` no `/api/health` e
no painel `#/status`.

### 5.2 Réplica de produtos indisponível

```bash
docker compose stop products-replica
```

O serviço `products-primary` continua respondendo normalmente em
`/products` (passa a usar apenas a base local, sem alternar leituras para
a réplica). Para restaurar: `docker compose start products-replica`.

## 6. Logs e diagnóstico

```bash
docker compose logs -f gateway     # heartbeat e proxy
docker compose logs -f orders      # criação/consulta de pedidos
docker compose logs -f products-primary
docker compose ps                  # status de todos os containers
```
