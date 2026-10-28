// ============================================================
// FlClash 覆写脚本：订阅无关的分流骨架
// 规则来源：blackmatrix7/ios_rule_script（单源，668 分类）
// 生成日期：2026-10-28
//
// 设计目标：更换订阅 / 更换机场后，分流效果不变，无需改任何一行
// 实现手段：① 组名固定（不依赖机场自带组名）
//           ② 组成员由 include-all-proxies / include-all-providers 自动纳入
//           ③ rules 整体替换（不追加，避免机场自带规则抢先命中）
//
// 用法：FlClash → 配置 → 选中订阅 → 覆写 → 脚本 → 粘贴本文件 → 保存
//       → 在该订阅的覆写页选中此脚本 → 应用配置 → 重启连接
// 注意：启用脚本覆写后，界面的「自定义规则」不会并入生效
// ============================================================

// ======= 可调项 =======

const GROUP_MAIN = "🚀 代理";
const GROUP_AUTO = "♻️ 自动";
const GROUP_AI = "🤖 AI";
const GROUP_YT = "📺 YouTube";
const GROUP_STEAM = "🎮 Steam";

// true = 交给内核自动纳入全部节点（推荐，含 proxy-providers 场景）
// false = 退回按节点名列表生成成员（当上面的方式导致组为空时改这里）
const USE_INCLUDE_ALL = true;

// 是否保留机场自带的策略组（false = 只保留本脚本定义的组，界面更干净）
const KEEP_ORIGINAL_GROUPS = false;

// 排除机场的伪节点（剩余流量、到期时间、官网入口等）
const EXCLUDE_FILTER = "剩余|过期|到期|官网|流量|套餐|重置|失效|Expire|Traffic";

// 自动测速地址与参数
const TEST_URL = "http://www.gstatic.com/generate_204";
const TEST_INTERVAL = 300;
const TEST_TOLERANCE = 50;

// 规则集镜像：本机实测 raw.githubusercontent 返回 000（被拦），
// jsDelivr 返回 200 且字节数与上游完全一致，故用 jsDelivr 作为源。
// 若日后 jsDelivr 不可用，改回下面这行即可：
// const RULESET_BASE = "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash";
const RULESET_BASE = "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash";

// ======= 规则集（全部来自同一仓库，便于统一更新） =======

const provider = (category) => ({
  type: "http",
  behavior: "classical",
  format: "yaml",
  url: RULESET_BASE + "/" + category + "/" + category + ".yaml",
  path: "./ruleset/" + category.toLowerCase() + ".yaml",
  interval: 86400,
  proxy: GROUP_MAIN,
});

const RULE_PROVIDERS = {
  netease: provider("NetEase"),
  ad: provider("Advertising"),
  steamcn: provider("SteamCN"),
  steam: provider("Steam"),
  anthropic: provider("Anthropic"),
  openai: provider("OpenAI"),
  gemini: provider("Gemini"),
  copilot: provider("Copilot"),
  youtube: provider("YouTube"),
  github: provider("GitHub"),
  npmjs: provider("Npmjs"),
  docker: provider("Docker"),
  pypi: provider("Python"),
  jetbrains: provider("Jetbrains"),
};

// ======= 规则（顺序即优先级，勿随意调换） =======

const RULES = [
  "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
  "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
  "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
  "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
  "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
  "DOMAIN-SUFFIX,local,DIRECT",
  "DOMAIN-SUFFIX,lan,DIRECT",

  "RULE-SET,netease,DIRECT",
  "DOMAIN-SUFFIX,uu.163.com,DIRECT",
  "DOMAIN-SUFFIX,uuyc.163.com,DIRECT",

  "RULE-SET,ad,REJECT",

  "RULE-SET,steamcn,DIRECT",
  "RULE-SET,steam," + GROUP_STEAM,

  "RULE-SET,anthropic," + GROUP_AI,
  "RULE-SET,openai," + GROUP_AI,
  "RULE-SET,gemini," + GROUP_AI,
  "RULE-SET,copilot," + GROUP_AI,

  "RULE-SET,youtube," + GROUP_YT,

  "RULE-SET,github," + GROUP_MAIN,
  "RULE-SET,npmjs," + GROUP_MAIN,
  "RULE-SET,docker," + GROUP_MAIN,
  "RULE-SET,pypi," + GROUP_MAIN,
  "RULE-SET,jetbrains," + GROUP_MAIN,

  "GEOSITE,cn,DIRECT",
  "GEOIP,CN,DIRECT,no-resolve",
  "MATCH," + GROUP_MAIN,
];

// ======= 核心逻辑 =======

const applyConfig = (config) => {
  config.proxies = config.proxies || [];
  config["proxy-providers"] = config["proxy-providers"] || {};

  const nodeNames = config.proxies
    .map((p) => (p && p.name) || "")
    .filter((n) => n.length > 0);

  // 兜底一：没有节点时不动配置，避免生成指向空组的规则导致加载失败
  const providerCount = Object.keys(config["proxy-providers"]).length;
  if (nodeNames.length === 0 && providerCount === 0) {
    console.log("[router] 未发现任何节点，跳过改写，保留订阅原配置");
    return config;
  }

  const buildGroup = (name, type, nest) => {
    const g = { name: name, type: type };

    if (USE_INCLUDE_ALL) {
      g["include-all-proxies"] = true;
      g["include-all-providers"] = true;
      g["exclude-filter"] = EXCLUDE_FILTER;
      if (nest && nest.length > 0) {
        g.proxies = nest.slice();
      }
    } else {
      g.proxies = (nest || []).concat(nodeNames);
    }

    if (type === "url-test" || type === "fallback") {
      g.url = TEST_URL;
      g.interval = TEST_INTERVAL;
      g.tolerance = TEST_TOLERANCE;
      g.lazy = false;
    }
    return g;
  };

  const myGroups = [
    buildGroup(GROUP_MAIN, "select", null),
    buildGroup(GROUP_AUTO, "url-test", null),
    buildGroup(GROUP_AI, "select", [GROUP_AUTO]),
    buildGroup(GROUP_YT, "select", [GROUP_AUTO]),
    buildGroup(GROUP_STEAM, "select", [GROUP_AUTO]),
  ];

  if (KEEP_ORIGINAL_GROUPS) {
    const kept = (config["proxy-groups"] || []).filter((old) => {
      return !myGroups.some((mine) => mine.name === old.name);
    });
    config["proxy-groups"] = kept.concat(myGroups);
  } else {
    config["proxy-groups"] = myGroups;
  }

  config["rule-providers"] = RULE_PROVIDERS;
  config.rules = RULES.slice();

  console.log(
    "[router] 节点 " + nodeNames.length + " 个 / 组 " + myGroups.length + " 个 / 规则 " + RULES.length + " 条"
  );
  return config;
};

// 兜底二：脚本任何异常都不吞掉配置，原样返回订阅内容，保证线路不会整体不可用
const main = (config) => {
  try {
    return applyConfig(config);
  } catch (e) {
    console.log("[router] 脚本异常，已回退到订阅原配置：" + e);
    return config;
  }
};
