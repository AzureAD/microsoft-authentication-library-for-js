"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIManager = void 0;
var Constants_1 = require("./Constants");
/**
 * Class that handles UI updates for the app.
 */
var UIManager = /** @class */ (function () {
    function UIManager() {
        this.welcomeDiv = document.getElementById("WelcomeMessage");
        this.signInButton = document.getElementById("SignIn");
        this.cardDiv = document.getElementById("card-div");
        this.mailButton = document.getElementById("readMail");
        this.profileButton = document.getElementById("seeProfile");
        this.profileDiv = document.getElementById("profile-div");
        this.tabList = document.getElementById("list-tab");
        this.tabContent = document.getElementById("nav-tabContent");
    }
    UIManager.prototype.showWelcomeMessage = function (account) {
        // Reconfiguring DOM elements
        this.cardDiv.style.display = 'initial';
        this.welcomeDiv.innerHTML = "Welcome " + account.username;
        this.signInButton.nextElementSibling.style.display = 'none';
        this.signInButton.setAttribute("onclick", "App.signOut();");
        this.signInButton.setAttribute('class', "btn btn-success");
        this.signInButton.innerHTML = "Sign Out";
    };
    UIManager.prototype.clearTabs = function () {
        this.tabList.innerHTML = '';
        this.tabContent.innerHTML = '';
    };
    UIManager.prototype.updateUI = function (data, endpoint) {
        console.log("Graph API responded at: " + new Date().toString());
        if (endpoint === Constants_1.GRAPH_CONFIG.GRAPH_ME_ENDPT) {
            this.setProfile(data);
        }
        else if (endpoint === Constants_1.GRAPH_CONFIG.GRAPH_MAIL_ENDPT) {
            this.setMail(data);
        }
    };
    UIManager.prototype.setProfile = function (data) {
        var userInfo = data;
        var profile = document.createElement("pre");
        profile.innerHTML = JSON.stringify(userInfo, null, 4);
        this.clearTabs();
        this.tabContent.appendChild(profile);
    };
    UIManager.prototype.setMail = function (data) {
        var _this = this;
        var mailInfo = data;
        if (mailInfo.value.length < 1) {
            alert("Your mailbox is empty!");
        }
        else {
            this.clearTabs();
            mailInfo.value.slice(0, 10).forEach(function (d, i) {
                _this.createAndAppendListItem(d, i);
                _this.createAndAppendContentItem(d, i);
            });
        }
    };
    UIManager.prototype.createAndAppendListItem = function (d, i) {
        var listItem = document.createElement("a");
        listItem.setAttribute("class", "list-group-item list-group-item-action");
        listItem.setAttribute("id", "list" + i + "list");
        listItem.setAttribute("data-toggle", "list");
        listItem.setAttribute("href", "#list" + i);
        listItem.setAttribute("role", "tab");
        listItem.setAttribute("aria-controls", "" + i);
        listItem.innerHTML = d.subject;
        this.tabList.appendChild(listItem);
    };
    UIManager.prototype.createAndAppendContentItem = function (d, i) {
        var contentItem = document.createElement("div");
        contentItem.setAttribute("class", "tab-pane fade");
        contentItem.setAttribute("id", "list" + i);
        contentItem.setAttribute("role", "tabpanel");
        contentItem.setAttribute("aria-labelledby", "list" + i + "list");
        if (d.from) {
            contentItem.innerHTML = "<strong> from: " + d.from.emailAddress.address + "</strong><br><br>" + d.bodyPreview + "...";
            this.tabContent.appendChild(contentItem);
        }
    };
    return UIManager;
}());
exports.UIManager = UIManager;
//# sourceMappingURL=UIManager.js.map