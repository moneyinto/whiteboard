# 一个基于vue3+typescript的画板 (学习canvas + vue3 + typescript)

## 项目目录结构
```
└── WhiteBoard                    // 画板组件
    ├── components                // 拆分的组件
    ├── config                    // 参数配置项
    ├── directives                // 指令
    ├── hooks                     // 根据业务功能拆分的逻辑代码
    ├── icons                     // 图标
    ├── types                     // 定义的类型
    ├── utils                     // 通用工具方法
    └── index.vue                 // 插件主入口文件
```

## 项目运行
```
npm install

npm run serve
```

## [画板封装插件使用](https://www.npmjs.com/package/mwhiteboard)
```
npm install mwhiteboard --save
```

## 功能列表
- [x] 移动
- [x] 缩放
- [x] 撤销
- [x] 恢复
- [x] 画笔
- [x] 颜色
- [x] 粗细
- [x] 平移
- [x] 旋转
- [x] 拉伸
- [x] 橡皮
- [x] 清空
- [ ] 矩形
- [ ] 文本框
- [ ] 导入
- [ ] 导出
