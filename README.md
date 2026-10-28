# flclash-router

FlClash（mihomo 内核）覆写脚本：**订阅无关的分流骨架**。

## 它解决什么

换订阅 / 换机场后，分流规则不用重新配置。做法是：

1. **组名固定** —— 脚本自建 `🚀 代理` / `♻️ 自动` / `🤖 AI` / `📺 YouTube` / `🎮 Steam`，不依赖机场自带组名；
2. **成员自动纳入** —— 用 mihomo 官方字段 `include-all-proxies` / `include-all-providers`，节点由内核填充，脚本不碰节点名；
3. **规则整体替换** —— 覆盖而非追加，机场自带规则退出，避免"追加在 MATCH 之后不生效"。

## 规则来源

[blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)（668 个分类，近乎日更）。
地址走 jsDelivr 镜像，规避 `raw.githubusercontent.com` 在部分网络下不可达的问题。

## 使用方式

在 FlClash 中：`工具 → 进阶配置 → 脚本 → + → 通过 URL 导入`，填：

```
https://cdn.jsdelivr.net/gh/zmpunkws/flclash-router@main/flclash-router.js
```

然后 `配置 → 选中订阅 → 扩展 → 模式选「脚本」→ 勾选本脚本 → 立即应用`，完全退出重启。

## 更新

- **规则内容**：`interval: 86400`，内核每天自动重拉，无需操作；
- **脚本本身**：本仓库改动后，在 FlClash 脚本条目上点 **Sync** 即可拉取最新版。

## 注意

- 脚本模式与「附加规则」互斥，两者只能取一；
- 脚本含两层兜底：无节点时原样返回订阅配置；任何异常捕获后回退，不会导致配置加载失败；
- 本仓库不含任何订阅地址或凭据。

## 许可

脚本部分可自由使用与修改；规则内容遵循上游 GPL-2.0。
