# network/src/api 接口发现知识库

本文用于帮助 AI 在开发 BYDFi Web 功能时，快速判断"某类接口应该去哪里找"。接口目录位于：

```text
packages/apps-kit/core/network/src/api
```

> 范围说明：本文覆盖 `api` 目录下除 `moonx/`、`polymarkets/` 之外的接口模块。若需求明确属于 MoonX 或 Polymarkets，请单独读取对应目录，不使用本文定位。

## 使用原则

1. **先按业务域找目录**：例如用户资产、安全设置查 `account/`，登录注册/公共配置查 `common/`，现货查 `spot/`，合约查 `swap/`，跟单查 `swap-copy/`。
2. **接口实现看 `index.ts`**：每个模块的 API 函数主要定义在 `packages/apps-kit/core/network/src/api/<module>/index.ts`。
3. **参数与返回类型看类型文件**：优先读取同目录 `types.ts`；`markets` 模块为 `type.ts`。
4. **统一出口看 barrel**：公共导出集中在 `packages/apps-kit/core/network/src/api/index.ts`；接口路径常量看 `paths.ts`。
5. **命名约定**：大多数请求函数以 `Api` 结尾，常见前缀含义：
   - `get*Api`：查询接口。
   - `post*Api`：创建、提交、确认、领取等写操作。
   - `del*Api` / `delete*Api`：删除或取消。
   - `update*Api` / `set*Api` / `toggle*Api`：更新配置或开关。

---

## 模块速查表

| 目录 | 主要业务 | 什么时候优先查 |
| --- | --- | --- |
| `account/` | 用户账户、资产钱包、充提、划转、安全设置、KYC/POA、API Key、通知、批量转账、Zendesk JWT | 账户中心、资产页、安全中心、充币/提币/划转、身份认证、通知消息 |
| `activity/` | 活动中心、活动报名、抽奖、排行榜、交易员挑战、奖励领取 | 活动页、活动详情、报名/领奖/排名 |
| `affiliate/` | 代理/返佣、邀请链接、团队、Campaign、红包、代理资产和交易记录 | Affiliate / 代理后台 / 返佣报表 / 团队管理 |
| `announcement/` | 公告文章 | 公告详情或公告文章查询 |
| `card/` | BYDFi Card 申请、卡片管理、交易账单、额度、3DS、卡面 | Card 页面、卡申请、冻结/注销、账单导出 |
| `common/` | 公共基础能力：登录注册、验证码、用户信息、币种/汇率/国家、KYC/POA、OAuth、VIP、反馈、首页配置、Firebase、Telegram、Recaptcha | 不确定归属或公共能力优先查这里 |
| `coupon/` | Lite Rewards / 优惠券兑换提现 | 奖励账户、优惠券、Lite Rewards |
| `fiat-crypto/` | 法币出入金、Legend KYC、银行卡、买币/卖币、法币余额 | Fiat Crypto / Legend 法币流程 |
| `invite-friends/` | 邀请好友、助力、抽奖、神秘盒子 | Invite Friends、邀请奖励、助力活动 |
| `ledger/` | 钱包插入/检查 | 钱包账本、钱包初始化检查 |
| `markets/` | CMC 市值、成交量、衍生品未平仓、全局指标 | 市场总览、行情统计、CMC 图表 |
| `notify/` | Web Push、站内信、语言、邮件通知配置 | 通知设置页 |
| `p2p/` | P2P 广告、订单、支付方式、商家、聊天、申诉、评价 | P2P 买卖币、广告、商家中心、订单详情 |
| `qa/` | 币种评分、投票、问答 | 币种详情投票、QA 问答 |
| `spot/` | 现货资产、订单、历史、下单、OCO、Web3 行情、市场异动、热力图 | Spot 交易、现货订单、现货行情工具 |
| `support/` | 帮助中心背景、搜索、联系方式 | Support / Help Center |
| `swap/` | 永续合约资产、订单、仓位、止盈止损、杠杆、保证金、资金费率、风险限额、盈亏分析 | 合约交易、U 本位/币本位、仓位和订单管理 |
| `swap-copy/` | 合约跟单广场、交易员、跟随者、跟单仓位、跟单交易、TPSL、智能保证金 | Copy Trading / 跟单交易 |
| `task/` | 任务、奖励、红包 | 任务中心、红包领取 |
| `trade/` | 网格、合约网格、定投、马丁、兑换、K 线历史、SEO 币种 | 策略交易、兑换、K 线历史 |
| `welfare/` | 福利中心、每日任务、积分、抽奖、比赛排行、任务领奖 | Welfare / Rewards / Mission |

---

## account：账户、资产、安全、通知

路径：

```text
packages/apps-kit/core/network/src/api/account/index.ts
packages/apps-kit/core/network/src/api/account/types.ts
```

主要用于用户账户中心、资产钱包、充提划转、安全绑定、KYC/POA、API Key、通知消息、批量转账等。

**资产 / 充提 / 划转**

