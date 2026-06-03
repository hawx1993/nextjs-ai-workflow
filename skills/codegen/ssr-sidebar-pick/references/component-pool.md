# 侧栏候选组件池

> 评估标准:
>
> - **尺寸适配**:能在 376px 宽容器内自适应,不溢出
> - **语义合适**:卡片化、列表化、CTA 化的"附属信息"形态;非"主内容长文/大表/全屏图"
> - **数据自洽**:要么纯静态 props,要么有 content-forge 标准 SSR 通道(handleServer + serverComponentsMap)
>
> 表中"sidebar 适配"= ✅ 适合 / ⚠️ 看场景 / ❌ 不适合(后者不出现在白名单,但需在脑海里记得它们)

## content-forge

源:`apps/bydfi-ssr/src/components/content-forge/`

| 组件                | 默认导出/命名        | sidebar 适配 | SSR 依赖 (serverKey)             | 用途                                                   | 备注                                                                     |
| ------------------- | -------------------- | ------------ | -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| leaderboard         | `Leaderboard`        | ✅           | `leaderboard` (rankingsSnapshot) | 涨幅/跌幅/新币/热门榜                                  | 已在 crypto-news/[id] 用过,稳定参考                                      |
| activities          | `Activities`         | ✅           | `cmsBannerActivities`            | 活动 banner 列表(原 pseo/operation/activities,已迁)    | componentData 需要 `scope`、可选 `position`('LEFT'/'RIGHT',默认 'RIGHT') |
| recommends          | `Recommends`         | ✅           | `cmsBannerRecommends`            | "探索 BYDFi" 推荐位(原 pseo/operation/recommends,已迁) | componentData 需要 `scope`、可选 `position`、`title`                     |
| risk-disclaimer     | `RiskDisclaimer`     | ⚠️           | 无                               | 风险披露文本卡                                         | 通常作为页脚,但卡片化后窄栏也能放                                        |
| price-convert       | `PriceConvert`       | ⚠️           | `quoteTickerCmcRateList`         | 价格换算器                                             | 控件交互区域多,376px 偏挤,留意                                           |
| market-data-list    | `MarketDataList`     | ⚠️           | `quoteTickerCmcHistoryPriceData` | 市值/最高/最低等指标列表                               | 列表形态,2 列布局会挤,建议单列模式                                       |
| cointalk-news       | `CointalkNews`       | ⚠️           | `cointalkNews`                   | 社区/快讯短列表                                        | 主内容用更合适;若侧栏强调"最新动态"可考虑                                |
| htb-other-crypto    | `HtbOtherCrypto`     | ⚠️           | `htbOtherCryptoList`             | "买其他加密货币"推荐位                                 | 已是列表式,可以放                                                        |
| price-hero          | `PriceHero`          | ❌           | `quoteTickerCmc`                 | 顶部价格大头                                           | 体量大,只能主区域                                                        |
| htb-hero            | `HtbHero`            | ❌           | `htbHeroData`                    | 顶部主视觉                                             | 同上                                                                     |
| price-kline         | `PriceKline`         | ❌           | 无(走 ws 实时)                   | K 线图                                                 | 高度大,主区域                                                            |
| htb-steps           | `HtbSteps`           | ❌           | 无                               | 步骤指引                                               | 大块横向布局                                                             |
| price-steps         | (默认导出)           | ❌           | 无                               | 同上                                                   |                                                                          |
| price-exclusive     | `PriceExclusive`     | ❌           | `quote24hrTicker`                | BYDFi 专属数据面板                                     | 多列大数据,放不下                                                        |
| htb-exclusive       | `HtbExclusive`       | ❌           | `htbExclusiveData`               | 同上                                                   |                                                                          |
| market-data-board   | `MarketDataBoard`    | ❌           | `quoteTickerCmcHistoryPriceData` | 行情大盘                                               | 大尺寸                                                                   |
| platform-comparison | `PlatformComparison` | ❌           | 无                               | 平台对比表                                             | 表格宽度需求高                                                           |
| payment-methods     | `PaymentMethods`     | ❌           | 无                               | 支付方式表                                             | 同上                                                                     |
| coin-trade          | `CoinTrade`          | ❌           | `quoteTickerCmc`                 | 主区下方 CTA                                           | 横向布局,主区底部                                                        |
| faq                 | `FAQ`                | ❌           | 无                               | FAQ 折叠列表                                           | 主内容长文,放侧栏过挤                                                    |
| rich-text           | `RichText`           | ❌           | 无                               | 主区域富文本                                           | 顾名思义                                                                 |

### content-forge 写死式接入示例

```tsx
// pages/[locale]/<your-page>/index.page.tsx
import { Leaderboard } from '@/components/content-forge/leaderboard';

// 渲染
<aside className='sidebar'>
  <Leaderboard serverData={rankingsSnapshot} widgetConfig={{} as any} />
</aside>

// getServerSideProps
const [..., rankingsSnapshot] = await Promise.all([
  ...,
  Http.getRankingsSnapshot({ mode: HTTP_MODE.SERVER, context, length: 8 }),
]);
return { props: { ..., rankingsSnapshot } };
```

`widgetConfig={{} as any}` 是写死式专用兜底,**配置驱动式不要这么写**(由 `componentMap[widget.widgetType]` 自动注入)。

## pseo

源:`apps/bydfi-ssr/src/components/pseo/`

