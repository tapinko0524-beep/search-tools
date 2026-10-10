const express = require('express');
const fetch = require('node-fetch');
const iconv = require('iconv-lite');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>Smart Search</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; margin-top: 22vh; background: #ffffff; color: #3c4043; }
        h1 { font-size: 52px; color: #4285F4; font-weight: 800; margin-bottom: 25px; letter-spacing: -1px; }
        input { width: 85%; max-width: 580px; padding: 14px 24px; font-size: 16px; border: 1px solid #dfe1e5; border-radius: 30px; outline: none; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: 0.2s; }
        button { margin-top: 25px; padding: 10px 24px; font-size: 14px; background: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 20px; cursor: pointer; color: #3c4043; font-weight: 500; }
        #gas-loader { display: none; position: fixed; top: 15px; right: 15px; width: 290px; background: rgba(255,255,255,0.98); border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-size: 12px; text-align: left; }
        .progress-box { background: #edf2f7; border-radius: 6px; height: 6px; margin-top: 6px; overflow: hidden; }
        .progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #4299e1, #48bb78); border-radius: 6px; transition: width 0.3s; }
      </style>
    </head>
    <body>
      <h1>Smart Search</h1>
      <input type="text" id="search-input" placeholder="URLまたは検索ワードを入力..." autocomplete="off">
      <br>
      <button onclick="executeSearch()">検索</button>
      <div id="gas-loader">
        <div style="font-weight:bold; color:#1a202c;">通信ステータス <span style="float:right; color:#718096;">BYPASS MODE</span></div>
        <div id="loader-text" style="color:#4a5568; margin-top:4px;">中継サーバーに接続中...</div>
        <div class="progress-box"><div id="p-bar" class="progress-bar"></div></div>
      </div>
      <script>
        document.getElementById('search-input').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') executeSearch();
        });
        function executeSearch() {
          var input = document.getElementById('search-input').value.trim();
          if (!input) return;
          var target = input;
          if (!input.startsWith('http://') && !input.startsWith('https://')) {
            if (input.includes('.') && !input.includes(' ')) { target = 'https://' + input; }
            else { target = 'https://duckduckgo.com' + encodeURIComponent(input); }
          }
          document.getElementById('gas-loader').style.display = 'block';
          document.getElementById('p-bar').style.width = '60%';
          document.getElementById('loader-text').innerText = '暗号化プロキシを確立中...';
          window.location.href = window.location.origin + '/proxy?url=' + encodeURIComponent(target);
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/proxy', async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URLがありません');

  // 【ハルくんのGASロジック完全移植！】
  // DuckDuckGoのリダイレクトURL（/l/?uddg=...）を検知したら、本物のURLを自動で引っこ抜く
  if (targetUrl.includes('duckduckgo.com') && targetUrl.includes('uddg=')) {
    try {
      const match = targetUrl.match(/[?&]uddg=([^&]+)/);
      if (match && match[1]) {
        targetUrl = decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }

  if (!/^https?:\/\//i.test(targetUrl)) { targetUrl = 'https://' + targetUrl; }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      return response.body.pipe(res);
    }

    const buffer = await response.buffer();
    let html = '';
    if (contentType.includes('shift_jis') || contentType.includes('sjis')) {
      html = iconv.decode(buffer, 'shift-jis');
    } else {
      html = iconv.decode(buffer, 'utf-8');
    }

    // 【相対パス・/html/のバグ完全修正パッチ】
    // ページ内にある不完全なリンクやformの送信先を、自動でこのプロキシ経由（絶対パス）に書き換える天才処理
    const baseUrl = new URL(targetUrl);
    html = html.replace(/(href|action)="(?!http|https|mailto|javascript:)(\/?)/gi, (match, p1, p2) => {
      return `${p1}="${req.protocol}://${req.get('host')}/proxy?url=${encodeURIComponent(baseUrl.origin + (p2 === '/' ? '' : '/'))}`;
    });

    // 検索結果のaタグのリンク自体に強制パッチを当てて、中継ページをすっ飛ばす
    html = html.replace(/href="https:\/\/duckduckgo\.com\/l\/\?uddg=([^"]+)"/gi, (match, p1) => {
      return `href="${req.protocol}://${req.get('host')}/proxy?url=${p1}"`;
    });

    html = html.replace(/window\.top/g, 'window.self');
    html = html.replace(/target="_blank"/gi, 'target="_self"');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send('エラー: ' + err.toString());
  }
});

app.listen(PORT, () => console.log(`Proxy ready on port ${PORT}`));