```text
getAssetsListApi, getSpotAssetApi, getPerpetualUAssetApi, getPerpetualCoinAssetApi,
getWalletBalanceApi, getWithdrawAvailableApi, getAccountWithdrawAvailableAmountApi,
getWithdrawalStatisticsApi, transferWithdrawApi, walletTransferApi,
getDepositRecordsApi, getWithdrawRecordsApi, getPaymentsRecordsApi,
getExchangeRecordsApi, getTransferRecordApi, getAccountRechargeListApi,
getAccountWithdrawListApi, getAccountProfitApi, getAccountProfitRateApi,
getAccountProfitHistoryApi, getAccountProfitCalendarApi,
getAccountDepositAddressListApi, postDepositTargetWalletApi,
depositAddressCreateApi, depositAddressUpdateApi,
getDepositExportApi, getFiatExportApi, geAccountWithdrawExportApi,
getFiatRecordsApi, getLegendFiatRecordsApi, getLegendFiatDepositWithdrawApi,
getSumAssets, withdrawPreCheck, getAbnormalOrderDepositRecordsApi, postAbnormalOrderApplyApi
```

**安全设置 / 登录**

```text
postAccountBindPhoneApi, postAccountBindEmailApi, postAccountUnbindPhoneApi,
updateLoginPasswordApi, getLoginHistoryApi, getLoginDevices, postDeleteDevice,
getGoogleSecretApi, bindGoogleSecretApi, unbindGoogleSecretApi, resetGoogleSecret,
setAntiPhishingCodeApi, settingFundPasswordApi, updateFundPasswordApi,
resetFundPasswordApi, unbindFundPasswordApi, postAccountVerifyPasswordApi,
postBindNewEmail, postSetLoginPassword, postResetPhone, postUpdatePhone,
postBindFundPassword, postUpdateFundPassword, postUnbindFundPassword, postResetEmail,
postDisableAccountCheck, postDisableAccount, postFrozenAccountCheck, postFrozenAccount,
getBanType, postBanSelfAudit, postLawSecuritySelf, postDeleteAccountCheck, postDeleteAccount,
postRestoreAccount, getEnableAccountQuestions, postQuestionVerify, postRefreshQuestion,
postCheckBalance, getActionRecords, referralVerifyCodeApi
```

**KYC / POA / 身份认证**

```text
getKycSupportCountryApi, getPoaSupportCountryApi,
postSumsubInitiateCreationApi, postSumsubInitiateCreationKycApi,
postSumsubInitiateCreationPoaApi, resetSumsubPoaApi,
postSumsubInitiateCreationFaceApi, postAccountVerifyApi,
getAccountKoreaKycStatus, getIsT1CountryApi
```

**API Key 管理**

```text
getAccessKeyVisibleApi, postCreateApiKeyApi, getApiKeyListApi,
postUpdateApiKeyApi, deleteApiKeyApi, deleteAllApiKeyApi
```

**地址簿**

```text
getMoonxAddressesApi, addAddressApi, editAccountAddressApi, deleteAddressApi,
getBindOptionsApi, postInnerAddressVerifyApi,
postBatchDeleteWithdrawAddress, postBatchUpdateWithdrawAddress,
toggleAccountWithdrawFastApi, toggleAccountWithdrawWhiteApi
```

**资产兑换 / 积分**

```text
getAccountConvertPointAssetsListApi, applyConvertCoinApi, getAccountConvertHistoryApi
```

**头像 / 用户名 / 主题**

```text
getAccountDefaultAvatarListApi, postAccountUploadCustomAvatarApi,
postAccountUploadAvatarApi, updateUsernameApi, postPrivateAccountSetAppThemeApi
```

**通知 / 站内信**

```text
getAccountNotificationApi, getAccountUnreadStateApi, getActivityNotificationApi,
getActivityUnreadNumApi, postActivityNotificationReadApi, getHomeNoticeApi,
getHomeReadNumApi, getAccountNotificationReadDeleteApi,
getAccountAllNotificationApi, getAccountAllNotificationApiV2
```

**批量转账**

```text
getBatchTransferTemplate, postUploadBatchTransferFile, postSubmitBatchTransfer,
getBatchTransferFileHistory, getBatchTransferHistory, getBatchTransferDetails,
postHistoryFileReupload
```

**其他**

```text
postAccountInnerTransferApi, setLocalCurrencyApi, getRedPacketReceivedRecordsApi,
getAssetRedpacketRecordsApi, getAssetRedpacketDetailApi,
getAccountTaxDownloadRecordApi, getAccountTaxDownloadApplyApi, getTaxDownloadRemainCountApi,
getAffiliateRankApi, postSetCrossConfirm, getCrossConfirmQRcode, getCrossConfirmStatus,
getAccountOauthClientApi, postThirdAccount, checkRu, getOttTokenApi,
getGuessQaList, getHelpBizFailed, getAccountOtherRecords,
getTwitterLoginLinkApi, bindTwitterApi, unbindTwitterApi,
postWithdrawLimit, getZendeskJwtApi
```

类型关键词：`ITransfer`、`IWalletBalance`、`WithdrawalTransaction`、`VerifySecurityOptionsResult`、`APIListItem`、`LoginDevice`、`DepositRecordItem`、`BatchTransferRecord`。

---

## activity：活动中心、活动报名、排行榜、领奖

路径：

```text
packages/apps-kit/core/network/src/api/activity/index.ts
packages/apps-kit/core/network/src/api/activity/types.ts
```

