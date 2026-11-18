---
title: launchd/gh/git worktreeでGitHubのレビュー依頼からローカルのClaude Codeを自動起動する
emoji: '📚'
type: 'tech' # tech: 技術記事 / idea: アイデア
topics: ['claudecode', 'go', 'launchd', 'git', 'AI']
published: true
---

レビュー依頼が飛んできても、手が離せないタイミングだと数時間放置してしまうことがよくありました。自分が見るまでの間に、差分をひと通り読んだ結果だけでも用意されていてほしいと考えていました。

公式の `anthropics/claude-code-action` を使えば GitHub Actions の中で完結しますが、今回やりたかったのは「手元の Mac で動いている Claude Code を起動する」ことでした。ローカルで起動すれば普段使っている MCP サーバーや設定がそのまま効きますし、自動レビューの続きをそのまま対話で引き継げます。CI の中で完結する仕組みでは、このどちらも手に入りません。

そこで launchd / gh CLI / `git worktree` / SQLite を組み合わせて、レビュー依頼を検知してローカルの Claude Code を起動する CLI を Go で書きました。この記事では、その構成と実装中に判断したことを整理します。

```text
launchd (StartInterval 180)
  └─ reviewd poll
       ├─ gh CLI で GitHub の状態を取得
       ├─ SQLite の処理済みカーソルと突き合わせて新規イベントを抽出
       ├─ rules.yaml でマッチング (event × repo × author × label × draft)
       └─ git worktree を用意 → claude を起動 → 結果を保存 → macOS 通知
```

https://github.com/YasushiKobayashi/agent-dispatch

リポジトリ名は agent-dispatch で、この中に入っている CLI の名前が `reviewd` です。将来ほかのイベント起点の常駐も足すつもりなので、レビュー用のデーモンという意味の名前を CLI 側に付けています。

## gh searchでレビュー依頼を拾ってhead SHAで処理済みを覚える

GitHub の認証を自分で持ちたくなかったので、検知はすべて gh CLI に委譲しています。`reviewd` はトークンを一切保持せず、`gh auth login` 済みの状態にそのまま乗ります。

```sh
gh search prs --review-requested=@me --state=open --json \
  number,title,url,repository,author,isDraft,labels --limit 50
```

`gh search prs` は head SHA と base ref を返してくれないため、ヒットした PR ごとに 1 回だけ追加で取得しています。レビュー依頼中の open PR は多くても数件なので、この追加呼び出しは許容しました。ヒットが 0 件なら追加呼び出しも発生しません。

```sh
gh pr view <N> --repo <owner>/<name> --json \
  headRefName,headRefOid,baseRefName,isDraft,labels,author,title,url
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/source/github/client.go

3 分おきに起動する以上、同じ PR で何度も走らせないための冪等キーが必要になります。ここは **head SHA** を採用しました。PR の node ID で固定すると 1 PR につき一生に 1 回しか走らないので、「指摘を直して push したからもう一度見てほしい」が拾えません。head SHA にしておくと、レビュー依頼が出ている間は commit が積まれるたびに 1 回だけ走ります。レビュアーとしての振る舞いに近いのはこちらでした。

```sql
CREATE TABLE IF NOT EXISTS processed (
    repo         TEXT    NOT NULL,
    pr_number    INTEGER NOT NULL,
    kind         TEXT    NOT NULL,
    cursor       TEXT    NOT NULL,
    processed_at TEXT    NOT NULL,
    PRIMARY KEY (repo, pr_number, kind, cursor)
);
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/store/store.go

`processed` への記録は、claude の実行が成功したかどうかに関係なく **起動を試みた時点で** 入れています。成否を見てから記録する実装にすると、claude が落ちるたびに次の poll で再実行され続けます。無人で 3 分おきに回るものなので、失敗が続いた分だけトークンを溶かす事故のほうが怖いです。やり直したいときは `reviewd run --repo owner/name --pr 123` で明示的に叩きます。

driver は `modernc.org/sqlite` にしました。pure Go で cgo が要らないので、後述の Linux runner からの darwin クロスビルドがそのまま通ります。claude の実行は数分単位で続くため、WAL と `busy_timeout` を入れて実行中の poll が次の poll を止めないようにしています。

