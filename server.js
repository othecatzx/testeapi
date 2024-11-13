
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const path = require('path');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));


app.use(session({
  secret: 'segredo_aleatorio',
  resave: false,
  saveUninitialized: true,
}));

// Página de Login
app.get('/', (req, res) => {
  res.send(`
<html>
<head>
  <title>Login</title>
    <link rel="stylesheet" href="/css/login.css">
</head>
<body>
  <div class="navbar">
    <img src="../imgs/logo.png" alt="Logo">
  </div>
</body>
    <html>
  <head>
    <title>Login</title>
    <style>
     
    </style>
  </head>
  <body>
    <div class="login-container">
      <h1>Login</h1>
      <form method="POST" action="/api/anuncios">
        <label for="access_token">Informe seu Access Token:</label>
        <input type="text" id="access_token" name="access_token" required placeholder="Digite seu Access Token">
        <button type="submit">Entrar</button>
      </form>
    </div>
  </body>
</html>

  `);
});



// Rota para receber o token e redirecionar para o painel de administração
app.post('/api/anuncios', (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token não fornecido' });
  }

  req.session.accessToken = access_token;
  res.redirect('/adm');
});

// Página de Administração
app.get('/adm', (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  res.send(` 
       <html>
        <head>
            <link rel="stylesheet" href="/css/adm.css">
    <body>
        <div class="navbar">
        <img src="/imgs/logo.png" alt="Logo">
        </div>
    
        <div class="panel-container">
        <h1>Painel de Administração</h1>
    
        <form method="GET" action="/anuncios">
            <button type="submit">Ver meus Anúncios</button>
        </form>
    
        <form method="GET" action="/adm-anuncios">
            <button type="submit">Administrar meus Anúncios</button>
        </form>
    
        <form method="GET" action="/vendas">
            <button type="submit">Vendas</button>
        </form>

         <form method="GET" action="/promocoes">
            <button type="submit">promocoes</button>
        </form>
    
        <form method="POST" action="/api/logout">
            <button type="submit">Logout</button>
        </form>
        <form action="/pags/planilhacalculo" method="get">
  <button type="submit">Planilha</button>
</form>
        </div>
    </body>
    </html>


  `);
});
app.get('/pags/planilhacalculo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pags', 'planilhacalculo.html'));
});
app.get('/vendas', async (req, res) => {
  const accessToken = req.session.accessToken; // Recupera o accessToken da sessão

  if (!accessToken) {
    return res.redirect('/'); // Se não tiver o accessToken, redireciona para a página inicial
  }

  try {
    // Requisição à API para obter as vendas do usuário
    const response = await axios.get('https://api.mercadolibre.com/orders/search', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        seller: 'me',  // Obtém as vendas do usuário logado
        order_status: 'paid',  // Filtro para vendas pagas
      },
    });

    const vendas = response.data.results; // Extrai as vendas da resposta da API

    // Cria o HTML para exibir as vendas
    const vendasHtml = vendas.map((venda) => {
      const status = venda.status;
      const dataCompra = new Date(venda.date_created).toLocaleString();
      const valorTotal = venda.total_amount.toFixed(2);

      return `
        <div class="venda">
          <h3>Venda ID: ${venda.id}</h3>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Data da Compra:</strong> ${dataCompra}</p>
          <p><strong>Valor Total:</strong> R$ ${valorTotal}</p>
          <p><strong>Comprador:</strong> ${venda.buyer.nickname}</p>
          <hr />
        </div>
      `;
    }).join(''); // Junta todas as vendas em uma única string HTML

    // Envia o HTML completo para o navegador
    res.send(`
      <html>
        <head>
          <title>Minhas Vendas</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            h1 {
              text-align: center;
              padding: 20px;
              background-color: #007bff;
              color: white;
            }
            .venda {
              background-color: white;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              margin: 20px;
              padding: 20px;
              border-radius: 8px;
            }
            h3 {
              color: #007bff;
            }
            hr {
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <h1>Minhas Vendas</h1>
          <div>${vendasHtml}</div>
        </body>
      </html>
    `); // Responde com a lista de vendas formatada em HTML
  } catch (error) {
    console.error('Erro ao carregar as vendas:', error);
    res.status(500).send('Erro ao carregar as vendas.');
  }
});