```text
getVarietyListApi, getSwapActivityCenterList, getVarietyDetailApi, getVarietyJoinApi,
joinVarietyApi, getVarietyRankingApi, getMyVarietyRankingApi, getMyActivityOwns,
getMyActivityLegacy, postActivitySignUp, getActivityCenterList, getActivityCenterDetail,
postApplyReward, getActivityLamp, postLotteryDraw, getLotteryRecord, getMyActivityReward,
getRewardCollect, getApplyCustomReward, getActivityRewardRecordsApi, getTradingRank,
getTraderSignupConfig, postRoleCheck, postBindUidCheck, postSendBindCodeCheck,
postVerifyBindCodeCheck, postConfirmMultiCheck, postSignupQuickPick,
postRestartSignUp, getTraderAccountRank
```

类型关键词：`ActivityList`、`ActivityDetailData`、`RankingItem`、`ActivityTask`、`TraderChallengeTask`、`TradingContest`、`ActivityRewardRecordItem`。

---

## affiliate：代理、返佣、邀请链接、团队管理

路径：

```text
packages/apps-kit/core/network/src/api/affiliate/index.ts
packages/apps-kit/core/network/src/api/affiliate/types.ts
packages/apps-kit/core/network/src/api/affiliate/constants.ts
```

```text
postAffiliateWithdrawApi, getAffiliateWithdrawListApi, getAffiliatPrepromotionRecordApi,
getAffiliateTeamsListApi, getAffiliateStepsListApi, upgradeSpotRateApi, upgradeSwapRateApi,
getRecordListApi, getCashbackRecordListApi, getCashbackRecordExportApi, getRecordExportApi,
getAffiliateSummaryApi, getAffiliateSummaryCommissionApi, getAffiliateUserinfoApi,
getAffiliateBarGraphDataApi, getAffiliateTradeDataApi, getInviteLinkListApi,
getAffiliateInviteDomainsApi, addAffiliateInviteLinkApi, deleteInviteLinkByIdApi,
getAffiliateUserListApi, getAffiliateNoticesApi, getAffiliateNewUserDailyApi,
getAffiliateTelegramApi, getAffiliateEmailApi, getAffiliateAccountApi,
getAffiliateInviteDataApi, getAffiliateWithdrawDataApi, getAffiliateDepositDataApi,
getAffiliateCommissionDataApi, getAffiliateTradeFeeDataApi,
getAffiliateCampaignOverviewApi, getAffiliateCampaignShortOverviewApi,
getAffiliateCampaignListApi, getAffiliateShortSelectListApi,
getAffiliateCampaignShortListApi, getAffiliateCampaignDomainsApi,
postAffiliateCampaignCreateApi, postAffiliateCampaignRemoveApi, postAffiliateCampaignUpdateApi,
postAffiliateCampaignShortCreateApi, postAffiliateCampaignShortRemoveApi,
postAffiliateCampaignShortUpdateApi, getAffiliateCampaignPagesApi,
getAffiliateUserDescendantsApi, postAffiliateCreateAgentApi,
getAffiliateTeamTeamsApi, getAffiliateTeamDetailApi, getAffiliateTeamDetailOverviewApi,
getAffiliateTeamSubTeamsApi, postAffiliateTeamSetRateApi, getAffiliateTeamRateLogsApi,
getAffiliateBalanceApi, getAffiliatePaymentBonusApi, postAffiliateRateApi,
postAffiliateCreateInviteLinkApi, postAffiliateEditInviteLinkApi,
getAffiliateInviteLinksApi, getAffiliateOverviewInviteLinksApi, getAffiliateInviteRegularsApi,
getAffiliateDauApi, getAffiliateRedPacketSendList, postAffiliateCancelRedPacketApi,
getAffiliateOpenRedPacketRecordApi, getAffiliateRedPacketRuleApi, postAffiliateSendRedPacketApi,
getAffiliateContractListApi, getAffiliateSpotSymbolListApi,
getAffiliateSwapPositionListApi, getAffiliateSwapHistoryListApi,
getAffiliateSpotHistoryListApi, getAffiliateAssetSupportCurrenciesApi,
getUserDescendantsExport, getUserDescendantsExportNumber, getAffiliateHistoryCommission
```

类型关键词：`CampaignCreateType`、`UserDescendantsType`、`TeamsListParam`、`RecordParamsType`、`AffiliateCreateInviteLinkParamsType`。

---

## announcement：公告文章

路径：

```text
packages/apps-kit/core/network/src/api/announcement/index.ts
packages/apps-kit/core/network/src/api/announcement/types.ts
```

```text
getAnnouncementArticle
```

类型关键词：`AnnouncementParams`、`Announcement`、`AnnouncementRes`。

---

## card：BYDFi Card 卡片业务

路径：

```text
packages/apps-kit/core/network/src/api/card/index.ts
packages/apps-kit/core/network/src/api/card/types.ts
```

```text
postApplyCard, getApplyCardDetail, getCards, getCardDetail, getCardTransactions,
getCardFeeIntro, postToggleCardFrozen, postDeactivateCard, getRegionCheck,
postApproveCardOrder, postReadCardSuccess, getCardApplyRegionList,
cardApplyPhoneVerify, updateCardHolderInfo, updateCardQuota, postSwitchCard,
postExportBill, checkCardApply, applyKycFace, getFaceVerifyResult,
postUpdate3ds, getCardTransferCoins, getCardExportBillCount, getCardApplyLatest,
getAvailableLimit, getCardNotice, postReadCardNotice, getCardImages, updateCardImage
```

类型关键词：`ApplyCardData`、`ApplyCardDetail`、`CardData`、`CardTransaction`、`CardDetail`、`AvailableLimit`、`CardNotice`、`CardImage`。

