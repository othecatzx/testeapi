
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #e9f3fd;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .login-container {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 40px;
        max-width: 350px;
        width: 100%;
      }
      h1 {
        color: #007BFF;
        font-size: 24px;
        text-align: center;
        margin-bottom: 20px;
        font-weight: 600;
      }
      label {
        font-size: 14px;
        color: #555;
        margin-bottom: 5px;
        display: block;
      }
      input {
        padding: 12px;
        font-size: 16px;
        width: 100%;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin-bottom: 20px;
        outline: none;
        transition: border-color 0.3s;
      }
      input:focus {
        border-color: #007BFF;
      }
      button {
        padding: 12px;
        font-size: 16px;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 6px;
        width: 100%;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      button:hover {
        background-color: #0056b3;
      }
      button:active {
        background-color: #004085;
      }
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
    <title>Painel de Administração</title>
    <style>
      /* Estilos gerais */
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #e9f3fd;
        text-align: center;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }

      .panel-container {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 40px;
        max-width: 400px;
        width: 100%;
      }

      h1 {
        color: #007BFF;
        font-size: 28px;
        margin-bottom: 30px;
        font-weight: 600;
      }

      form {
        margin: 20px 0;
      }

      button {
        padding: 15px 30px;
        font-size: 18px;
        background-color: #007BFF;
        border: none;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        margin: 10px;
        width: 100%;
        transition: background-color 0.3s ease;
      }

      button:hover {
        background-color: #0056b3;
      }

      button:active {
        background-color: #003f7f;
      }

      /* Responsividade */
      @media (max-width: 768px) {
        button {
          width: 80%;
        }
      }
    </style>
  </head>
  <body>
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

      <form method="POST" action="/api/logout">
        <button type="submit">Logout</button>
      </form>
    </div>
  </body>
