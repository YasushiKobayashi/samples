---
title: neovim/iTerm2/tmuxでAIエージェント出力からIDE風にファイルジャンプする
emoji: '📚'
type: 'tech' # tech: 技術記事 / idea: アイデア
topics: ['neovim', 'tmux', 'iTerm2', 'AI']
published: true
---

# はじめに

もともと Vim を使っており、ターミナルベースの開発環境を長年使ってきました。最近は Claude Code や Codex などの AI エージェントを中心に作業しており、これらのツールは標準出力にファイルパスや行番号を含むログを出すため、その内容をもとに編集内容のチェックなどを行っています。

Cursor などの IDE では、この出力に含まれるファイルパスをクリックすると該当箇所にジャンプできるし、開いているファイルからドラッグ&ドロップでファイルパスを AI エージェントに渡すことができて便利でした。

この記事では、neovim / iTerm2 / tmux の組み合わせで、AI エージェントの出力からファイルにジャンプでき、ファイルのパスを渡すことができる環境を構築する方法を紹介します。

# 実現したいこと

- iTerm2 のタブ運用はそのまま維持する
- tmux で左ペインに neovim、右ペインに AI エージェントを配置する
- AI の出力に含まれる `path`、`path:line`、`path:line:col` 形式のパスから即座にジャンプできる
- マウスクリック・キーボード操作の両方で開ける
- neovim で開いているファイルのパスを簡単に AI エージェントに渡せる

# 構成の概要

最終的な構成は以下のようになりました。

- **iTerm2**: タブでプロジェクトを切り替え
- **tmux**: 2 ペイン構成（左に neovim、右に AI エージェント）
- **3 つのジャンプ方法**:
  - `prefix + p`: fzf でパス候補を選択してジャンプ
  - `prefix + t`: tmux-thumbs でリンク選択風にジャンプ
  - `Cmd + Click`: iTerm2 の Semantic History でクリックジャンプ
- **ファイルパスのコピー**: `<Leader>f` で現在開いているファイルのフルパスをクリップボードにコピー

どの方法でも、選択したパスは既存の neovim インスタンスで開かれるため、複数のウィンドウが乱立することはありません。また、ファイルパスのコピーにより、IDE のドラッグ&ドロップのように AI エージェントにファイルを渡すことができます。

# 導入したツール

今回の構成で使用しているツールを紹介します。

- **tmux**: ペイン分割で neovim と AI エージェントを並べる
- **ripgrep（rg）**: AI 出力からパス候補を抽出
- **fzf**: パス候補の選択 UI

## nvr（neovim-remote）

既存の neovim インスタンスにリモートでファイルを送るためのツールです。新しいウィンドウを開かずに、すでに起動している neovim でファイルを開くことができます。

https://github.com/mhinz/neovim-remote

## tmux-thumbs

tmux プラグインで、画面内の文字列をヒント選択できます。IDE のリンククリック風の体験を実現できます。

https://github.com/fcsonline/tmux-thumbs

# インストール

macOS での基本的なインストール手順です。neovim / fzf は aqua で管理しています。

https://github.com/YasushiKobayashi/dotfiles/blob/main/aqua.yaml

```bash
# aqua でインストール（neovim, fzf）
aqua install

# brew でインストール（tmux, ripgrep）
brew install tmux ripgrep

# nvr（neovim-remote）
pip3 install neovim-remote
```

tmux-thumbs は tpm（tmux plugin manager）経由でインストールします。

1. `~/.tmux.conf` にプラグインを追記
2. tmux 起動後に `prefix + I` でインストール

Apple Silicon Mac の場合、tmux-thumbs のコンパイルには Rust が必要です。事前に `cargo` を入れておくとスムーズです。

# 設定の詳細

## neovim をディレクトリ由来のソケットで起動する

neovim-remote を使うには、neovim がソケットをリッスンしている必要があります。複数ディレクトリを並行で開く前提にしたかったので、**ディレクトリごとのソケット**で起動するラッパースクリプトを用意しています（1 ディレクトリ 1 つの nvim を想定）。

以下は基本的な処理の流れです（完全なコードはリポジトリを参照）。

```bash
#!/usr/bin/env bash
set -euo pipefail

hash_dir() {
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$1" | shasum -a 256 | awk '{print $1}' | cut -c1-12
  else
    printf '%s' "$1" | cksum | awk '{print $1}'
  fi
}

SERVER_DIR="$(cd "$PWD" 2>/dev/null && pwd -P)"
SOCK="/tmp/nvim-$(hash_dir "$SERVER_DIR").sock"
exec nvim --listen "$SOCK" "$@"
```

実際のスクリプトでは、既存サーバーのチェックやソケットファイルのクリーンアップ処理なども含まれています。

https://github.com/YasushiKobayashi/dotfiles/blob/main/bin/nvim-left

このスクリプトを `nvim-left` として `~/.local/bin` に配置しています。tmux の左ペインでは `nvim` の代わりに `nvim-left` を起動します。**接続先がディレクトリで決まる**ので、複数のプロジェクトを同時に開いても迷子になりません。
ただし **必須ではありません**。`nvr --serverlist` が 1 件だけの状態であれば、通常の `nvim` でも問題なくジャンプできます。`nvim-left` は「接続先を固定して迷わせない」ための保険という位置づけです。

## open_in_nvim_left: パスをパースして neovim に送る

AI の出力から抽出したパス文字列を受け取り、neovim に送るスクリプトです。主な機能は以下の通りです。

- `path:line:col`、`path:line`、`path` 形式に対応
- 相対パスは `TMUX_PANE_PATH` 環境変数を優先して解決（tmux から呼ばれた場合）
- iTerm2 の Cmd+Click の場合は `PWD` で解決
- **起動中の nvim を列挙し、ファイルパスと cwd の最長一致で選ぶ**
- 配下の cwd がある場合はそこを優先、なければ最も近いものに送る