---

## common：公共基础接口

路径：

```text
packages/apps-kit/core/network/src/api/common/index.ts
packages/apps-kit/core/network/src/api/common/types.ts
```

主要用于登录注册、验证码、公共币种/国家/汇率、用户信息、KYC/POA、OAuth、VIP、反馈、首页公共配置、Firebase、Telegram、Recaptcha 等。

**登录 / 注册 / 验证**

```text
postCommonLoginApi, postCommonRegisterApi, logoutApi, sendSmsCodeApi,
postCommonSendEmailCodeApi, postCommonValidateEmailCodeApi, validateSmsCodeApi,
validateImgCodeApi, getCommonLoginQrCodeApi, postCommonCheckLoginQrCodeApi,
postCommonOauthLoginApi, postCommonOauthRegisterApi, registerInviteCodeVerify,
getRecaptchaConfig, postRecaptchaVerify
```

**安全验证**

```text
officialVerifyApi, securityVerifyApi, resetPasswordApi, getSecurityOptionsApi,
getSecurityPrecheckApi, getSecurityOptionsNewApi, getSecurityVerifyApi,
getCommonGt4StatusApi, postCommonGt4ValidateApi
```

**公共数据（币种 / 汇率 / 国家 / 符号）**

```text
getCommonSymbolsApi, getCommonCurrencyListApi, getCommonExchangeRateListApi,
getCommonCountryListApi, getNetworksChainsApi, getNetworksChainsAllApi,
fetchAllSymbols, fetchGridStrategy, fetchMartinStrategy, fetchInvestStrategy,
fetchTradedSymbolsApi, getCommonCommodityInfoApi, getCommonEtfCommodityApi
```

**用户信息 / 设置**

```text
getCommonUserInfoApi, getCommonSettingGlobalApi, getPublicSettingConfigApi,
setLocalCurrencyApi, postCommonVisitApi, getCommonAccountCredentialsApi
```

**KYC / POA / 支付**

```text
getKycStatusApi, getPoaStatusApi, getPaymentsApi, getSupportsFiatTabsApi,
getPaymentFeesApi, getSupportsApi, renderPaymentApi, getTransferCurrencyApi,
countryVerifyApi, kycUploadApi, poaUploadApi, poaFileUploadApi
```

**VIP / 邀请 / 反馈**

```text
postCommonVipApplyApi, getCommonVipDataApi, getCommonVipLevelsApi,
getReferralRewardTotalApi, getReferralSummaryApi, referralResendEmailApi, referralSendEmailApi,
getCommonInviteCodeInfoApi, submitCommonFeedbackApi, getCommonFeedbackRecordsApi
```

**首页 / 活动 / 公告**

```text
getCommonBannersApi, getCommonNoticesApi, getLatestNewsApi, getCommonTaskListApi,
getCommonCurrentAirdropApi, getCommonVarietyLotteryApi, getCommonActivityListApi,
getCommonVarietyActivityListApi, getCommonCurrentActivityApi,
getCommonUePublicitiesApi, getHomeHeaderArticlesApi, getCommonHomeSocialMediaApi,
getCommonFooterSocialMediaListApi, getCommonArticleListApi,
getCommonSwapRankApi, getCommon4YearActivityDepositLucksApi,
getCommonActivityFansRegisterInfoApi, getCryptoFeeApi
```

**收藏**

```text
getCommonFavoritesListApi, addCommonFavoritesApi,
postCommonRemoveFavoritesApi, postCommonModifyFavoritesApi
```

**Firebase / Telegram / AppsFlyer**

```text
postCommonAddFirebaseTokenApi, postCommonDeleteFirebaseTokenApi,
postTelegramBind, postCommonAppsFlyerApi
```

**优惠券 / 奖励**

```text
postCommonExchangeCouponApi, postPrivateRewardClaimApi, postPrivateRewardClaimCheckApi,
postPrivateRewardClaimCheckSpotApi, postCollectCouponSpotApi, getRewardDetail
```

**其他**

```text
postCommonApplyAffiliateAgentApi, postCommonVarietyActivitySubscribeSocialApi,
onVarietyActivityCollectApi, postCommonVarietyActivityOpenLotteryApi,
postSurvey, getUserImageApi, uploadUserImageApi, uploadUserSelectImageApi
```

类型关键词：`NetworksChain`、`InviteCodeInfo`、`ActivityConfig`、`SecurityOptionsResult`、`Payment`、`PaymentsParams`、`OauthRegisterParams`、`TelegramBindData`、`SurveyData`、`RewardDetail`、`RecaptchaVerifyResult`、`HttpPublicSettingConfigType`。

---

## coupon：奖励账户 / 优惠券

路径：

```text
packages/apps-kit/core/network/src/api/coupon/index.ts
packages/apps-kit/core/network/src/api/coupon/types.ts
```

```text
withdrawSellApi, getLiteRewardsAccountApi
```

类型关键词：`Coupon`。

---

## fiat-crypto：法币出入金 / Legend

路径：

```text
packages/apps-kit/core/network/src/api/fiat-crypto/index.ts
packages/apps-kit/core/network/src/api/fiat-crypto/types.ts
```

