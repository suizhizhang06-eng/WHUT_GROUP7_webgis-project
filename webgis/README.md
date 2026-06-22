# 地理叙事驱动GIS系统

基于"地理叙事驱动"理念构建的GIS原型系统，融合空间数据与叙事逻辑，以张骞出使西域/丝绸之路为典型案例。

## 功能特性

### 核心功能
- **叙事地图编辑** - 添加、编辑、删除地理事件
- **时空路径可视化** - 动态展示丝绸之路路线
- **交互式故事线** - 章节式叙事浏览
- **空间分析** - 缓冲区分析、影响范围分析、叠加分析

### 技术实现
- **SVG地图符号** - 自定义事件、角色、地点标记
- **Mashup技术** - 集成OpenStreetMap底图
- **数据模型** - 事件-角色-地点-时间多层结构

## 项目结构

```
webgis/
├── index.html              # 主入口
├── css/
│   ├── main.css           # 全局样式
│   ├── map.css            # 地图样式
│   ├── timeline.css       # 时间线样式
│   └── narrative.css      # 叙事面板样式
├── js/
│   ├── app.js             # 应用入口
│   ├── map.js             # 地图核心模块
│   ├── data-model.js      # 数据模型
│   ├── svg-symbols.js     # SVG符号系统
│   ├── timeline.js        # 时间线组件
│   ├── narrative.js       # 叙事编辑器
│   ├── spatial-analysis.js # 空间分析
│   └── case-zhangqian.js  # 张骞案例
├── data/
│   └── zhangqian.json     # 丝绸之路数据
└── README.md
```

## 快速开始

### 方法一：使用Python（推荐）

1. **检查Python是否安装**
   - 打开命令提示符（Win+R，输入`cmd`，回车）
   - 输入：`python --version`
   - 如果显示版本号（如Python 3.x.x），说明已安装

2. **启动服务器**
   - 打开命令提示符
   - 进入项目目录：
     ```bash
     cd /d E:\webgis
     ```
   - 启动HTTP服务器：
     ```bash
     python -m http.server 8000
     ```
   - 看到 `Serving HTTP on 0.0.0.0 port 8000` 表示成功

3. **打开浏览器访问**
   - 在浏览器地址栏输入：`http://localhost:8000`
   - 或者：`http://127.0.0.1:8000`

### 方法二：使用VSCode插件

1. **安装Live Server插件**
   - 打开VSCode
   - 点击左侧扩展图标（或按`Ctrl+Shift+X`）
   - 搜索 "Live Server"
   - 点击 "Install" 安装

2. **启动服务器**
   - 右键点击 `index.html` 文件
   - 选择 "Open with Live Server"
   - 浏览器会自动打开

### 方法三：使用Node.js

1. **检查Node.js是否安装**
   - 打开命令提示符
   - 输入：`node --version`
   - 如果显示版本号，说明已安装

2. **启动服务器**
   - 打开命令提示符
   - 进入项目目录：
     ```bash
     cd /d E:\webgis
     ```
   - 启动HTTP服务器：
     ```bash
     npx http-server -p 8000
     ```
   - 首次运行会自动下载工具

### 测试地图是否正常

1. 先访问测试页面：`http://localhost:8000/test-map.html`
2. 如果地图能正常显示，再访问主页面：`http://localhost:8000`

## 数据模型

### 事件 (Event)
```javascript
{
  id: "event-01",
  name: "受命出使",
  time: { start: "前138年", end: "", sortKey: -138 },
  location: { lat: 34.26, lng: 108.94, name: "长安" },
  type: "departure",
  description: "...",
  roles: ["zhangqian", "han-wudi"]
}
```

### 角色 (Role)
```javascript
{
  id: "zhangqian",
  name: "张骞",
  type: "person",
  description: "西汉著名外交家"
}
```

### 路线 (Route)
```javascript
{
  id: "route-01",
  name: "丝绸之路",
  type: "diplomaticRoute",
  color: "#c9a227",
  points: [...],
  animation: true
}
```

## 案例数据

### 张骞出使西域
- **时间跨度**: 前138年 - 前60年
- **主要事件**: 13个
- **关键角色**: 张骞、汉武帝、匈奴、大月氏
- **路线**: 3条（去程、归程、第二次出使）

## 空间分析功能

1. **缓冲区分析** - 分析城市影响范围
2. **叠加分析** - 分析势力范围重叠
3. **时空序列分析** - 事件时间空间分布
4. **路径分析** - 路线距离和方位

## 开发说明

### 技术栈
- 前端: HTML5 + CSS3 + JavaScript ES6+
- 地图: Leaflet.js + OpenStreetMap
- 可视化: SVG自定义符号

### 浏览器支持
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 演示准备

### PPT内容建议
1. 项目背景与意义
2. 系统架构设计
3. 数据模型展示
4. 功能演示（地图、时间线、叙事编辑）
5. 空间分析结果
6. 团队讨论照片
7. 组员分工说明

### 团队分工建议
- **地图开发**: Leaflet集成、底图配置
- **数据模型**: 实体设计、数据库结构
- **SVG符号**: 自定义标记设计
- **前端UI**: 界面布局、交互设计
- **空间分析**: 缓冲区、叠加分析实现
- **案例研究**: 张骞出使西域数据整理

## 常见问题解决

### 问题1：地图不显示

1. **确保使用HTTP服务器启动**
   - 不能直接双击打开`index.html`文件
   - 必须通过`python -m http.server`或Live Server启动

2. **检查浏览器控制台**
   - 按`F12`打开开发者工具
   - 查看Console标签是否有错误
   - 常见错误：`Failed to load resource`表示资源加载失败

3. **检查文件是否完整**
   - 确保`lib`文件夹中有`leaflet.css`和`leaflet.js`
   - 确保`data`文件夹中有`zhangqian.json`

### 问题2：端口被占用

如果8000端口被占用，可以使用其他端口：
```bash
python -m http.server 8080
python -m http.server 3000
```

### 问题3：Leaflet库加载失败

如果地图测试页面显示错误，尝试：
1. 重新启动服务器
2. 清除浏览器缓存（Ctrl+F5）
3. 检查网络连接

## 许可证

本项目仅供学习和研究使用。
