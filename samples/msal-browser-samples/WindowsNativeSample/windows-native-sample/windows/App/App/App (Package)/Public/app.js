function onClick(method) {
    _method = "redirect";
    if (method === "redirect_o") {
        promise = signOut(_method);
        promise.then((response) => {
            document.getElementById("r_btn").innerHTML = '<ion-button id = redirect_i onclick ="onClick(this.id)">Log in with redirect</ion-button>'
        });
        promise.then((response) => {
            document.getElementById("text").innerHTML = '<ion-text><h1>Please log in.</h1></ion-text>'
        });
    } else if (method === "redirect_i") {
        promise = signIn(_method);
        acc = null;
        promise.then((response) => {
            acc = myMSALObj.getAllAccounts();
        });
        promise.then((response) => {
            if (acc.length !== 0) {
                document.getElementById("r_btn").innerHTML = '<ion-button id = redirect_o onclick ="onClick(this.id)">Log out with redirect</ion-button>'
            }
        });
    } else if (method === "sso_i") {
        sessionStorage.setItem("0d812bad-ab5d-4672-b5f8-335e48094d9f.72f988bf-86f1-41af-91ab-2d7cd011db47-login.windows.net-72f988bf-86f1-41af-91ab-2d7cd011db47", "{\"homeAccountId\": \"0d812bad-ab5d-4672-b5f8-335e48094d9f.72f988bf-86f1-41af-91ab-2d7cd011db47\",  \"environment\": \"login.windows.net\", \"realm\": \"72f988bf-86f1-41af-91ab-2d7cd011db47\",  \"localAccountId\": \"0d812bad-ab5d-4672-b5f8-335e48094d9f.72f988bf-86f1-41af-91ab-2d7cd011db47\",  \"username\": \"t-ssummers@microsoft.com\",  \"authorityType\": \"MSSTS\",  \"name\": \"Shyla Summers\",  \"clientInfo\": \"eyJ1aWQiOiIwZDgxMmJhZC1hYjVkLTQ2NzItYjVmOC0zMzVlNDgwOTRkOWYiLCJ1dGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3In0\",  \"idTokenClaims\": \"{}\",  \"nativeAccountId\": \"PTWGGIuYQagoPsNwJI_4F3arBvMfckbdN0Q6uzGQU38\"}");
        promise = signIn(_method);
        acc = null;
        promise.then((response) => {
            if (acc.length !== 0) {
                document.getElementById("r_btn").innerHTML = '<ion-button id = redirect_o onclick ="onClick(this.id)">Log out with redirect</ion-button>'
            }
        });
    }
}