```text
getKycLimitApi, getLegendBalanceApi, getLegendSupportAssetsApi, getLegendBankAccountsApi,
getLegendHtmlParamsApi, getLegendBuyCoinApi, getLegendSellCoinApi, trackLegendBuyErrorApi,
getLegendWithdrawMethodsApi, getLegendSupportBankApi, delBankAccount,
getLegendDepositPaymentsApi, getLegendDepositAccountApi, getLegendConfirmDepositApi,
getLegendFiatBalancesApi, getLegendUserKycStatusApi, getLegendIndividualQaApi,
getLegendSubmitQaApi, postLegendSubmitPiApi, submitWithdrawApi, getLegendBankFieldsApi,
getLegendSupportCountryApi, bindLegendBankApi, getLegendSupportIpApi,
getLegendCertificationInfo, submitLegendCertification
```

类型关键词：`KycLimitInfo`、`LegendBuyCoinApiRes`、`LegendKycStatusRes`、`LegendFormType`、`FiatBalanceRes`、`WithdrawMethodsType`。

---

## invite-friends：邀请好友与助力活动

路径：

```text
packages/apps-kit/core/network/src/api/invite-friends/index.ts
packages/apps-kit/core/network/src/api/invite-friends/types.ts
```

```text
postInviteFriendsResendEmailApi, postInviteFriendsRendEmailApi, getInviteFriendsListApi,
getInviteFriendsRewardTotalApi, getInviteFriendsSummaryApi, getInviteFriendsSendRecordsApi,
getInviteFriendsRewardRecordsApi, getInviteAssistApi, getInviteAssistProcessApi,
postJoinAssistApi, postCancelAssistApi, postCollectAssistApi, getAssistDetailApi,
getAssistRewardsApi, getLuckydrawInvitesApi, getPromoOverviewApi, getPromoPrivateOverviewApi,
getLuckydrawRewardsApi, getLuckydrawDetailApi, postjoinLuckydrawApi, postCancelLuckydrawApi,
postLuckydraw, postShareLuckydrawApi, postCollectLuckydrawApi, getMysteryboxDetailApi,
getMysteryboxInvitesApi, getMysteryboxRewardsApi, postOpenMysteryboxApi, postCollectMysteryboxApi
```

类型关键词：`RendEmailType`、`PaginationParamsType`。

---

## ledger：钱包账本基础操作

路径：

```text
packages/apps-kit/core/network/src/api/ledger/index.ts
packages/apps-kit/core/network/src/api/ledger/types.ts
```

```text
getWalletCheck, postInsertWallet
```

类型关键词：`CheckWallet`、`InsertWallet`。

---

## markets：市场统计 / CMC 数据

路径：

```text
packages/apps-kit/core/network/src/api/markets/index.ts
packages/apps-kit/core/network/src/api/markets/type.ts
```

```text
getCmcMarketCapApi, getCmcMarketVolumeApi, getCmcDerivativeUnrealizedApi,
getCmcDerivativeVolumeApi, getCmcCurrencyMarketCapApi, getCmcGlobalMetricsQuotesApi
```

类型关键词：`RangeType`、`ICoinMarketCap`、`IDerivativesVolume`、`IMarketVolume`、`ICmcMarketCap`、`GlobalMetricsData`。

---

## notify：通知配置

路径：

```text
packages/apps-kit/core/network/src/api/notify/index.ts
packages/apps-kit/core/network/src/api/notify/types.ts
```

```text
getNotifyConfigApi, setLanguageApi, setMailNotifyApi, setNotifyConfigApi, setSiteMessageNotifyApi
```

类型关键词：`WebPushNotifyProps`、`SetWebPushNotifyBody`。

---

## p2p：P2P 交易、广告、订单、商家

路径：

```text
packages/apps-kit/core/network/src/api/p2p/index.ts
packages/apps-kit/core/network/src/api/p2p/types.ts
```

```text
getP2PMyAdvApi, getP2POrderListApi, getP2PPublicSearchApi, getP2PPrivateSearchApi,
getP2PAccountAssetsApi, getP2PUserOtherDetailApi, getP2PMerchantApplyDetailApi,
getP2PUserDetailApi, getP2PMyPaymentsApi, getP2PUserFavListApi, getP2PUserBlackListApi,
deleteP2PPaymentApi, enableP2PPaymentApi, postP2PUserFavApi, postP2PUserBlockApi,
getP2PSupportPaymentListApi, addP2PAPaymentsApi, changeP2PAPaymentsApi,
getP2PMerchantConfigApi, getP2PSupportFiatApi, getP2PSupportCoinApi,
getP2PQuotedPriceApi, postApplyMerchantApi, postP2PSubmitAdvApi, postP2PPlaceOrderApi,
updateP2PAdvStateApi, cancelP2PAdvApi, getP2POrderDetailApi, sendP2PMessageApi,
getP2PChatsMessageApi, cancelP2POrderApi, postP2PConfirmPaymentApi, postP2PAppealCreateApi,
getP2PAppealProgressApi, postP2PSupplementEvidenceApi, postP2PSellerConfirmTransferApi,
postP2POrderCommentApi, getP2PAdvDetailApi, getP2POtherUserDetailApi,
getP2PMerchantAdvListApi, getP2PEachOtherOrderHistoryListApi, getP2PMerchantInfoApi,
postP2PUpdateAdvApi, getP2POrderInProgressApi, postP2PUpdateMerchantInfoApi,
getP2PGetMerchantFiatApi, getP2PGetMerchantHabitApi, getUserDefaultFiat
```