只列**不依赖现拉接口** + **形态适合 376px 卡片**的子集。其余(meme / web3 / tools / aggregation / cfd / faq / title / text 主区类)默认不进侧栏。

| 组件                                                                        | 路径                                      | sidebar 适配 | SSR 依赖                                | 用途                 | 备注                                                       |
| --------------------------------------------------------------------------- | ----------------------------------------- | ------------ | --------------------------------------- | -------------------- | ---------------------------------------------------------- |
| Register                                                                    | `pseo/conversion/register.tsx`            | ✅           | 无                                      | 邮箱/手机注册 CTA 卡 | 非常适合"未登录用户转化"侧栏槽位                           |
| Button                                                                      | `pseo/conversion/button.tsx`              | ✅           | 无                                      | 单一 CTA 按钮卡      | 简短引导,放侧栏底部合适                                    |
| Banner                                                                      | `pseo/conversion/banner.tsx`              | ✅           | 无                                      | 推广 Banner 卡       | 注意传入图片资源宽度匹配 376px                             |
| BeginnerGuide                                                               | `pseo/conversion/beginner-guide.tsx`      | ✅           | 无                                      | 新手指引卡           | 适合教程类页面侧栏                                         |
| BuyingGuide                                                                 | `pseo/conversion/buying-guide.tsx`        | ✅           | 无                                      | 购买引导卡           | 适合 how-to-buy / price 系页面                             |
| BrandPromotion                                                              | `pseo/operation/brand-promotion.tsx`      | ✅           | 无                                      | 品牌推广位           | 卡片样式,合适                                              |
| RecommendRead                                                               | `pseo/abstract/recommend-read.tsx`        | ⚠️           | 无                                      | 推荐阅读 swiper      | 用了 swiper,需要在窄栏验证轮播是否塌陷;不行就换静态列表    |
| Activities                                                                  | `pseo/operation/activities.tsx`           | ❌           | `Http.getCmsBannerActivities`(组件内拉) | 活动 banner          | **已废弃用于侧栏**,改用 `content-forge/activities`(SSR 版) |
| Recommends                                                                  | `pseo/operation/recommends.tsx`           | ❌           | `Http.getCmsBannerRecommends`(组件内拉) | 推荐位               | **已废弃用于侧栏**,改用 `content-forge/recommends`(SSR 版) |
| Marquee                                                                     | `pseo/conversion/marquee.tsx`             | ❌           | 组件内 useEffect 拉                     | 跑马灯               | 横向滚动,主区域顶部用                                      |
| BottomFixedBanner                                                           | `pseo/conversion/bottom-fixed-banner.tsx` | ❌           | 无                                      | 全屏底部固定条       | fixed 浮层,放 sidebar 等于失效                             |
| Modal                                                                       | `pseo/conversion/modal.tsx`               | ❌           | 无                                      | 弹窗                 | 同上                                                       |
| Timeline                                                                    | `pseo/conversion/timeline.tsx`            | ❌           | 无                                      | 时间线               | 横向布局                                                   |
| 其他 (title/text/faq/abstract 中长文/aggregation/cfd/meme/web3/tools/other) | —                                         | ❌           | 多数有 SSR 或体量大                     | —                    | 默认不进侧栏                                               |

### pseo 写死式接入示例

```tsx
import Register from '@/components/pseo/conversion/register';
import { useAppContext } from '@/core/store/src/app-context-hook';

const Sidebar = () => {
  const { isLogin } = useAppContext();
  return (
    <aside className='sidebar'>
      {!isLogin && (
        <Register
          componentData={
            {
              /* 字段按 register.tsx 里 props 填 */
            }
          }
        />
      )}
    </aside>
  );
};
```

pseo 组件的 props 形状不统一(各组件直接平铺接收),接入前用 Read 打开对应 .tsx 顶部 interface 看一眼字段。

### pseo "需要服务端数据"想放侧栏怎么办

**不要直接用 Activities / Recommends / Marquee** —— 它们的拉数据走 `useEffect` + `fetchOnMount`,SSR 阶段拿不到,首屏会闪。

正确做法:

1. 在页面 `.page.tsx` 的 `getServerSideProps` 里直接 `await Http.getCmsBannerActivities(...)` / `getCmsBannerRecommends(...)`
2. 把结果作为 props 传下去
3. 在 sidebar 里用普通 `map` + `<Image>` + `<TrLink>` 自己渲染 banner

参考实现:`pages/[locale]/crypto-news/[id]/index.page.tsx` 的 `activities` / `explores` 部分。

## 写死式 sidebar JSX 骨架(可复用)

```tsx
<aside className='sidebar'>
  {/* 1. 转化卡(可选,看登录态) */}
  {!isLogin && <Register componentData={...} />}

  {/* 2. 行情/排行类 content-forge */}
  <Leaderboard serverData={rankingsSnapshot} widgetConfig={{} as any} />

  {/* 3. 推荐/活动类(SSR 自取后自渲) */}
  {activities.map((item) => (
    <TrLink key={item.link} href={item.link} native>
      <Image src={item.style} width={376} height={146} alt='...' />
    </TrLink>
  ))}
</aside>

<style jsx>{`
  .sidebar {
    width: 376px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
    @media ${MediaInfo.tablet} {
      width: 100%;
    }
  }
`}</style>
```

布局参考(响应式):desktop 双栏 grid `minmax(0, 1fr) 376px`,tablet/mobile 单栏。
