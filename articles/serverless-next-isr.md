---
title: Next.js/Serverless Frameworkでisr対応サイトを立ち上げる
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['nextjs', 'Serverless', 'Prismic']
published: true
---

メディアを Next.js/Headless CMS でメディアを開発を行っているので、の技術選定やハマりどころをまとめていきます。

使用している技術の概要は下記です。

- Next.js は Serverless Framework を使用して AWS 上にデプロイ
- Headless CMS は、Prismic を使用

## Serverless frameworkの選定理由

AWS からインフラを分離したくない事情があったため、Vercel や Firebase Hosting 等は選択肢外でした。

別のプロダクトでは ecs を使用しているのですが、メディアはメインプロダクトではないため、インフラの管理・スケール等を考える必要性はなくしたいため、Serverless Framework でリソースの管理をするようにしました。

## Serverless frameworkで良かったこと

### ソースコードに手を入れる必要はない

導入にあたって、next 側のソースコードを変更する必要は一切ありませんでした。

Next.js は isr/ssr 用の書き方が変わるので、そこを変えるだけで簡単にデプロイも一発でできて非常に便利でした。

### S3/CFやFirebase Hostingに普通にデプロイするよりも楽

S3/CF や Firebase Hosting に Next.js をデプロイして、運用するにはパスの rewrite を自作する必要があります。

Serverless Nextjs Plugin を使えば、パス関連もまとめて面倒を見てくれるので、export したサイトを作成する場合でも Serverless Nextjs Plugin を使うとインフラ構築が楽になります。

## ハマったポイント
### next-i18nextを使っていないのに、ビルドエラーになる

モノレポで開発しており、package.json に dependencies がなかったため、`next-i18next`を使用しているかチェックしている箇所が`Cannot read property`でエラーになってしまいました。

対処法は dependencies を追加するだけです。


### Serverless frameworkに対して環境変数が渡せない

~~npm script or Makefile から環境変数で AWS の情報は渡したかったのですが、document を見てもわからずで一旦ベタ書きしています。~~

~~外から、これらを渡せないと環境毎にデプロイを分けることができないので、早めに対応したいです。~~

Makefile の書き方にミスがあり、渡せていたかっただけのためこちらの修正で　環境変数によって、deploy 先の s3 のバケットや cf は変更できました。

https://github.com/YasushiKobayashi/samples/pull/367

### キャッシュが更新されない

`getStaticProps` の`revalidate` に設定している値で明らかにキャッシュの更新がされずにつまりました。

下記のようにパスごとの ttl を設定することで、キャッシュを更新できるようになりました。

https://github.com/YasushiKobayashi/samples/blob/master/src/serverless-next-isr/serverless.yml#L22-L30

これで `/posts/[id]`については、ちゃんと isr できるようになったのですが、なぜか top ページだけキャッシュが更新されず、s3 のデータが更新されていません。

ただしページ毎に、isr/ssr をするか分けることが可能なので、もし対応ができなければそのページだけ ssr にしようと考えていました。

詳細の原因は不明なのですが、完全に cf/Lambda/s3 の作り直しを行ったら、すべてのページがちゃんとキャッシュクリアできるようになりました。

isr/ssr を途中で変えることはできますが、途中で変えるとあまり何らかの影響が出るのかもしれません。

また、全体の作り直しはかなり簡単にできるので、このように予期せぬ不具合が出たら一旦作り直してみるのが良さそうです。

### キャッシュの更新に時間差が激しい

上記でキャッシュの revalidate/ttl を短くしていても、どうしてもキャッシュの更新に時間がかかってしまう場合があるので、今回作成した例では swr と併用するようにしています。長いときは 10 分くらい更新されません。

swr を使用することで、refetch のタイミングなどを swr に任せることがより楽にデータの管理ができます。


### Serverless frameworkとTerrafromで競合しないように

今回のメディアは、まだ本運用が始まっていないですがインフラ構築にあたって、気をつけたいと思っている点として、Terraform とのリソース管理で競合しないようにしたいと考えています。

そのため、既存の CloudFront に対して影響を与えないように、CloudFront は Serverless Framework で全く既存とは別のものを作成し、既存の CloudFront から特定のパスだけその origin を今回作成した CloudFront にする予定です。