类型关键词：`P2PTradeType`、`P2PTradeSquareType`、`RequestData`、`IUserDetail`、`IMyPaymentsList`、`IOrdersList`、`SubmitAdvParam`、`P2POrder`、`PaymentMethod`。

---

## qa：币种投票、评分、问答

路径：

```text
packages/apps-kit/core/network/src/api/qa/index.ts
```

```text
getVoteInfoApi, postScoreApi, postCoinScoreApi, postCoinVotingApi,
postQaVotingApi, postAnswerApi, postQuestionApi
```

类型关键词：`VoteInfo`、`CoinScore`、`QaVoting`。

---

## spot：现货交易、现货订单、市场工具

路径：

```text
packages/apps-kit/core/network/src/api/spot/index.ts
packages/apps-kit/core/network/src/api/spot/types.ts
```

```text
getSpotTradeListApi, getSpotGridPositionListApi, getSpotInvestPositionListApi,
getSpotMartinPositionListApi, getSpotCurrencyCostApi, getSpotPositionApi,
closeSpotOrderApi, getSpotHistoryDetailApi, getSpotHistoryCommissionApi,
getSpotHistoryExportApi, getSpotPositionListApi, postSpotOpenOrderApi,
postSpotOpenStopOrderApi, postSpotOpenOcoOrderApi, getSpotAvgPriceApi,
postSpotOrderUpdateApi, getWeb3SymbolsApi, getWeb3ZoneTokensApi,
getSpotBlockHeatMapApi, getSpotMarketChangeApi, getSpotMarketChangeApiIdle,
getSpotVolatilityCurrencyApi, getSpotPanicIndexApi, getSpotProductListApi,
getPolyMarketsPathApi
```

类型关键词：`SpotPositionProps`、`SpotCurrencyCostProps`、`HeatMap`、`MarketsChance`、`PanicIndex`、`SpotProductListProps`、`SpotTodayProfitType`。

---

## support：帮助中心

路径：

```text
packages/apps-kit/core/network/src/api/support/index.ts
```

```text
getSupportBgUrlApi, postSupportSearchSelectApi, getSupportContactApi
```

类型关键词：`SupportContact`、`SupportSearchResult`。

---

## swap：永续合约交易与仓位

路径：

```text
packages/apps-kit/core/network/src/api/swap/index.ts
packages/apps-kit/core/network/src/api/swap/types.ts
```

主要用于 U 本位/币本位合约资产、订单、仓位、止盈止损、反手开仓、杠杆、保证金、资金费率、风险限额、历史记录、盈亏分析等。

**资产 / 钱包**

```text
getSwapAssetsTransactionApi, getSwapAssetsTransactionApi2, postSwapCreateWalletApi,
updateSwapWalletApi, addSwapTestnetCoinApi, addSwapTestnetCoinLimitApi,
getSwapAccountAssetApi, getSwapAssetsSnapshot
```

**订单 / 仓位**

```text
getSwapPositionApi, getSwapGetPendingApi, postSwapCreateWalletApi,
postSwapAddOtocoApi, postSwapAddOtocoV2Api, postSwapRewardPlaceOrderApi,
postSwapRewardCloseApi, delSwapOrderCancelApi, delSwapOrderCancelAllApi,
postSwapPositionCloseAllApi, postSwapPositionCloseApi, postSwapEditOrderApi,
postSwapCancelOrderApi, getSwapRecordPositionHistoryApi, getSwapHistoryOrdersApi,
getSwapHistoryOrderApi, getSwapHistoryDealApi, getSwapHistoryDetailApi,
getSwapTradeListApi, getSwapPositionHistoryApi, getSwapPositionPlansApi,
postSwapPositionPlansApi
```

**止盈止损 / 反手 / 杠杆 / 保证金**

```text
postSwapSetSpslApi, postSwapEditSpslApi, postSwapReverseOpenPositionApi,
postSwapReverseOpenPositionV2Api, postSwapPriceProtectApi, postSwapUpdateLeverApi,
postSwapBatchUserSetting, getSwapCalculateLpApi, swapAdjustPositionMarginApi,
postSwapAutoPositionMarginApi, swapUpdateMarginTypeApi, postSwapOrderTraceOrderApi
```

**资金费率 / 风险限额**

```text
getSwapsFundingRateApi, getSwapsFundingRateHistoryApi, getSwapRealTimeFundingRate,
getSwapsPositionLimitApi, getSwapPublicRiskDaysApi, getSwapGetRiskDetailApi,
getSwapGetLeverageFindApi, swapGetContractRiskListApi,
swapGetPublicCommonLeverageBracketApi, swapGetPublicCommonErrorsApi
```

**盈亏 / 报告**

```text
getSwapUProfitsReportsApi, getSwapProfitsReportsApi, getSwapUTotalProfitsApi,
getSwapTotalProfitsApi, getSwapCopySmartIncomeApi, getSwapAnalysis,
getSwapPnlFees, getKlineUTradeHistoryApi, getKlineCTradeHistoryApi
```

**合约设置 / 协议**

```text
swapGetPositionTypeApi, swapUpdatePositionTypeApi, postSwapUpdateUnitApi,
getSwapContractDetailApi, getSwapAgreementApi, getSwapGetAgreementApi,
swapSetNotificationSettingApi, getSwapNotificationSettingApi,
getSwapSetUserWarnOpenApi, postSwapSetUserWarnAddMarginNotifyApi,
postSwapSetUserWarnAddLpNotifyApi, swapSetUserSettingCouponApi,
getSwapPrivateRulesInfoApi
```

