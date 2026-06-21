# SoundCollab Frontend

Interface web do SoundCollab, uma aplicação para descoberta e conexão entre músicos por critérios de compatibilidade.

- Backend: [soundcollab_backend](https://github.com/JoaoLucasLD/soundcollab_backend)
- Versão utilizada na avaliação do TCC: commit [`bb2ed41c5451`](https://github.com/JoaoLucasLD/soundcollab_frontend/tree/bb2ed41c5451bc5dea5992b677d4b15ee89cdc96)

## Funcionalidades principais

- cadastro e autenticação;
- onboarding e edição do perfil musical;
- seleção de instrumentos, estilos, objetivos e disponibilidade;
- descoberta de músicos ordenados por compatibilidade;
- busca e filtros persistentes;
- visualização de perfis;
- envio, aceite, recusa e cancelamento de convites de colaboração.

## Tecnologias

- React e TypeScript;
- Vite;
- React Router;
- TanStack Query;
- Axios;
- React Hook Form e Zod;
- Tailwind CSS;
- Lucide React.

## Pré-requisitos

- [Node.js](https://nodejs.org/) `20.19+` ou `22.12+`;
- npm;
- Git;
- backend do SoundCollab configurado e em execução.

Siga primeiro o [README do backend](https://github.com/JoaoLucasLD/soundcollab_backend), incluindo a criação do banco, aplicação das migrações e configuração dos catálogos.

## Instalação local

### 1. Clonar o repositório

```bash
git clone https://github.com/JoaoLucasLD/soundcollab_frontend.git
cd soundcollab_frontend
```

Para reproduzir exatamente a versão avaliada no TCC:

```bash
git checkout bb2ed41c5451bc5dea5992b677d4b15ee89cdc96
```

### 2. Instalar as dependências

```bash
npm ci
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do frontend:

```dotenv
VITE_API_BASE_URL="http://localhost:3000/api/v1"
VITE_MAPBOX_ACCESS_TOKEN="SEU_TOKEN_PUBLICO_MAPBOX"
```

#### `VITE_API_BASE_URL`

Deve apontar para a URL completa da API, incluindo o prefixo `/api/v1`. Se o backend utilizar outra porta, atualize esse valor.

#### `VITE_MAPBOX_ACCESS_TOKEN`

Token público do Mapbox utilizado pelo autocomplete de cidades brasileiras. Sem ele, a aplicação pode ser iniciada e a cidade pode ser informada, mas as sugestões e coordenadas geográficas não serão obtidas. Consequentemente, o filtro por distância não ficará disponível para perfis sem coordenadas.

Variáveis prefixadas com `VITE_` são incorporadas ao código entregue ao navegador. Portanto, utilize somente um token público do Mapbox e configure restrições de origem quando necessário.

### 4. Iniciar o frontend

Com o backend em execução:

```bash
npm run dev
```

Por padrão, o Vite exibirá a aplicação em:

```text
http://localhost:5173
```

Se o Vite selecionar outra porta, atualize `FRONTEND_URL` no `.env` do backend e reinicie a API.

## Ordem recomendada para reprodução

1. Inicie o PostgreSQL.
2. Configure e execute o backend.
3. Aplique as migrações do Prisma.
4. Cadastre os instrumentos e estilos conforme o README do backend.
5. Configure e execute o frontend.
6. Crie uma conta pela página `/cadastro`.
7. Preencha o onboarding do perfil.
8. Crie uma segunda conta para visualizar resultados na página de descoberta e testar convites.

O usuário autenticado não aparece no próprio ranking. Por isso, são necessárias ao menos duas contas com perfis completos para observar a descoberta e a ordenação por compatibilidade.

## Fluxo da aplicação

```text
Cadastro ou login
        ↓
Onboarding do perfil
        ↓
Descoberta e filtros
        ↓
Perfil de outro músico
        ↓
Convite de colaboração
```

Após o login, o frontend consulta `GET /users/me`. Caso o perfil ainda esteja incompleto, o usuário é direcionado para `/onboarding/perfil`. A página `/descobrir` consulta `GET /matchmaking/ranking` e mantém a lista ordenada pela pontuação retornada pelo backend.

O filtro de distância é enviado ao backend. Busca textual, instrumentos, estilos, objetivos e disponibilidade são aplicados no frontend sobre a lista recebida, sem alterar a ordem relativa dos músicos restantes.

## Rotas da interface

| Rota | Finalidade | Requer autenticação |
| --- | --- | --- |
| `/cadastro` | Criar uma conta. | Não |
| `/login` | Autenticar uma conta. | Não |
| `/onboarding/perfil` | Preencher o perfil inicial. | Sim |
| `/descobrir` | Visualizar e filtrar músicos. | Sim |
| `/musicos/:userId` | Visualizar o perfil de outro músico. | Sim |
| `/perfil` | Editar o próprio perfil. | Sim |
| `/colaboracoes` | Gerenciar convites de colaboração. | Sim |

## Scripts disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Verifica o TypeScript e gera a aplicação em `dist/`. |
| `npm run preview` | Executa localmente o conteúdo gerado pelo build. |
| `npm run lint` | Executa o ESLint. |

Para verificar uma compilação de produção:

```bash
npm run build
npm run preview
```

## Integração com a API

O cliente Axios utiliza `VITE_API_BASE_URL` como URL-base. Quando existe um token salvo, ele é enviado no cabeçalho:

```http
Authorization: Bearer TOKEN
```

Uma resposta HTTP `401` remove o token local. O controle de rotas redireciona usuários sem uma sessão válida para a página de login.

Os principais serviços do frontend são:

| Serviço | Endpoints utilizados |
| --- | --- |
| Autenticação | `/auth/signup`, `/auth/login` e `/users/me` |
| Perfil | `/profiles/me`, `/profiles/me/instruments`, `/profiles/me/styles` e `/profiles/users/:userId` |
| Descoberta | `/matchmaking/ranking` |
| Catálogos | `/instruments`, `/instruments/categories` e `/styles` |
| Colaborações | `/collaborations` e ações de aceitar, recusar ou cancelar |

## Solução de problemas

### A página mostra erro ao carregar a sessão ou os músicos

- Confirme que o backend está em execução.
- Verifique se `VITE_API_BASE_URL` inclui `/api/v1`.
- Abra as ferramentas de desenvolvimento do navegador e consulte a aba de rede.
- Reinicie o Vite após alterar `.env.local`.

### O navegador bloqueia as chamadas por CORS

No backend, defina `FRONTEND_URL` com a origem exata apresentada pelo Vite, por exemplo `http://localhost:5173`, e reinicie a API.

### Instrumentos e estilos não aparecem

Uma instalação nova não recebe o catálogo completo apenas com as migrações. Execute a [configuração inicial dos catálogos](https://github.com/JoaoLucasLD/soundcollab_backend#configuração-inicial-dos-catálogos).

### As sugestões de cidade não aparecem

- Confirme que `VITE_MAPBOX_ACCESS_TOKEN` contém um token público válido.
- Reinicie o Vite após alterar a variável.
- Verifique as restrições e permissões do token no Mapbox.

### O filtro de distância não está disponível

O perfil autenticado precisa possuir latitude e longitude. Edite a cidade e selecione uma das sugestões retornadas pelo Mapbox para armazenar as coordenadas.

### A página de descoberta está vazia

- O usuário autenticado não aparece no próprio ranking.
- Crie ao menos uma segunda conta e complete seu perfil.
- Limpe os filtros aplicados na página de descoberta.

## Estrutura principal

```text
src/
├── components/     Componentes reutilizáveis e elementos de layout
├── config/         Leitura das variáveis de ambiente
├── hooks/          Consultas e mutações com TanStack Query
├── lib/            Cliente HTTP e funções auxiliares
├── pages/          Páginas associadas às rotas
├── services/       Comunicação com a API
└── types/          Tipos compartilhados no frontend
```

## Licença

Consulte o arquivo [LICENSE](LICENSE) deste repositório.