</html>


  `);
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

  // Filtros de preço, status, categoria e pesquisa
  const priceRanges = [
    { label: 'Até R$ 100', min: 0, max: 100 },
    { label: 'De R$ 100 até R$ 500', min: 100, max: 500 },
    { label: 'De R$ 500 até R$ 1000', min: 500, max: 1000 },
    { label: 'De R$ 1000 até R$ 5000', min: 1000, max: 5000 },
    { label: 'Acima de R$ 5000', min: 5000, max: 100000 },
  ];

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

  const { price_min, price_max, status, category_id, keyword } = req.query;
  let queryParams = {};

  if (price_min && price_max) {
    queryParams.price = { $gte: price_min, $lte: price_max };
  }
  if (status) queryParams.status = status;
  if (category_id) queryParams.category_id = category_id;
  if (keyword) queryParams.q = keyword;

  try {
    const response = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userId = response.data.id;
    
    // Buscando os itens específicos do usuário
    const anuncios = await axios.get(`https://api.mercadolibre.com/users/${userId}/items/search`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: queryParams, // Incluindo os filtros de pesquisa aqui
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

    // Função para verificar a qualidade do anúncio
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
              margin-bottom: 20px;
            }
            .filtro {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
              background-color: #fff;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .filtro input, .filtro select, .filtro button {
              padding: 10px;
              margin: 5px;
              border-radius: 5px;
              border: 1px solid #ccc;
              min-width: 150px;
              max-width: 200px;
            }
            .filtro button {
              background-color: #28a745;
              color: white;
              cursor: pointer;
            }
            .filtro button:hover {
              background-color: #218838;
            }
            .anuncio {
              display: flex;
              margin: 20px;
              background-color: white;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 5px;
              overflow: hidden;
              padding: 20px;
              align-items: center;
            }
            .imagem {
              width: 150px;
              height: 150px;
              object-fit: cover;
              margin-right: 20px;
            }
            .anuncio-info {
              flex-grow: 1;
            }
            .titulo {
              font-size: 18px;
              font-weight: bold;
            }
            .status {
              font-size: 14px;
              margin: 5px 0;
            }
            .preco, .quantidade {
              font-size: 16px;
              margin: 5px 0;
            }
            .qualidade {
              font-size: 14px;
              margin: 5px 0;
            }
            .botao-reativar {
              padding: 10px;
              background-color: #ffc107;
              color: white;
              border: none;
              cursor: pointer;
              border-radius: 5px;
              width: 100%;
            }
            .botao-reativar:hover {
              background-color: #e0a800;
            }
          </style>
        </head>
        <body>
          <h1>Meus Anúncios</h1>
          <form method="GET" action="/anuncios">
            <div class="filtro">
              <input type="text" name="keyword" placeholder="Pesquisar por palavra-chave..." value="${keyword || ''}">
              <select name="price_min">
                <option value="">Preço</option>
                ${priceRanges.map(range => `
                  <option value="${range.min}" ${price_min === range.min ? 'selected' : ''}>${range.label}</option>
                `).join('')}
              </select>
              <select name="status">
                <option value="">Status</option>
                ${statuses.map(status => `
                  <option value="${status.value}" ${status.value === status ? 'selected' : ''}>${status.label}</option>
                `).join('')}
              </select>
              <select name="category_id">
                <option value="">Categoria</option>
                ${categories.map(category => `
                  <option value="${category.value}" ${category.value === category_id ? 'selected' : ''}>${category.label}</option>
                `).join('')}
              </select>
              <button type="submit">Filtrar</button>
            </div>
          </form>
          <div id="anuncios">${anunciosHtml}</div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
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
        <style>
          /* Estilos gerais */
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            margin: 0;
            padding: 0;
            color: #333;
          }

          h1 {
            background-color: #007BFF;
            color: white;
            padding: 20px;
            text-align: center;
            margin: 0;
            border-bottom: 4px solid #0056b3;
          }

          form {
            background-color: white;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            margin: 40px auto;
            padding: 30px;
            width: 50%;
            border-radius: 8px;
            border: 1px solid #ddd;
          }

          label {
            font-size: 16px;
            margin-bottom: 10px;
            display: block;
            color: #444;
          }

          input[type="text"], select {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 16px;
            background-color: #f9f9f9;
            box-sizing: border-box;
            transition: border-color 0.3s ease;
          }

          input[type="text"]:focus, select:focus {
            border-color: #007BFF;
            outline: none;
          }

          button {
            background-color: #007BFF;
            color: white;
            font-size: 16px;
            padding: 14px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s ease;
          }

          button:hover {
            background-color: #0056b3;
          }

          .btn-back {
            background-color: #f44336;
            width: auto;
            padding: 14px 20px;
            margin-top: 20px;
            text-align: center;
            color: white;
            border-radius: 6px;
          }

          .btn-back:hover {
            background-color: #d32f2f;
          }

          /* Responsividade */
          @media (max-width: 768px) {
            form {
              width: 80%;
            }
          }

          /* Estilo para o botão de voltar */
          .back-button-container {
            text-align: center;
            margin-top: 30px;
          }

          /* Popup */
          .popup {
            position: fixed;
            bottom: 20px;   /* Ajustado para o fundo da tela */
            right: 20px;    /* Ajustado para o lado direito */
            padding: 15px;
            border-radius: 6px;
            color: white;
            font-size: 16px;
            z-index: 1000;
            display: none;
            max-width: 300px;
          }

          .popup.success {
            background-color: #4CAF50; /* Verde para sucesso */
          }

          .popup.error {
            background-color: #f44336; /* Vermelho para erro */
          }
        </style>
      </head>
      <body>
        <h1>Painel de Administração</h1>

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

        <form method="POST" action="/reativar-anuncio">
          <label for="item_id_cancelado">Informe o ID do Anúncio Cancelado (MLB) para Reativar:</label>
          <input type="text" name="item_id_cancelado" id="item_id_cancelado" required>

          <button type="submit">Reativar Anúncio Cancelado</button>
        </form>

        <div class="back-button-container">
          <form method="GET" action="/adm">
            <button type="submit" class="btn-back">Voltar</button>
          </form>
        </div>

        <!-- Popup de sucesso ou erro -->
        <div id="popup" class="popup ${status ? (status === 'success' ? 'success' : 'error') : ''}">
          ${status === 'success' ? 'Status do anúncio atualizado com sucesso!' : status === 'error' ? 'Erro ao atualizar o status do anúncio.' : ''}
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

// Reativar Anúncio Cancelado
app.post('/reativar-anuncio', async (req, res) => {
  const { item_id_cancelado } = req.body;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  try {
    // Tentando reativar o anúncio
    const response = await axios.put(`https://api.mercadolibre.com/items/MLB${item_id_cancelado}`, { status: 'active' }, {
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