类型关键词：`PerpetualUAssetsProps`、`SwapAssetsTransactionProps`、`SwapHistoryDealProps`、`SwapHistoryOrdersProps`、`SwapPrivateRulesInfoProps`、`ProfitItem`、`FundingRateItem`、`SwapRewardPlaceOrderApiType`。

---

## swap-copy：合约跟单

路径：

```text
packages/apps-kit/core/network/src/api/swap-copy/index.ts
packages/apps-kit/core/network/src/api/swap-copy/types.ts
```

**广场 / 交易员**

```text
getSwapCopyPublicTradersApi, getSwapCopyPublicTradersRankingApi,
getSwapCopyPublicTopTradersApi, getSwapCopyPublicTraderDetailApi,
getSwapCopyPublicCopyMessagesApi, getSwapCopyPublicPresetCopyConditionApi,
getSwapCopyPublicTagsApi, getSwapCopyPublicSymbolsApi,
getSwapCopyPublicProductConditionApi, getSwapCopyTraderPlazaConditionApi
```

**跟随者**

```text
getSwapCopyPrivateFollowerTraderDetailApi, getSwapCopyPrivateInfoApi,
getSwapCopyPrivateFollowMyTradersApi, getSwapCopyPrivateFollowMyTradersCountApi,
getSwapCopyPrivateFollowsApi, postSwapCopyPrivateFollowerSetCancelAutoApi,
postSwapCopyFollowerReminderApi, postSwapCopyFollowerChangeSmartMarginApi,
postSwapCopyPrivateFollowSaveTraderApi, getSwapCopyPrivateFollowShowFollowDetailsApi,
postSwapCopyPrivateFollowCancelApi, getSwapCopyPrivateFutureAccountCopyBalanceApi,
getSwapCopyPrivateSmartMarginMinApi
```

**跟单交易 / 仓位**

```text
getSwapCopyPositionApi, getSwapCopyPositionDetailApi,
postSwapCopyPrivateTradePlaceApi, postSwapCopyPrivateTradeCloseOrderApi,
postSwapCopyPrivateTradeTpslSettingApi, postRewardPlaceTpslApi,
postRewardPlaceEditTpslApi, postSwapCopyPrivateTradeBatchCancelApi,
postSwapCopyPrivateTradeCloseApi
```

**交易员后台**

```text
getSwapCopyTraderDetailApi, getSwapCopyTraderSaveApi, getSwapCopyTraderSwitchSetApi,
getSwapCopyTraderCancelTraderApi, getSwapCopyTraderSymbolsApi,
getSwapCopyAccountApplyApi, getSwapCopyAccountApplyProcessApi,
getSwapCopyTraderCancelTraderApplyApi, getSwapCopyPrivateTraderCanApplyApi,
postSwapCopyPrivateConfirmApi, getSwapCopyTraderTraderIncomeInfoApi,
getSwapCopyAccountAssetApi, getSwapCopyTraderFollowerLogsApi,
getSwapCopyTraderFollowerDetailApi, getSwapCopyTraderFollowerInfoApi,
getSwapCopyTraderRemoveFollowerApi, getSwapCopyTraderBatchRemoveFollowerApi,
getSwapCopyTraderRebatesApi, getSwapCopyTraderSymbolPositionsApi,
getSwapCopyTraderIncomeStatsApi, getSwapCopyTraderIncomeChartApi,
getSwapCopyTraderSymbolStatsApi, getSwapCopyTraderOrderStatsApi,
getSwapCopyTraderPositionsApi, getSwapCopyTraderPositionsHistoryOrdersApi,
getSwapCopyTraderTraderOrdersApi, getSwapCopyTraderTraderPositionsApi,
getSwapCopyTraderHistoryTraderOrdersApi, getSwapCopyTraderFollowersApi
```

类型关键词：`SwapCopyPublicTradersProps`、`SwapCopyPublicTradersParams`、`SwapCopyPublicTraderDetailProps`、`SwapCopyPrivateInfoProps`、`SwapCopyPositionProps`、`SmartMarginParamsType`、`RewardPlaceTpslApiType`。

---

## task：任务、奖励、红包

路径：

```text
packages/apps-kit/core/network/src/api/task/index.ts
```

```text
getTaskListApi, getRewardApi, getRewardListApi, getDrawCountApi,
getRewordApi, getRewordHistoryApi, openRedPacketApi,
getRedPacketDetailApi
```

类型关键词：`TaskItem`、`RewardItem`、`RedPacketDetail`。

---

## trade：策略交易、兑换、K 线历史

路径：

```text
packages/apps-kit/core/network/src/api/trade/index.ts
packages/apps-kit/core/network/src/api/trade/types.ts
```

主要用于现货网格、合约网格、定投、马丁策略、兑换、K 线历史、Web3 K 线、SEO 币种列表等。

**现货网格**

```text
getTradeGridSymbolsApi, getTradeGridSquareListApi, postTradeCreateGridStrategyApi,
getTradeMyGridListApi, stopTradeGridByIdApi, getTradeGridDetailApi,
getGridStrategyPriceListApi, getGridStrategyDealListApi, updateTradeGridApi,
getTradeGridMaxApyApi, getTradeGridRollListApi, getTradeGridAiListApi
```

**合约网格**