導入直後の事故を防ぐために `reviewd seed` も用意しました。現時点で検知できるイベントを、実行せずに `processed` へ記録するだけのコマンドです。これを踏まずに launchd へ登録すると、溜まっていたレビュー依頼が一斉に発火します。

## bare mirrorとworktreeで作業中のブランチに触らせない

自動で動くものに、自分が作業しているリポジトリを触らせたくありませんでした。勝手に `git switch` が走って作業ツリーを書き換えられるのは、一番避けたい事故でした。

そこで `~/.reviewd/repos/<owner>__<name>.git` に専用の bare mirror を作り、そこから detached の worktree を生やす形にしました。レビュー対象の取得は `refs/pull/<N>/head` 経由にしているので、fork からの PR も同じ経路で動きます。

```sh
git clone --mirror https://github.com/<owner>/<name>.git ~/.reviewd/repos/<owner>__<name>.git
git fetch origin +refs/pull/<N>/head:refs/reviewd/pr/<N>
git worktree add --detach ~/.reviewd/worktrees/<owner>__<name>/<name>-pr<N> <head SHA>
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/worktree/worktree.go

private リポジトリの clone も通したかったので、mirror には credential helper として `!gh auth git-credential` を焼き込んでいます。これで Git の認証も gh CLI 側に寄せられました。

worktree のディレクトリ名を `pr-42` ではなく `<repo>-pr42` にしているのは、ターミナルのタブがカレントディレクトリ名をタイトルにするからです。後述の Ghostty モードでタブが何本か生えると、`pr-42` だけではどのリポジトリのレビューか判別できませんでした。こういう細かいところは実際に使ってみて直しています。

## rules.yamlでイベントとプロンプトを対応づける

レビュー観点は `/code-review` のような skill に丸投げせず、`rules.yaml` に自分で書く方式にしました。レビュー依頼と CI 失敗で観点を差し替えたかったので、ルール単位でプロンプトを持てる形を優先しています。skill の呼び出し自体もプロンプト文字列として書けるため、こちらのほうが上位互換です。実際の運用ではこの性質に寄りかかって、プロンプトを skill の呼び出し 1 行にしています（後述）。

```yaml
version: 1
rules:
  - name: review-requested
    on: [review_requested]
    match:
      repos: ['YasushiKobayashi/*']
      exclude_authors: ['*[bot]']
      exclude_labels: ['wip', 'do-not-review']
      include_draft: false
    action:
      prompt: |
        {{.Repo}}#{{.PRNumber}} をレビューして。
        差分は `git diff origin/{{.BaseRefName}}...HEAD`。
      timeout: 20m
      notify: true
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/cli/templates/rules.yaml

ルールは上から順に評価して、最初にマッチした 1 本だけを実行します。`exclude_*` は対応する許可リストより常に先に評価されるので、bot の PR を弾くのに `repos` 側の書き方を気にしなくて済みます。パターンは `*` / `**` / `?` だけを扱うごく小さい glob を自前で書きました。それ以外の文字は `regexp.QuoteMeta` でリテラル化するため、ユーザーが何を書いてもコンパイルは失敗しません。呼び出し側で error 分岐を増やさずに済むのが地味に効いています。

`action.prompt` は Go の `text/template` で、`{{.Repo}}` `{{.PRNumber}}` `{{.HeadSHA}}` `{{.BaseRefName}}` などが使えます。テンプレートは設定ファイルのロード時にコンパイルして検証しているので、文法を間違えていれば `reviewd rules validate` の時点で分かります。

無人で動くものは「なぜ動かなかったか」が分からないと詰むので、マッチング結果は全ルール分を理由付きで返すようにしました。`reviewd poll --dry-run` は実行と記録をどちらも行わず、拾われなかった PR に `no-rule` と理由を出します。bot の PR が意図通り落ちているかは、ここを見て確認しています。

## レビュー後に作成者が返信したPRもauthor_commentedで拾う

しばらく `review_requested` だけで運用していて、拾えていないケースがあることに気づきました。GitHub ではレビューを出した時点で自分へのレビュー依頼が外れます。作成者が指摘に返信しても、改めてレビュー依頼を出し直してくれない限り `--review-requested=@me` の検索には出てきません。返信に気づかないまま数日放置してしまうことがあり、これが漏れていました。

