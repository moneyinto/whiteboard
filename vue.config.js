const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
    productionSourceMap: false,
    devServer: {
        host: "localhost",
        open: true
    }
});
