const path = require("path")

module.exports = {
	devtool: "source-map",
	entry: "./index.js",
	output: {
		filename: "flamincome-finance.js",
		path: path.resolve(__dirname, "dist"),
		libraryTarget: "var",
		library: "flam",
	},
}
