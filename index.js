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