そこで、自分がレビューした open PR に作成者本人がコメントしたら起動する `author_commented` というイベント種別を足しました。

https://github.com/YasushiKobayashi/agent-dispatch/pull/2

レビュー依頼は外れてしまうので、探索には `--reviewed-by` を使います。ヒットした PR ごとに、会話欄のコメント・review・インラインコメントを取得しています。

```sh
gh search prs --reviewed-by=<login> --state=open --sort updated --json \
  number,title,url,repository,author,isDraft,labels --limit 50
gh pr view <N> --repo <owner>/<name> --json headRefName,headRefOid,baseRefName,comments
gh api repos/<owner>/<name>/pulls/<N>/reviews  --paginate --jq '.[]'
gh api repos/<owner>/<name>/pulls/<N>/comments --paginate --jq '.[]'
```

`--paginate` だけだとページごとの JSON 配列がそのまま連結されて出力され、全体として不正な JSON になります。`--jq '.[]'` で 1 行 1 オブジェクトにしてから読んでいます。

拾うのは「自分が最後に発言した後で書かれた、PR 作成者本人のコメント」だけです。他のレビュアーのコメントや CI の結果を書き込む bot まで拾うと、ノイズで起動しまくります。自分がまだレビューしていない PR は `review_requested` の担当なので、こちらでは何もしません。細かいところでは、インラインコメントの時刻を `created_at` ではなく所属する review の提出時刻で見ています。下書き中のコメントの `created_at` は下書きを書いた時刻になっていて、相手に見えるのは review を提出したときだからです。

冪等キーは head SHA ではなく、最新の作成者コメントの ID にしました。作成者が連投しても 1 回だけ走り、その後さらに返信があればもう一度走ります。最新のコメントが削除されると cursor が 1 つ前のコメントに戻ってしまうので、処理済みにするときはプロンプトに含めた全コメントの ID も記録しています。

プロンプトでは `{{.Comments}}` で作成者のコメントを古い順に渡せます。返信を読みながらそのまま会話を続けたいので、自分は後述の Ghostty モードで起動しています。

```yaml
- name: author-commented
  on: [author_commented]
  match:
    exclude_authors: ['*[bot]']
  action:
    mode: ghostty
    prompt: |
      {{.Repo}}#{{.PRNumber}} の作成者から返信が来た。
      {{range .Comments}}
      - {{.URL}}{{if .Path}} (`{{.Path}}:{{.Line}}`){{end}}
        {{.Body}}
      {{end}}
```

この種別は PR 1 件ごとに gh を追加で 2 回叩くので、`on` に持つ有効なルールが無ければ検索自体を行わないようにしています。また、同じ PR で `review_requested` と同時に検知された場合は、1 回の poll では片方だけ走らせて残りを次の poll に回します。worktree のパスが PR 単位で共通なので、並行に走ると互いに消し合ってしまうためです。

コメント本文はそのままプロンプトに入るので、作成者が書いた指示に claude が従ってしまう余地はあります。作成者以外のコメントを拾わないのは、ノイズを減らすと同時にこの影響範囲を PR 作成者に限る意味もあります。

## claude -pをheadlessで走らせて結果をファイルに残す

デフォルトの実行モードは headless です。worktree の中で `claude -p` を起動し、stdout の stream-json をそのまま保存して、最後の `result` イベントからレビュー本文を取り出します。

