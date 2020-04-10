require("@babel/register")({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
require('jsdom-global')("", {
    url: "https://localhost:8081/index.html"
});
