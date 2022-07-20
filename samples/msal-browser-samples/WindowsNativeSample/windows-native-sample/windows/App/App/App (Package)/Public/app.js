function onClick(method)
{
    _method = "popup";
    if(method === "redirect_i" || method === "redirect_o") {
        _method = "redirect";
    }
    if(method === "redirect_o" || method === "popup_o") {
        promise = signOut(_method);
        promise.then((response) => {
            document.getElementById("r_btn").innerHTML = '<ion-button id = redirect_i onclick ="onClick(this.id)">Log in with redirect</ion-button>'
        });
        promise.then((response) => {
            document.getElementById("p_btn").innerHTML = '<ion-button id = popup_i onclick ="onClick(this.id)">Log in with popup</ion-button>'
        });
        promise.then((response) => {
            document.getElementById("text").innerHTML = '<ion-text><h1>Please log in.</h1></ion-text>'
        });
    } else {
        promise = signIn(_method);
        acc = null;
        promise.then((response) => {
            acc = myMSALObj.getAllAccounts();
        });
        promise.then((response) => {
            if(acc.length !== 0) {
                document.getElementById("r_btn").innerHTML = '<ion-button id = redirect_o onclick ="onClick(this.id)">Log out with redirect</ion-button>'
            }
        });
        promise.then((response) => {
            if(acc.length !== 0) {
                document.getElementById("p_btn").innerHTML = '<ion-button id = popup_o onclick ="onClick(this.id)">Log out with popup</ion-button>'
            }
        });
    }
}