```text
~/.reviewd/runs/<owner>__<name>/pr-<N>/<timestamp>/
  result.md     レビュー本文（通知のクリック先）
  stream.jsonl  claude の stream-json 生ログ
  stderr.log    claude の stderr
  meta.json     イベント / ルール / status / exit code / コスト / プロンプト
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/runner/runner.go

タイムアウトの扱いだけは実装でひと手間かかりました。`context.WithTimeout` で超過を検知したあと、`Setpgid` でプロセスグループを作っておいて `cmd.Cancel` でグループごと SIGTERM を送り、`WaitDelay` で SIGKILL に落としています。claude は子プロセスを持つので、素朴に親だけ kill すると孫が生き残ります。テストでは shell script の偽 claude を PATH に置いて実プロセスとして起動し、孫が残らないことまで確認しました。タイムアウトしても `stream.jsonl` に届いていた分は `result.md` に残します。

権限のデフォルトは読み取り専用に寄せています。最初は `--permission-mode plan` で止めようとしたのですが、plan モードは「実行せず計画を返す」挙動になるため、レビュー本文がそもそも返ってきませんでした。代わりに `--allowedTools` で `Read` / `Grep` / `Glob` と `git diff|log|show|status|rev-parse` だけを許可し、`--disallowedTools` で `Edit` / `Write` / `git push|commit` / `gh` を明示的に塞いでいます。`claude -p` は許可を人に尋ねられないので、未許可のツールは黙って拒否されます。

一方で後述の対話モード側は、この締め付けを外してデフォルトを空にしました。許可を尋ねられないことへの対策であって、人が見ているセッションには要らない制限です。しかも `--disallowedTools` は実行時に覆せないため、ここで `Write` や `gh` を塞ぐと「タスクファイルを残して」「PR の説明を読んで」系のプロンプトが壊れます。同じ設定を両モードで共有しなかったのは、この非対称があったからです。

モデルは `--model` で明示的に固定しています。`--model` はコマンドラインの指定が `settings.json` や `ANTHROPIC_MODEL` より優先されるので、自分の見ていない設定の変更に引きずられて意図しないモデルで走る事故を防げます。ただしデフォルト値にしている `default` は「安いモデル」という意味ではなく、アカウント設定次第で Opus 系に解決されることもあります。実機確認では確認用の軽いプロンプト 1 回で 0.59 ドルかかりました。大半は大きいリポジトリの cache creation 分です。コストを抑えたいなら `model: sonnet` のように明示したほうが確実です。

## Ghosttyのタブで対話モードのclaudeを生やす

headless で回していると、結果を読んで「ここもう少し詳しく見てほしい」と思ったときに続きの対話ができません。そこで `mode: ghostty` を足しました。レビュー依頼を検知したら、その PR の worktree で claude が起動済みのタブが勝手に生えている状態を作るモードです。

Ghostty は 1.3 で AppleScript の辞書が入ったので、`osascript` からタブを作れます。

```applescript
tell application "Ghostty"
  set cfg to new surface configuration
  set command of cfg to "/bin/sh -c '...'"
  set initial working directory of cfg to "<worktree>"
  set environment variables of cfg to {"REVIEWD_REPO=...", "REVIEWD_PR=..."}
  set wait after command of cfg to true
  set t to new tab in window 1 with configuration cfg
end tell
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/ghostty/ghostty.go

ここで一番危なかったのが `new tab` の引数です。`in <window>` を省くと `-1708 (Can't continue new tab)` が返りますが、**その時点でタブは作られてコマンドも走っています**。エラーだと思って素朴に再試行すると、同じレビューのタブが二重に開いて claude も 2 本立ち上がります。window が 0 枚のときだけ `new window` にフォールバックして、それ以外は必ず `in window 1` を付ける形に直しました。

プロンプトはタブに直接渡さず、`prompt.md` に書き出して `/bin/sh -c 'exec claude <args> "$(cat <run-dir>/prompt.md)"'` で読ませています。レビュープロンプトは複数行あり、バッククォートや引用符を含みます。AppleScript のリテラルとシェルの二重引用をくぐらせる書き方だと、プロンプトを少し書き換えただけで壊れました。引用の 2 層は実シェルと実パーサに通して往復テストしています。

このモードでは worktree を掃除しません。claude がまだそのディレクトリを使っていて、`reviewd` 側は終了を知る手段がないからです。`status` も `success` ではなく `launched` にしてあります。タブの中身は AppleScript から読めず、`terminal` クラスのプロパティは `id` / `name` / `working directory` の 3 つしかないので、成否は原理的に分かりません。出力を回収したいなら headless か、`capture-pane` が使える tmux 版を作るしかなさそうです。

対話セッションは Remote Control を有効にして起動しています。セッション名に `reviewd-<owner>__<name>-pr<N>` を自動で付けているので、別のデバイスからどの PR のレビューかを見分けて操作できます。ここで PR ごとの名前を付けないと、機械上のほかのセッションと区別できず Remote Control の意味がなくなります。

## launchdのPATHと環境変数をplistに焼き込む

実装の中で一番つまずいたのは launchd でした。ターミナルでは完全に動くのに、launchd 配下では `gh: command not found` で落ちます。aqua や Homebrew の shim は launchd のデフォルト PATH に入らないためです。