```text
getSwapGridSymbolsApi, getSwapTradeGridSquareListApi, postTradeCreateSwapGridApi,
getSwapGridPostionsApi, postTradeSwapGridStartNowApi, postSwapGridStrategyStopApi,
postSwapGridStrategyStopAllApi, postSwapGridStrategyUpdateApi, getSwapGridShareApi,
getSwapGridTopRoiApi, postSwapGridDetailApi, postSwapGridOpenOrdersApi,
postSwapGridTradingRecordApi, getSwapGridStrategyCertApi,
getSwapGridStrategyConfirmCertApi, postSwapGridStrategyAddMarginApi,
getTradeSwapGridRollUserApi, getTradeSwapGridAIParamsApi
```

**定投**

```text
getTradeInvestSymbolsApi, getTradeInvestSquareListApi, postTradeCreateInvestStrategyApi,
postTradeUpdateInvestStrategyApi, getInvestOrderListApi, getTradeInvestDetailApi,
stopTradeInvestByIdApi, getTradeInvestMaxApyApi
```

**马丁**

```text
getTradeMartinSymbolsApi, getTradeMartinSquareListApi, postTradeCreateMartinStrategyApi,
stopTradeMartinByIdApi, getTradeMartinDetailApi, getTradeMartinPeriodApi,
getTradeMartinRollListApi, getTradeMartinMaxApyApi
```

**兑换 / K 线**

```text
getTradeConvertRateApi, getTradeExchangeCurrencyApi, getTradeExchangeCurrencyV2Api,
postTradeExchangeApplyApi, getTradeConvertCurrencyApi,
getTradeHistoryKlineApi, getKlineHistoryApi, getWeb3KlineHistoryApi, getSeoCoinCurrenciesApi
```

类型关键词：`GridStrategy`、`SwapGridPosition`、`InvestStrategy`、`MartinStrategy`、`TradeConvertRate`、`KlineHistory`。

---

## welfare：福利、任务、抽奖、比赛

路径：

```text
packages/apps-kit/core/network/src/api/welfare/index.ts
packages/apps-kit/core/network/src/api/welfare/types.ts
```

```text
getWelfareDailyMissionApi, getWelfareUserTaskListApi, getWelfarePublicOverviewApi,
getWelfarePrivateOverviewApi, postWelfareWithdrawRewardApi, postWelfareCollectUserGiftApi,
getWelfareActivityMissionsApi, postCollectApi, getWelfarePointsApi, getDailyPrizesApi,
postExchangePrizeApi, postDailyPrizesApi, postCompleteDailyIdApi, getDailyRewardsApi,
getDailyPrizeRecordsApi, getContestRanksApi, getContestInfoApi, getCustomContestRewardsApi,
getManiacCalendarsApi, getManiacCalendarRewardsApi, getManiacCalendarRecordsApi,
postManiacCalendarDrawApi, postManiacCalendarCollectApi, getManiacCalendarConfigsApi,
getRoiContestInfoApi, getUserRoiRankApi, getRoiRanksApi, getRoiWinnersApi,
getAttendCountApi, getAnnInfoApi, getAnnRecordsApi, collectLotteryApi, drawLotteryApi,
collectCardApi, openGiftApi, getMissionDetailApi, joinMissionApi,
collectMissionRewardApi, getMissionJoinInfoApi
```

类型关键词：`WELFARE_TYPE`、`TWelfareTaskList`、`WITHDRAW_TYPE`、`MissionDetail`、`LeaderboardItem`、`RewardInfo`、`TaskListData`。

---

## 其他根文件

### `index.ts`

路径：

```text
packages/apps-kit/core/network/src/api/index.ts
```

作用：API 模块统一导出入口。新增接口模块或希望外部通过 `@/core/network/src/api` 统一引用时，需确认此文件是否已导出对应模块。

### `paths.ts`

路径：

```text
packages/apps-kit/core/network/src/api/paths.ts
```

作用：集中维护部分接口 path 常量。查找接口路径、确认是否已有 path 常量、避免手写重复路径时优先读取。

---

## AI 查找建议

当用户描述一个接口需求时，按以下顺序定位：

```text
1. 先在本文模块速查表里判断业务域。
2. 读取对应模块 index.ts，看是否已有 *Api 函数。
3. 读取同目录 types.ts/type.ts，确认参数和返回结构。
4. 如调用方式不确定，搜索该 Api 名的现有调用方。
5. 如需要新增接口，先确认 paths.ts / index.ts / types.ts 是否需要同步更新。
```

常用只读命令示例：

```bash
rg "getXxxApi|postXxxApi" packages/apps-kit/core/network/src/api apps packages -g '*.{ts,tsx}'
rg "export .*Api" packages/apps-kit/core/network/src/api/<module>/index.ts
```

---

## 新增接口检查清单

新增接口时必须同步完成以下步骤，不得遗漏：

```text
1. 在对应模块 index.ts 添加 *Api 函数，命名遵守 get*/post*/del*/update*/set*/toggle* 约定
2. 参数和返回类型定义到同目录 types.ts（markets 模块为 type.ts）
3. 接口路径常量添加到 paths.ts（如适用）
4. 确认 api/index.ts barrel 已导出新模块或新函数
5. 禁止在组件内直接调用 axios/fetch，必须通过 *Api 函数封装后调用
6. 禁止修改 package.json / lockfile 引入新依赖
```
