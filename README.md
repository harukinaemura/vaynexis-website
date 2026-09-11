# 合同会社Vaynexis 公式サイト（v3・2026-09-11）

滋賀県愛知郡愛荘町の合同会社Vaynexisの公式ウェブサイトのソースです。v3 で AI コンサルティング事業をトップの中心に据え、EC 物販事業は事業内容と会社概要に残しました。

- 公開 URL: <https://vaynexis.jp/>
- ホスティング: Cloudflare Workers（静的アセット。GitHub `harukinaemura/vaynexis-website` の main へ push で自動デプロイ）
- ドメイン: vaynexis.jp（お名前.com、NS は Cloudflare）

## 構成

```
.
├── index.html        # トップ（宣言・検査コンソールのデモ・自社実績・振り分け・提供するもの・進め方・会社・FAQ）
├── ai.html           # AIコンサルティング（なぜ確かめるか・振り分け・提供するもの・月次レポート・行わないこと・契約の条件・進め方・FAQ）
├── price.html        # 料金（一覧・顧問料の仕組み・最低額と上限・目安・返金保証・支払）
├── record.html       # 自社での実績（削減時間を出さない理由・実測値と数え方・公開している記録）
├── business.html     # 事業内容（AIコンサルティング・EC物販事業）
├── company.html      # 会社概要・代表メッセージ
├── contact.html      # お問い合わせ・30分の無料相談
├── privacy.html      # プライバシーポリシー（2026-09-11 改定）
├── tokushoho.html    # 特定商取引法に基づく表記（EC 物販）
├── assets/
│   ├── style.css     # 全ページ共通（v3「白い管制室」）
│   ├── site.js       # ナビの開閉・トップの背景・検査コンソール（架空の例）
│   ├── favicon.svg
│   └── og-image.png
├── wrangler.jsonc    # Cloudflare Workers の設定（assets directory "./"）
├── robots.txt
└── sitemap.xml
```

ページは `_build_v3/build.py` が生成します。共通部（head・ナビ・フッター・帯）と本文はそこに書いてあり、直すときはこの HTML ではなく `build.py` を直して再生成してください。
`_artifact_index.html` は検収用（Claude の Artifact に載せる断片）で、デプロイには含めません。

```bash
python _build_v3/build.py     # 50_AI/vaynexis-website から実行
```

## デザイン（v3「白い管制室」）

- 地: わずかに青みのある白 `#f4f6fa` ／ 帯 `#e9edf4` ／ 文字: 紺 `#1b2a41` ／ 細部: 銅 `#b08d57`（文字は `#8f6f3f`）／ 合格を示す氷色 `#2b8fd6` ／ 差し戻し `#c8463f`
- 書体: Zen Kaku Gothic New（日本語）＋ Michroma（英字の小さなラベル）＋ IBM Plex Mono（数字）
- 造形: 角を落としたガラスの板（clip-path）・隅の照準線・遠近の床（canvas）・罫線 1px
- 写真は使わない。トップの検査コンソールは架空の例で、その旨をページに明記している
- 単一テーマ（明るい世界に固定）。ダークモードは作っていない

## 文言の出所

- 会社情報＝登記簿・法人番号通知書（設立 2026-04-30・資本金 100 万円・法人番号 8160003003794・〒529-1214）
- EC 物販の本文・取引の流れ・取引方針・特商法・プライバシーの条文＝2026-06-11 版をそのまま引き継ぎ（プライバシーは 1 条と 2 条にコンサルティングを追記）
- AI コンサルティングの本文・料金・契約条件＝`50_AI/HP_AIコンサル_設計と下準備_2026-09-10.md` と `50_AI/HP_AIコンサル_設計の深掘り_2026-09-11.md`、および 2026-09-11 の決定（分配率 50%・年商 1% を月額の上限・決算書で確認・最初の 3 か月は最低額なし）
- 自社実績の数字＝2026-09-10 の設計書の実測値。公開日に数え直すこと

## デプロイ

1. `_v3/` の内容（`_artifact_index.html` と `README.md` 以外の全ファイル）を GitHub `harukinaemura/vaynexis-website` の main へ push
2. Cloudflare Workers Builds が自動でデプロイ（約 15 秒〜1 分）
3. `curl -s https://vaynexis.jp/ | grep -c "Audit Console"` で新版が出たことを確認する（push は反映ではない）

## ローカル確認

```bash
python -m http.server 8766 --directory .
# → http://localhost:8766/
```