対策として、`daemon install` の時点で解決した PATH を plist へ焼き込む形にしました。ツールの管理方法を入れ替えたら `reviewd daemon install` をやり直す運用です。

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/internal/daemon/daemon.go

PATH だけでは足りないのも実機で分かりました。plist には次の環境変数も、設定されているものだけ一緒に焼き込んでいます。

- `AQUA_GLOBAL_CONFIG` などの aqua 系: shim が PATH 上にあっても、これが無いと aqua 自身が `gh: command is not found` を返す
- `XDG_CONFIG_HOME` / `GH_CONFIG_DIR`: gh は `hosts.yml` をここから探す。`~/.config` 以外に置いていると、launchd 配下の gh だけが「`gh auth login` を実行してください」になる
- `XDG_DATA_HOME` / `XDG_CACHE_HOME` / `CLAUDE_CONFIG_DIR`

ターミナルでは通っているのに launchd 配下の gh だけが未認証扱いになる症状は、原因に辿り着くまで時間がかかりました。dotfiles で `XDG_CONFIG_HOME` を動かしている環境なら、同じところで止まるはずです。

同じ環境は Ghostty のタブにも渡しています。Ghostty は launchd が起動する GUI アプリで、PATH が `/usr/bin:/bin:/usr/sbin:/sbin` しかありません。タブで動かすコマンドはログインシェルを経由しないため、素の `claude` ではセッションが始まる前に `claude: not found` で落ちました。

多重起動の防止は `~/.reviewd/reviewd.lock` の flock です。`StartInterval` は 180 秒ですが、claude の実行は 20 分までかかります。前の poll が走っていれば即座に exit 0 で抜けます。flock は open file description 単位なので、同一プロセスから 2 回目を取ろうとしても弾かれます。1 回の poll で起動するジョブ数にも上限を置き、溢れた分は `processed` に記録せず次の poll に回しています。

## 前面に出てくるGhosttyを元のアプリに戻す

Ghostty モードで一番厄介だったのは、レビューを検知するたび、Ghostty が前面へ出てきてしまうことでした。別のエディタで作業している最中にフォーカスを奪われるので、実用上かなり邪魔です。

Ghostty v1.3.1 のソースを読むと、`new tab` と `new window` は `TerminalController` の中で `makeKeyAndOrderFront` と `NSApp.activate(ignoringOtherApps: true)` を **`DispatchQueue.main.async` で後から** 呼んでいました。AppleScript のコマンドが返った時点ではまだ activate しておらず、別プロセスの `osascript` で前面アプリを戻そうとしても、後から来た Ghostty の activate が勝ちます。設定で止める手段は無いので、AppleScript 経由では「一瞬も前に出ない」は実現できず、戻す方向で作るしかありませんでした。

もう 1 つハマったのが、戻す先の取得です。元の前面アプリを `lsappinfo front` で取っていたのですが、実測では `com.apple.universalcontrol` が返ってくることがありました。これは `type=UIElement` なので activate しても通常のアプリは前へ戻らず、Ghostty が前面に残り続けます。`lsappinfo visibleProcessList` は通常のアプリだけを前面から順に返すので、その先頭を使う形に変えました。

```sh
$ lsappinfo visibleProcessList
ASN:0x0-0x18018-"Zed": ASN:0x0-0x17017-"Ghostty": ...
```

最終的に、1 本の `osascript` の中で「Ghostty が frontmost になり、かつ新しいタブが選択される」まで `delay 0.01` で待ち、選択タブを元に戻してから、元の前面アプリを activate する形にしました。待ってから戻すのが重要で、待たずに戻すと後から来た activate に負けます。

`lsappinfo` を 15 ミリ秒間隔でサンプリングして計測すると、既存ウィンドウへのタブ追加で 0.13 秒ほど、新規ウィンドウで 0.06 秒ほど Ghostty が前面にいて、そのあと元のアプリに戻っていました。選択タブも元のままです。ちらつきは残りますが、フォーカスが奪われたままになることはなくなりました。

「Ghostty が前面にいるときまでタブ作成を保留する」案も検討しました。これなら他アプリには一切出ませんが、Ghostty を触るまでレビューが始まりません。自動で先に進んでいてほしいのが元々の動機なので、確実に戻す方を採りました。