app.get('/anuncios', async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  const statuses = [
    { label: 'Ativo', value: 'active' },
    { label: 'Pausado', value: 'paused' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  const categories = [
    { label: 'Eletrônicos', value: 'MLB1051' },
    { label: 'Vestuário', value: 'MLB1430' },
    { label: 'Casa e Decoração', value: 'MLB1071' },
    { label: 'Beleza e Cuidado Pessoal', value: 'MLB1500' },
    { label: 'Móveis', value: 'MLB1094' },
    { label: 'Jardinagem', value: 'MLB2039' },
    { label: 'Automóveis', value: 'MLB1744' },
    { label: 'Livros e Revistas', value: 'MLB1144' },
    { label: 'Eletrodomésticos', value: 'MLB1168' },
    { label: 'Informática', value: 'MLB1367' },
  ];

  const { status, category_id, keyword, page = 1 } = req.query;
  let queryParams = {};

  if (status) queryParams.status = status;
  if (category_id) queryParams.category_id = category_id;
  if (keyword) queryParams.q = keyword;

  const itemsPerPage = 30; // Número de itens por página
  const offset = (page - 1) * itemsPerPage;

  try {
    const response = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userId = response.data.id;

    const anuncios = await axios.get(`https://api.mercadolibre.com/users/${userId}/items/search`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: { ...queryParams, offset, limit: itemsPerPage }, // Paginação
    });

    const itemIds = anuncios.data.results;
    const anunciosDetalhados = [];

    for (let itemId of itemIds) {
      const itemDetails = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      anunciosDetalhados.push(itemDetails.data);
    }

    const totalItems = anuncios.data.paging.total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationHtml = () => {
      let pagination = '';
      for (let i = 1; i <= totalPages; i++) {
        pagination += `
          <a href="/anuncios?page=${i}&status=${status || ''}&category_id=${category_id || ''}&keyword=${keyword || ''}" 
            class="pagina-link ${i === parseInt(page) ? 'ativo' : ''}">${i}</a>
        `;
      }
      return pagination;
    };

    const checkQuality = (item) => {
      const issues = [];
      if (!item.title || item.title.trim() === '') {
        issues.push('🔴 Faltando título');
      }
      if (!item.pictures || item.pictures.length === 0) {
        issues.push('🔴 Faltando imagem');
      }
      if (!item.price || item.price < 20) {
        issues.push('🟠 Preço muito baixo para a categoria');
      }
      if (!item.description || item.description.length < 50) {
        issues.push('🟠 Descrição incompleta');
      }
      return issues.length > 0 ? issues.join(', ') : '🟢 Qualidade ok';
    };

    const anunciosHtml = anunciosDetalhados.map((item) => {
      const qualityIssues = checkQuality(item);
      const status = item.status === 'paused' ? 'Pausado' : item.status === 'cancelled' ? 'Cancelado' : 'Ativo';
      const statusColor = item.status === 'paused' ? 'red' : item.status === 'cancelled' ? 'gray' : 'green';

      return `
        <div class="anuncio">
          <img src="${item.pictures[0].url}" alt="${item.title}" class="imagem">
          <div class="anuncio-info">
            <p class="titulo">${item.title}</p>
            <p class="status" style="color: ${statusColor};">${status}</p>
            <p class="preco">R$ ${item.price.toFixed(2)}</p>
            <p class="quantidade">Quantidade disponível: ${item.available_quantity}</p>
            <p class="qualidade">${qualityIssues}</p>
            <p class="mlb-id">
              <span id="mlb-id-${item.id.replace('MLB', '')}" onclick="copyMLB('${item.id.replace('MLB', '')}')">${item.id.replace('MLB', '')}</span>
            </p>
            ${item.status === 'cancelled' ? `
              <form method="POST" action="/anuncio/${item.id}/reactivate">
                <button type="submit" class="botao-reativar">Reativar</button>
              </form>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    res.send(`
      <html>
        <head>
          <title>Anúncios</title>
            <link rel="stylesheet" href="/css/anuncios.css">
          <script>
            function copyMLB(itemId) {
              const range = document.createRange();
              const span = document.getElementById('mlb-id-' + itemId);
              range.selectNode(span);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(range);
              document.execCommand('copy');
            }
          </script>
        </head>
        <body>
        <header>
          <nav>
            <a href="/anuncios">Ver Anúncios</a>
            <a href="/adm-anuncios">Painel de Administração</a>
          </nav>
        </header>
          <h1>Gerenciador de Anúncios</h1>
          <div class="filtro">
            <form method="GET" action="/anuncios">
              <input type="text" name="keyword" placeholder="Buscar..." value="${keyword || ''}">
              <select name="status">
                <option value="">Status</option>
                ${statuses.map((statusOption) => `
                  <option value="${statusOption.value}" ${status === statusOption.value ? 'selected' : ''}>${statusOption.label}</option>
                `).join('')}
              </select>
              <select name="category_id">
                <option value="">Categoria</option>
                ${categories.map((categoryOption) => `
                  <option value="${categoryOption.value}" ${category_id === categoryOption.value ? 'selected' : ''}>${categoryOption.label}</option>
                `).join('')}
              </select>
              <button type="submit">Filtrar</button>
            </form>
          </div>
          <div class="anuncios-lista">
            ${anunciosHtml}
          </div>
          <form method="GET" action="/adm">
     <button type="submit" class="btn-back">Voltar</button>
    </form>
          <div id="paginacao">
            ${paginationHtml()}
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao carregar os anúncios.');
  }
});


// Página de Administração de Anúncios
app.get('/adm-anuncios', async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  const status = req.query.status || '';  // Captura o status da query string, se existir

  res.send(`
    <html>
      <head>
        <title>Painel de Administração</title>
          <link rel="stylesheet" href="/css/adm-anuncios.css">
      </head>
      <body>

      <header>
          <nav>
            <a href="/anuncios">Ver Anúncios</a>
            <a href="/adm-anuncios">Painel de Administração</a>
          </nav>
        </header>
        <h1>Painel de Administração</h1>

        <!-- Formulário para atualizar status -->
        <form method="POST" action="/atualizar-status">
          <label for="item_id">Informe o ID do Anúncio (MLB):</label>
          <input type="text" name="item_id" id="item_id" required>

          <label for="status">Escolha o Status:</label>
          <select name="status" id="status" required>
            <option value="paused">Pausado</option>
            <option value="active">Ativo</option>
          </select>

          <button type="submit">Atualizar Status</button>
        </form>

        <!-- Formulário para atualizar valor e estoque -->
        <form method="POST" action="/atualizar-anuncio">
          <label for="item_id_valor">Informe o ID do Anúncio (MLB):</label>
          <input type="text" name="item_id" id="item_id_valor" required>

          <label for="price">Novo Preço (R$):</label>
          <input type="text" name="price" id="price" required>

          <label for="available_quantity">Novo Estoque:</label>
          <input type="text" name="available_quantity" id="available_quantity" required>

          <button type="submit">Atualizar Valor e Estoque</button>
        </form>

        <div class="back-button-container">
          <form method="GET" action="/adm">
            <button type="submit" class="btn-back">Voltar</button>
          </form>
        </div>

        <!-- Popup de sucesso ou erro -->
        <div id="popup" class="popup ${status ? (status === 'success' ? 'success' : 'error') : ''}">
          ${status === 'success' ? 'Ação realizada com sucesso!' : status === 'error' ? 'Erro ao realizar a ação.' : ''}
        </div>

        <script>
          // Exibe o popup, caso exista um status
          const popup = document.getElementById('popup');
          if (popup) {
            popup.style.display = 'block';
            setTimeout(() => {
              popup.style.display = 'none';
            }, 3000);
          }
        </script>
      </body>
    </html>
  `);
});

// Atualizar Status do Anúncio
app.post('/atualizar-status', async (req, res) => {
  const { item_id, status } = req.body;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  try {
    await axios.put(`https://api.mercadolibre.com/items/MLB${item_id}`, { status }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.redirect('/adm-anuncios?status=success');
  } catch (error) {
    console.error(error);
    res.redirect('/adm-anuncios?status=error');
  }
});

// Atualizar Valor e Estoque
app.post('/atualizar-anuncio', async (req, res) => {
  const { item_id, price, available_quantity } = req.body;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  try {
    await axios.put(`https://api.mercadolibre.com/items/MLB${item_id}`, {
      price,
      available_quantity
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.redirect('/adm-anuncios?status=success');
  } catch (error) {
    console.error(error);
    res.redirect('/adm-anuncios?status=error');
  }
});


// Atualizar Status do Anúncio
app.post('/atualizar-status', async (req, res) => {
  const { item_id, status } = req.body;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  try {
    await axios.put(`https://api.mercadolibre.com/items/MLB${item_id}`, { status }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.redirect('/adm-anuncios?status=success');
  } catch (error) {
    console.error(error);
    res.redirect('/adm-anuncios?status=error');
  }
});



// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});


app.listen(3000, () => {
  console.log('Servidor iniciado em http://localhost:3000');
});
