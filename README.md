# 合同会社Vaynexis 公式サイト

滋賀県愛知郡愛荘町のEC物販会社「合同会社Vaynexis」の公式ウェブサイトのソースです。

- 公開 URL: <https://vaynexis.jp/>
- ホスティング: Cloudflare Workers（静的アセット。GitHub `harukinaemura/vaynexis-website` の main へ push で自動デプロイ）
- ドメイン: vaynexis.jp（2026年6月11日取得・お名前.com、NS は Cloudflare）

## 構成

フレームワーク・ビルド工程なし。HTML / CSS をそのまま配信する。JavaScript は使っていない。

```
.
├── index.html        # トップ（宣言・会社記録・事業概要・取引方針・会社概要・お問い合わせ）
├── business.html     # 事業内容（EC物販事業・取引の流れ・取引方針）
├── company.html      # 会社概要・代表メッセージ
├── contact.html      # お問い合わせ
├── privacy.html      # プライバシーポリシー
├── tokushoho.html    # 特定商取引法に基づく表記
├── assets/
│   ├── style.css     # 全ページ共通（藍と銅の台帳）
│   ├── favicon.svg
│   └── og-image.png  # SNS 共有用（紺地に VAYNEXIS）
├── wrangler.jsonc    # Cloudflare Workers の設定（assets directory "./"）
├── robots.txt
└── sitemap.xml
```

## デザイン（2026-09-09 リニューアル「藍と銅の台帳」）

- 地: 白 `#f9f9f7` ／ 文字: 紺 `#1b2a41` ／ 濃紺の帯 `#12203a` ／ 差し色: 銅 `#b08d57`（罫線・番号・ロゴの「合同会社」）
- 書体: Zen Kaku Gothic New（日本語）＋ Instrument Sans（VAYNEXIS の字組み）＋ IBM Plex Mono（設立日・法人番号・電話番号などの数字）
- 罫線 1px・角丸 0・影 0。台帳のように、番号・見出し・本文を罫線で区切る
- 写真は使わない（宣言と数字で成立させる）。トップの「Company Record」は登記情報そのもの
- 単一テーマ（白）。ダークモードは意図的に作っていない

## 会社情報の出所

登記簿・法人番号通知書（2026-06-11 の制作記録より）＝設立 2026-04-30・資本金 100 万円・法人番号 8160003003794・〒529-1214。
本文は 2026-06-11 版の文言をそのまま引き継いでいる（新規の創作なし）。

## デプロイ

1. このフォルダの内容を GitHub `harukinaemura/vaynexis-website` の main へ push
2. Cloudflare Workers が自動でデプロイ（ビルドなし）
3. 反映後、シークレットウィンドウで https://vaynexis.jp/ を確認

## ローカル確認

```bash
python -m http.server 8766 --directory .
# → http://localhost:8766/
```

## 連絡先

- 合同会社Vaynexis
- 〒529-1214 滋賀県愛知郡愛荘町宮後130番地
- TEL: 090-1079-0692（平日 10:00–18:00）／ vaynexis@gmail.com