## MCPを使いたいときはworktreeを捨てて既存cloneで起動する

ここまでの構成は「作業中のリポジトリを一切触らない」を徹底していますが、実際に Ghostty モードで使ってみると MCP サーバーが 1 本も見えないという問題に当たりました。

原因は Claude Code の設定がセッションを開始したディレクトリに紐づくことです。`claude mcp add` のデフォルトは `local` スコープで、`~/.claude.json` にパスをキーとして保存されます。`reviewd` が毎回新しい worktree を作る以上、そこからは設定済みの MCP サーバーが見えません。`.mcp.json` の project スコープも承認がパス単位なので、PR ごとに新しいパスでは毎回セットアップの確認が出ます。

`user` スコープへ移せば解決しますが、リポジトリ単位で MCP を管理したい場合には使えません。そこで `action.workdir` を足して、worktree を作らず既存の clone でそのまま起動できるようにしました。

```yaml
action:
  mode: ghostty
  workdir: ~/go/src/github.com/owner/repo
  prompt: |
    まず、このリポジトリの作業ツリーとブランチには一切触らずに、
    レビュー専用の worktree を作ってそこへ移動してください。

    git fetch origin refs/pull/{{.PRNumber}}/head
    git worktree add --detach ../{{.Name}}-pr{{.PRNumber}} {{.HeadSHA}}
    cd ../{{.Name}}-pr{{.PRNumber}}

    （`git switch` / `git checkout` は使わないこと）
```

隔離の担保をプロンプト側に移す形なので、ツールとしての保証は弱くなります。この方式では clone の `.git` に PR の ref と worktree の管理情報が書き込まれるため、「作業中のリポジトリを一切触らない」は「現在のブランチと作業ツリーには触らない」まで緩みます。`fetch` と `git worktree add` は HEAD や作業ツリーを変えないので実害はありませんが、完全な隔離ではありません。MCP を取るか隔離を取るかの選択をルール単位でできるようにした、というのが現状です。

## レビュー観点はリポジトリごとのskillに持たせる

`rules.yaml` に観点を直接書ける形にしたものの、実際の運用では `action.prompt` が skill の呼び出し 1 行だけになりました。

```yaml
- name: iesapuri-review
  on: [review_requested]
  match:
    repos: ['h-scape/iesapuri']
    exclude_authors: ['*[bot]']
    include_draft: false
  action:
    mode: ghostty
    workdir: ~/go/src/github.com/h-scape/iesapuri
    prompt: |
      /iesapuri-review-start {{.PRURL}}
    timeout: 60m
    notify: true
```

`reviewd` が受け持つのは「いつ・どこで・何を起動するか」だけで、レビューのやり方は skill 側に寄せています。観点を変えたくなったときは CLI とルールのどちらも触らず、dotfiles の `SKILL.md` を直すだけで済みます。つまり運用の中身は各人が skill で好きに組めるので、CLI 側は観点を一切持たない作りにしました。

skill はリポジトリごとに分けています。いえサプリ用は、マルチテナントの企業スコープ漏れと mysqldef の DROP を最重量の観点に置きました。marketing-products 用は、差分の作者が非エンジニア（Claude Code との Vibe Coding）である前提でセキュリティの重大度を底上げしています。Terraform 用は destroy / replace とコストと適用の段取り、AI 面接用は PR 本文の「確認した」をこちらでも実測して裏取りする、という具合に、それぞれ別物へ育ちました。同じ PR レビューでも、見たいものはリポジトリごとにかなり違います。

Terraform だけは 2 リポジトリを 1 ルールで兼用しています。`match.repos` へ両方を並べ、`workdir: ~/go/src/github.com/{{.Repo}}` で振り分ける形です。`workdir` もテンプレートとして評価されるので、ルールを 2 本へ割らずに済みました。

skill を書くときに自分で決めているのは、**観点表を skill 側に書き写さない**ことです。ベースのレビュー観点はリポジトリ内の `/review` や `doc/coding_rules/*.md` が SSOT なので、そこへ委譲して、skill が足すのは「worktree を切って読む」「PR の description と既存コメントを先に読む」「深掘り観点」の 3 つだけにしています。観点を skill にコピーすると SSOT が二重化して、片方だけ腐ります。

