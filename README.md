# lenmei233's Homepage

基于 Astro + React + Tailwind CSS 的个人主页，支持中英文双语、玻璃拟态风格、响应式布局。

## 技术栈

- **框架**: Astro 7 + React 19
- **样式**: Tailwind CSS v4
- **路由**: React Router v7 (SPA 模式)
- **构建**: Vite
- **分析**: Vercel Web Analytics

## 快速开始

```bash
# 要求 Node >= 22.12.0
npm install
npm run dev
```

访问 `http://localhost:4321`

## 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 预览构建结果 |

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Layout.tsx       # 页面外壳（背景、侧边栏、设置面板）
│   ├── Sidebar.tsx      # 导航侧边栏
│   ├── GlassCard.tsx    # 玻璃卡片组件
│   ├── Home.tsx         # 首页
│   ├── Projects.tsx     # 项目页
│   ├── TechStack.tsx    # 技术栈页
│   ├── Friends.tsx      # 友链页
│   ├── About.tsx        # 关于页
│   ├── SettingsPage.tsx # 设置页
│   └── SettingsPanel.tsx# 设置弹窗
├── config/              # JSON 配置
│   ├── site.json        # 站点信息、导航菜单
│   ├── projects.json    # 项目列表
│   ├── friends.json     # 友链列表
│   ├── tech-stack.json  # 技术栈分类
│   └── about.json       # 关于我、时间线
├── i18n/                # 语言包
│   ├── en.json          # 英文
│   └── zh.json          # 中文
├── layouts/
│   └── BaseLayout.astro # HTML 外壳
├── lib/
│   └── settings.ts      # 设置存储与应用
├── pages/               # Astro 页面入口
├── styles/
│   └── global.css       # 全局样式、CSS 变量
└── App.tsx              # React Router 根组件
public/
└── images/              # 背景图、头像等静态资源
```

## 配置说明

### 站点信息 (`src/config/site.json`)

```json
{
  "title": "页面标题",
  "description": "站点描述",
  "author": "作者名",
  "avatar": "/images/avatar.webp",
  "nav": [
    { "label": "Home", "path": "/", "icon": "home" },
    { "label": "Blog", "path": "https://blog.example.com", "icon": "book-open", "external": true }
  ],
  "settings": {
    "defaultBg": "/images/mountains.webp",
    "defaultBlur": 4
  }
}
```

- `nav[].external: true` 表示外部链接，会在新标签页打开
- `icon` 对应 `Sidebar.tsx` 中的 SVG 图标

### 项目列表 (`src/config/projects.json`)

```json
[
  {
    "title": "项目名",
    "description": "项目描述",
    "tags": ["React", "TypeScript"],
    "url": "https://github.com/xxx",
    "image": "/images/project-icon.png"
  }
]
```

- `image` 可选，留空或不填则不显示图标

### 友链列表 (`src/config/friends.json`)

```json
[
  {
    "name": "朋友名",
    "url": "https://example.com",
    "avatar": "https://example.com/avatar.png",
    "description": "一句话介绍"
  }
]
```

### 技术栈 (`src/config/tech-stack.json`)

```json
{
  "categories": [
    {
      "name": "前端",
      "items": [
        { "name": "React" },
        { "name": "TypeScript" }
      ]
    }
  ]
}
```

### 关于我 (`src/config/about.json`)

```json
{
  "bio": "个人简介文字",
  "githubUsername": "your-github-username"
}
```

### 背景图片

将图片放入 `public/images/`，推荐 WebP 格式。用户可在设置面板中选择预设背景或输入自定义 URL。

内置预设：`mountains.webp`、`ocean.webp`、`dark.webp`、`forest.webp`

### 国际化

编辑 `src/i18n/en.json` 和 `src/i18n/zh.json` 添加翻译。所有组件使用 `t('key')` 函数获取翻译文本，语言切换即时生效无需刷新。

### 默认设置

编辑 `src/lib/settings.ts` 中的 `DEFAULTS`：

```ts
const DEFAULTS: UserSettings = {
  bgUrl: '/images/mountains.webp',
  blur: 4,
  accent: '#6c63ff',
  fontSize: 'md',
};
```

## 部署

```bash
npm run build
```

将 `dist/` 目录部署到任意静态托管（Vercel、Netlify、Cloudflare Pages 等）。