https://github.com/YasushiKobayashi/dotfiles/blob/main/bin/open_in_nvim_left

## tmux_pick_path: fzf でパス候補を選択する

tmux のペイン出力からパス候補を抽出し、fzf で選択して neovim に送るスクリプトです。

処理の流れは以下の通りです。

1. `tmux capture-pane` でペインの出力を取得
2. `ripgrep` でパスらしき文字列を抽出
3. `fzf` で選択 UI を表示
4. 選択されたパスを `open_in_nvim_left` に渡す

https://github.com/YasushiKobayashi/dotfiles/blob/main/bin/tmux_pick_path

## tmux.conf の設定

tmux でのキーバインドとプラグインの設定です。

```bash
# fzf でパス候補を選択（display-popup で実行）
bind-key p display-popup -E "$HOME/.local/bin/tmux_pick_path"

# コピーモードで選択した文字列を neovim に送る
bind-key -T copy-mode-vi Enter send-keys -X copy-pipe-and-cancel "env TMUX_PANE_PATH='#{pane_current_path}' open_in_nvim_left"

# tmux-thumbs の設定
set -g @plugin 'fcsonline/tmux-thumbs'
set -g @thumbs-key t
set -g @thumbs-command 'TMUX_PANE_PATH="$(tmux display-message -p "#{pane_current_path}")" open_in_nvim_left "{}"'
```

`fzf` は TTY が必要なため、`run-shell` ではなく `display-popup` で実行する必要があります。`run-shell` で実行すると一瞬で消えてしまうので注意してください。

実際の設定ファイルでは、tmux-thumbs のパス検出用の正規表現なども含まれています。

https://github.com/YasushiKobayashi/dotfiles/blob/main/.tmux.conf

## iTerm2 の Semantic History 設定

マウスクリックでファイルを開けるようにするには、iTerm2 の Semantic History を設定します。

**Profiles > Advanced > Semantic History** で以下を設定します。

Command:

```
/bin/bash -lc "$HOME/.local/bin/open_in_nvim_left \"\1\""
```

Regular expression:

```
([A-Za-z0-9_./~+-]+/[A-Za-z0-9_./~+.-]+(?::\d+(?::\d+)?)?)
```

`/bin/sh` だと PATH が足りないため、`bash -lc` で実行するのがポイントです。そうしないと `nvr` コマンドが見つからずエラーになります。

## neovim でファイルパスをコピーする

IDE ではエディタからファイルをドラッグ&ドロップして AI エージェントにパスを渡すことができます。neovim でも同様の体験を実現するため、現在開いているファイルのフルパスをクリップボードにコピーするキーマッピングを設定します。

```vim
nnoremap <silent> <Leader>f :let @+=expand('%:p')<CR>:echo 'Copied: ' . expand('%:p')<CR>
```

この設定により、`<Leader>f` を押すだけでファイルのフルパスがクリップボードにコピーされ、そのまま AI エージェントのプロンプトにペーストできます。コピー後にはパスがエコー表示されるため、何がコピーされたか確認できます。

# 使い方

1. tmux の左ペインで `nvim-left` を起動
2. 右ペインで Claude Code などの AI エージェントを実行
3. 出力にファイルパスが表示されたら、以下のいずれかでジャンプ
   - `prefix + p`: fzf でパス候補を選択
   - `prefix + t`: tmux-thumbs でヒント選択
   - `Cmd + Click`: マウスでクリック
4. AI エージェントにファイルを渡したいときは、neovim で `<Leader>f` を押してパスをコピーし、右ペインにペースト

# ハマりポイントと解決策

## fzf が一瞬で消える

`run-shell` で fzf を実行すると TTY がないため即座に終了します。`display-popup` を使うことで解決しました。

## nvr が見つからない

iTerm2 の Cmd+Click は `/bin/sh` で実行されるため、通常の PATH が通りません。`bash -lc` でログインシェルとして実行することで、pyenv や pipx でインストールした `nvr` が見つかるようになります。

## ソケットファイルが残っている

neovim の異常終了時にソケットファイル `/tmp/nvim-*.sock` が残ってしまいます。`nvim-left` で起動を統一すれば、起動時にソケットの生存確認を行ってから起動するため安定します。

# 設定ファイル

今回の設定はすべて dotfiles リポジトリで管理しています。主なファイルは以下の通りです。

| ファイル                                                                                              | 説明                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------- |
| [bin/nvim-left](https://github.com/YasushiKobayashi/dotfiles/blob/main/bin/nvim-left)                 | neovim 起動ラッパー       |
| [bin/open_in_nvim_left](https://github.com/YasushiKobayashi/dotfiles/blob/main/bin/open_in_nvim_left) | パスパース + nvr 呼び出し |
| [bin/tmux_pick_path](https://github.com/YasushiKobayashi/dotfiles/blob/main/bin/tmux_pick_path)       | fzf 選択 UI               |
| [.tmux.conf](https://github.com/YasushiKobayashi/dotfiles/blob/main/.tmux.conf)                       | tmux 設定                 |

https://github.com/YasushiKobayashi/dotfiles

# まとめ

AI エージェントの出力からファイルを開く導線を作ることで、IDE 的な開発体験にかなり近づけることができました。

tmux と neovim-remote の組み合わせにより、新しいウィンドウを開かずに既存の neovim でファイルを開けるため、コンテキストを維持したまま作業を続けられます。また、fzf / tmux-thumbs / Cmd+Click の 3 つの方法を用意することで、状況に応じて使いやすい方法を選択できます。

ターミナルベースの開発環境を維持しながら AI エージェントを活用したい方の参考になれば幸いです。