レビュー対象が仕事のリポジトリなので、skill の実体は private な dotfiles 側に置いていて公開できません。ただ、観点の中身を CLI から切り離してある以上、同じ `reviewd` のまま各自が自分の運用を skill として書ける、というのがここで言いたかったことです。

## 無人で起動されるskillは質問させずに走り切らせる

普段の skill は迷ったらユーザーに聞けばいいのですが、`reviewd` から起動される skill では誰も答えません。タブが生えた時点で自分は別の作業をしていて、結果を見るのは早くても数時間後です。そのため実行方針として「止まらずに最後まで走る」を `SKILL.md` の冒頭に明文化しました。

- 途中でユーザーに質問しない。判断に迷う箇所は自分で判断して、根拠と併せてレポートに書く
- 判断できない箇所は「未確認」としてレポートに残して次へ進む。質問して止まるより、未確認を明示して他を全部見るほうが価値は高い
- `mise run` や `pnpm` が失敗しても中断せず、「未実行」と記録して静的な読解に切り替える。通っていないものを通ったことにはしない

ここで大事なのは、未確認を許す範囲を観点ごとに分けることでした。Terraform の破壊的変更やセキュリティまで「未確認」で流せる書き方にすると、一番読んでほしいところが空のまま approve 判定に進んでしまいます。この 2 つだけは未確認が残った時点で後述の人の判断に回す、という例外を入れています。

記録の置き場所も無人前提で決めました。レビューのメモとチェックリストは `task.pr_<N>.md` として clone のルート側へ作り、worktree の中には置きません。worktree は後から消すものなので、記録をその中へ置くと「なぜその指摘をしたか」ごと消えます。更新はサブタスクを 1 つ終えるたびに、その場で行います。まとめて最後に書く形だと、セッションが落ちた瞬間に全部消えました。

最終出力の形も指定しています。レポート本体は PR コメントにそのまま貼れる体裁なので長く、後からタブを開いた人は 1 行目から読みません。そこで「何をする PR か / 判定 / 問題点を重い順に最大 5 件 / 未確認 / 次の一手」だけの短いまとめを、セッションの最後に必ず出させています。ここで新しい指摘を出すのは禁止にしました。レポートと食い違う結論が 2 つ残ると、どちらが本当なのか分からなくなります。

よくある失敗として `SKILL.md` に書き残しているものもあります。一番怖いのは worktree への `cd` が失敗したまま読み進めるパターンで、レビュー対象が clone の現在ブランチになり、**まったく別のコードについての報告**が出てきます。`pwd` が worktree を指しているかの確認を §0 に入れました。

worktree を毎回作り直さないのも実運用で効きました。同名の worktree があれば `git worktree remove` せず、`fetch` して `checkout --detach <head SHA>` で head だけ進めます。作り直すと gitignore 配下の `node_modules` や vendor、生成した proto、vite / vitest のキャッシュを捨てることになり、再インストールの時間を丸ごと払います。head SHA を冪等キーにしている以上、追加 push のたびに再レビューが走るので、作り直しをデフォルトにすると毎回高くつきます。

## 外向きの操作だけskillの中で止める

無人で走り切らせる方針と、GitHub に対する操作は分けて考えています。レビュー結果を読んだあとの投稿は外から見える副作用なので、ここだけは条件を満たすときしか自動で行いません。

自分で approve まで済ませてよいのは、次を全部満たすときだけにしました。

- 総評が LGTM で、「マージ前に直したい」が 0 件（残るのは nit や任意の提案だけ）
- セキュリティとリグレッションのリスクが「検出なし」で、テナント分離・権限・PII・課金・migration に未確認が残っていない
- `gh pr checks` に fail が無い（pending だけなら可）
- draft ではなく、自分が author の PR でもない
- head SHA がレビュー開始時から変わっていない

1 つでも外れたら、レポートを `review-<N>.md` に書き出し、`gh pr comment <N> --body-file review-<N>.md` を提示するところまでで止まります。投稿するか、どこを削るかは自分が決めます。`--request-changes` はどちらの経路でも自動実行しない、と明示的に書いています。

逆に nit だけの PR で人の判断を待つと、相手のマージが待たされるだけです。軽微なら approve まで、それ以外は止まる、という非対称をわざわざ条件として書き下したのはそのためです。head SHA の確認を条件に入れているのは、レビュー中に force push されていた場合、読んでいない差分に approve を出すことになるからです。

