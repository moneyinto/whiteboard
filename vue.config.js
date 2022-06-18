const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
    productionSourceMap: false,
    configureWebpack: {
        devtool: "source-map"
    },
    devServer: {
        host: "localhost",
        open: true
    }
});
