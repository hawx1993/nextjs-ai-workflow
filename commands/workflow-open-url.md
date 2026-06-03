---
allowed-tools: Bash(open:*)
argument-hint: '[链接编号或名称，为空输出所有可用链接]'
description: 打开 BYDFi 内网链接
author: Nilu
---

# 打开 BYDFi 内网链接

请列出以下内网链接供用户选择，然后在终端执行对应的打开命令。

## 可用链接

| 编号 | 名称                 | 地址                                                                                                                                          |
| ---- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | pc 翻译文件          | https://docs.google.com/spreadsheets/d/1LmvhCzThbOrrwgE3dFbA67OpleNw7g4UcjE43A_cOdc/edit?gid=1003310739#gid=1003310739                        |
| 2    | CI/CD 流水线         | https://github.com/bydfi-docs/bydfi-web/actions                                                                                               |
| 3    | 接口文档             | http://swagger.internal.bydfi.com                                                                                                             |
| 4    | 代码仓库             | https://github.com/byd-docs/byd-web                                                                                                           |
| 5    | 敏捷项目任务看板     | https://bydfimoon.sg.larksuite.com/wiki/XAavwExT9iwTeekCXHNlQ1JYgfb?base_hp_from=larktab&chunked=false&table=tbl9QMcOcShI19Ij&view=vewHwLdbxi |
| 6    | AI 中转站            | https://codeapi.codetech.pro/                                                                                                                 |
| 7    | -1 测试环境          | https://beta-1.bydtms.com/zh                                                                                                                  |
| 8    | beta 预发布环境      | https://beta.bydfi.com/zh/                                                                                                                    |
| 9    | cex 版本进度表       | https://rjdx19yd9zo.sg.larksuite.com/base/ZJr9bYpTRa8jK1suLzklBbRcgDg?table=tblrZ7d9eUdBeKpy&view=vewTPOzIt4                                  |
| 10   | web 测试域名占用情况 | https://rjdx19yd9zo.sg.larksuite.com/base/ZJr9bYpTRa8jK1suLzklBbRcgDg?table=tbl5J1UzmhGsDCEo&view=vew6cJuuwH                                  |

## 执行规则

- 如果 `$ARGUMENTS` 为空，展示上方表格，询问用户输入编号或名称，等待回复后执行：`open "对应的URL"`。
- 如果 `$ARGUMENTS` 不为空，直接按编号或名称匹配并执行 `open "对应的URL"`。
- 如果输入的编号或名称不存在，告知用户并重新展示列表。
- 这是打开本地浏览器的命令，不需要调用其它 skill。