Terraform 用の skill では、止める対象に `terraform plan` / `apply` / `state` 系も入れています。`plan` は Terraform Cloud に run が積まれ、state lock や認証情報の要求を伴う操作なので、自分では実行せず「CI が PR に貼った plan を読む」形にしました。plan が無いリポジトリでは「plan 未確認」としてレポートに書かせています。

## main pushでtagを切ってバイナリをReleaseに上げる

自分しか使わないツールですが、`go build` したバイナリを手で配るのはすぐ面倒になります。main に push したら tag を切って Release までやる形にしました。

バージョンは前回の `vX.Y.Z` tag 以降の Conventional Commits から決めています。`feat:` があれば minor、`!` か `BREAKING CHANGE:` があれば major、それ以外は patch です。HEAD が既に tag 済みなら何も出力しないので、tag だけの push や再実行でリリースされません。

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/scripts/next-version.sh

```yaml
- name: Decide the version
  id: version
  run: echo "tag=$(scripts/next-version.sh)" >> "$GITHUB_OUTPUT"
- name: Push the tag
  if: steps.version.outputs.tag != ''
  run: |
    git tag "$TAG"
    git push origin "$TAG"
- uses: goreleaser/goreleaser-action@v7
  if: steps.version.outputs.tag != ''
  with:
    args: release --clean
```

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/.github/workflows/ci.yml

tag の push と goreleaser を同じ job に置いているのは、`GITHUB_TOKEN` で push した tag がほかの workflow をトリガーしないためです。`on: push: tags` の別 workflow を書いても動きません。PAT や GitHub App を持ち込めば分離できますが、1 つの job に収めるほうが単純でした。

tag 判定に外部の Action を使わず shell script にしたのは、判定規則が 10 行で済んでローカルでテストできるからです。使い捨てのリポジトリを作って 9 ケースのテストを書き、CI の test job で回しています。サードパーティの Action に `contents: write` を渡さずに済むのも都合が良いです。release-please も検討しましたが、リリース PR をマージする形になるので「push で自動」の要件と合いませんでした。

ビルドは `CGO_ENABLED=0` で Linux runner から darwin をクロスビルドしています。SQLite を pure Go の `modernc.org/sqlite` にしておいたので、macOS runner を使わずに arm64 と amd64 の両方を出せました。

## 溜まったworktreeの自動削除とPRへのコメント投稿は入れない

大きいリポジトリの bare mirror は 160MB 級になり、Ghostty モードでは worktree も掃除せず残ります。`~/.reviewd/` は確実に溜まっていくので、`reviewd gc` のようなコマンドを作るか迷いました。

結論としては入れないことにしました。Ghostty モードでは実行中のタブが worktree を掴んだままで、`reviewd` 側はそのタブが終わったかどうかを知れません。自動削除は「作業中のディレクトリを消し飛ばす」リスクを持ち込みます。そのリスクを取るより、溜まったら `rm -rf` する手間を選びました。消す前に `reviewd status` でタブが残っていないかを見る、という運用です。

レビュー結果の PR へのコメント投稿も、CLI の機能としては入れていません。こちらは外向きの副作用がある操作なので、無人で動くものに最初から持たせたくありませんでした。CLI 側は `result.md` への保存と macOS 通知までで止めています。通知をクリックすると結果が開きます。投稿の線引きは前述のとおり skill 側に置いてあり、条件を全部満たすときだけ approve まで進みます。どこまで自動で投稿してよいかはリポジトリの事情で変わります。そのため CLI ではなく skill 側で決められる形が気に入っています。

今回作成した CLI はこちらのリポジトリで公開しており、`doc/design.md` に設計の詳細、readme に導入手順とトラブルシュートをまとめています。

https://github.com/YasushiKobayashi/agent-dispatch

https://github.com/YasushiKobayashi/agent-dispatch/blob/main/doc/design.md

参考リンク。

https://code.claude.com/docs/en/cli-reference
https://code.claude.com/docs/en/settings
https://github.com/anthropics/claude-code-action
https://cli.github.com/manual/gh_search_prs
https://ghostty.org/docs/install/release-notes/1-3-0
https://goreleaser.com/customization/builds/
