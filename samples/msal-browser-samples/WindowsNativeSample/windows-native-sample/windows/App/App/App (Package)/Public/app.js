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
        promise = signIn(_method);
        acc = null;
        promise.then((response) => {
            if (acc.length !== 0) {
                document.getElementById("r_btn").innerHTML = '<ion-button id = redirect_o onclick ="onClick(this.id)">Log out with redirect</ion-button>'
            }
        });
    }
}

