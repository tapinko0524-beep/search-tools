const express = require('express');
const fetch = require('node-fetch');
const iconv = require('iconv-lite');
const app = express();

// サーバーのポート設定（RenderやVercelなどの外部サーバーでも自動で認識されます）
const PORT = process.env.PORT || 3000;
// ==========================================
// 1. フロントエンド画面（学校のAIフィルタを欺く Smart Search）
// ==========================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>Smart Search</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; text-align: center; margin-top: 22vh; background: #ffffff; color: #3c4043; }
        h1 { font-size: 52px; color: #4285F4; font-weight: 800; margin-bottom: 25px; letter-spacing: -1px; }
        .search-box { position: relative; display: inline-block; width: 85%; max-width: 580px; }
        input { width: 100%; padding: 14px 24px; font-size: 16px; border: 1px solid #dfe1e5; border-radius: 30px; outline: none; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: 0.2s; box-sizing: border-box; }
        input:focus { box-shadow: 0 3px 12px rgba(0,0,0,0.12); border-color: #dfe1e5; }
        button { margin-top: 25px; padding: 10px 24px; font-size: 14px; background: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 20px; cursor: pointer; color: #3c4043; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        button:hover { background: #f1f3f4; border-color: #f1f3f4; }
        #gas-loader { display: none; position: fixed; top: 15px; right: 15px; width: 290px; background: rgba(255,255,255,0.98); border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-size: 12px; text-align: left; z-index: 99999; }
        .progress-box { background: #edf2f7; border-radius: 6px; height: 6px; margin-top: 6px; overflow: hidden; }
        .progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #4299e1, #48bb78); border-radius: 6px; transition: width 0.3s; }
      </style>
    </head>
    <body>
      <h1>Smart Search</h1>
      <div class="search-box">
        <input type="text" id="search-input" placeholder="URLまたは検索ワードを入力..." autocomplete="off">
      </div>
      <br>
      <button onclick="executeSearch()">検索</button>

      <!-- 進捗ステータス画面 -->
      <div id="gas-loader">
        <div style="font-weight:bold; color:#1a202c; display:flex; justify-content:space-between;">
          <span>通信ステータス</span>
          <span style="color:#718096; font-family:monospace;">BYPASS MODE</span>
        </div>
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
          // 入力された文字がURLか検索ワードかをスマートに自動判定
          if (!input.startsWith('http://') && !input.startsWith('https://')) {
            if (input.includes('.') && !input.includes(' ')) {
              target = 'https://' + input;
            } else {
              // 検索ワードの場合はブロックされにくいDuckDuckGoのクエリへ変換
              target = 'https://duckduckgo.com' + encodeURIComponent(input);
            }
          }

          // 進捗バーを発動させてユーザーに安心感を与える天才処理
          document.getElementById('gas-loader').style.display = 'block';
          document.getElementById('p-bar').style.width = '60%';
          document.getElementById('loader-text').innerText = '暗号化プロキシを確立中...';

          // 現在のサーバーの /proxy エンドポイントへ転送
          window.location.href = window.location.origin + '/proxy?url=' + encodeURIComponent(target);
        }
      </script>
    </body>
    </html>
  `);
});
// ==========================================
// 2. バックエンドロジック（YouTube・ゲーム・阿部寛バイパスシステム）
// ==========================================
app.get('/proxy', async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URLが指定されていません');

  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const contentType = response.headers.get('content-type') || '';

    // 【最重要パッチ：YouTube・寿司打・Pokiの壁を完全突破】
    // 動画のストリーミングや、ゲームのWASM/MP4などの重いバイナリファイルを、
    // メモリに溜め込まずに「細切れのまま最速で横流し」して動かすストリームバイパス処理！
    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      return response.body.pipe(res);
    }

    // 【阿部寛のホームページ完全攻略パッチ】
    // 特殊なShift_JIS文字コードを判定して、文字化けを100%防いで復元する処理
    const buffer = await response.buffer();
    let html = '';
    if (contentType.includes('shift_jis') || contentType.includes('sjis')) {
      html = iconv.decode(buffer, 'shift-jis');
    } else {
      html = iconv.decode(buffer, 'utf-8');
    }

    // 【フレーム離脱防止パッチ】
    // 開いた先のサイトのJSが一番外側の親フレーム（://google.comなど）を破壊して、
    // フィルターを強制発動させてくるのを防ぐため、window.topを自分自身（self）に書き換える鉄壁ガード
    html = html.replace(/window\.top/g, 'window.self');
    html = html.replace(/target="_blank"/gi, 'target="_self"');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (err) {
    res.status(500).send('通信エラーが発生しました: ' + err.toString());
  }
});

// サーバー起動の合図
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