ただ、このあたりは既存のプロダクトの運用状況・ドメイン構成によって変わるので、同様の構成を取る必要はありませんが、CloudFront 含めて気軽に作り直しができると Serverless Framework は運用がしやすいと思います。

## Prismicの選定理由

いくつか headress cms を比較したのですが、下記の点でメリットが多く、Prismic が圧倒的に安く安心して使えるプラン形態だったので Prismic を選びました。

- 権限管理は必須
- なるべく安く
- 記事数・画像数などを気にしたくない

ただし、ユースケース・要件によっては、他のものも使えると思います。

## Prismicで開発しやすくするためにしたこと

Prismic の api の叩き方は、多少癖があるきもしますが、document 見ながら試すとそれほど難しい点は恐らくなかったです。

api を叩くだけでは問題なさそうだったのですが、Prismic のレスポンスの型をみると any を使っており generics に対応してなかったので、継承して下記のように自分で型を作りました。

```typescript
import Prismic from '@prismicio/client'
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse'
import { DefaultClient } from '@prismicio/client/types/client'
import { Document } from '@prismicio/client/types/documents'
import { RichTextBlock } from 'prismic-reactjs'

type PostType = 'sample-post' | 'sample-category'
const post: PostType = 'sample-post'
const category: PostType = 'sample-category'
interface CustomDocument<T> extends Document {
  data: T
}

interface CustomApiSearchResponse<T> extends ApiSearchResponse {
  results: CustomDocument<T>[]
}

interface CategoryInterface {
  category_name: RichTextBlock[]
  slug: RichTextBlock[]
}

interface PostInterface {
  title: RichTextBlock[]
  content: RichTextBlock[]
  categories: { category?: CustomDocument<CategoryInterface> }[]
}

export type PostsResponse = CustomApiSearchResponse<PostInterface>
export type PostResponse = CustomDocument<PostInterface>
export type CategoriesResponse = CustomApiSearchResponse<CategoryInterface>

export const fetchPosts = async (client: DefaultClient) => {
  const res = await client.query(Prismic.predicates.at('document.type', post))
  return res as PostsResponse
}
```

投稿の Custom Types は下記のように、タイトル・コンテンツと複数のカテゴリ（カテゴリも Custom Types です）を持つ形にしています。

```json
{
  "Main" : {
    "title" : {
      "type" : "StructuredText",
      "config" : {
        "single" : "heading1,heading2,heading3,heading4,heading5,heading6",
        "label" : "タイトル",
        "placeholder" : "タイトル"
      }
    },
    "uid" : {
      "type" : "UID",
      "config" : {
        "label" : "path",
        "placeholder" : "記事URL"
      }
    },
    "categories" : {
      "type" : "Group",
      "config" : {
        "fields" : {
          "category" : {
            "type" : "Link",
            "config" : {
              "select" : "document",
              "customtypes" : [ "sample-category" ],
              "label" : "category",
              "placeholder" : "category"
            }
          }
        },
        "label" : "categories"
      }
    },
    "content" : {
      "type" : "StructuredText",
      "config" : {
        "multi" : "paragraph,preformatted,heading1,heading2,heading3,heading4,heading5,heading6,strong,em,hyperlink,image,embed,list-item,o-list-item,rtl",
        "label" : "content",
        "placeholder" : "content"
      }
    }
  }
}
```

react でのレンダリングは`prismic-reactjs`を使うことで、html をそのままレンダリングするパターン、text だけレンダリングしたいときも簡単に対応できました。

```typescript

import * as React from 'react'
import { RichText } from 'prismic-reactjs'
const Pages: React.VFC<Props> = ({ post }) => {
  return (
    <div>
      <p>タイトル</p>
      <h1>{RichText.asText(post.data.title)}</h1>

      <p>記事詳細</p>
      <div>{RichText.render(post.data.content)}</div>
    </div>
  )
}
```

このように、それぞれに多少のハマリポイントはありましたが、簡単に ISR/SSR に対応したサイトが作れてどちらも非常に便利でした。

ハマっているところで、解決策があれば随時更新をしていきます。

作成にあたって試したコードはこちらです。

https://github.com/YasushiKobayashi/samples/tree/master/src/serverless-next-isr
