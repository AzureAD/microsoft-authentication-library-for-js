import {UserAgentApplication} from "msal";
import * as $ from "jquery";

$("#login").click(function () {
    if ($("#login").text() === "Login (with Popup)") {
        loginPopup();
    }
    else {
        logout();
    }
});

var applicationConfig = {
    clientID: '0813e1d1-ad72-46a9-8665-399bba48c201',
    graphEndpoint: "https://graph.microsoft.com/v1.0/me/sendMail",
    graphScopes: ["user.read", "mail.send"]
};

var userAgentApplication = new UserAgentApplication(applicationConfig.clientID, null, authCallback);
function authCallback(errorDesc: string, token: string, error: string, tokenType: string) {
    //This function is called after loginRedirect. msal object is bound to the window object after the constructor is called.
    if (token) {
    }
    else {
        log(error + ":" + errorDesc);
    }
}

function log(s) {
    document.body.querySelector('.response').appendChild(document.createTextNode("\n\n" + JSON.stringify(s)));
}

function loginPopup() {
    userAgentApplication.loginPopup(applicationConfig.graphScopes).then(function (idToken) {
        //Login Success
        userAgentApplication.acquireTokenSilent(applicationConfig.graphScopes).then(function (accessToken) {
            //AcquireToken Success
            updateUI();
        }, function (error) {
            //AcquireToken Failure, send an interactive request.
            userAgentApplication.acquireTokenPopup(applicationConfig.graphScopes).then(function (accessToken) {
                updateUI();
            }, function (error) {
                console.log(error);
            });
        })
    }, function (error) {
        console.log(error);
    });
}

function updateUI() {
    var authButton = document.getElementById('login');
    authButton.innerHTML = 'logout';
    var label = document.getElementById('label');
    label.innerText = "Hello " + userAgentApplication.getUser().name + "! Please send an email with Microsoft Graph";

    // Show the email address part
    var sendEmailSpan = document.getElementById('sendEmail');
    $("#email").click(sendEmail);
    sendEmailSpan.className = "visible";
    var emailAddress = document.getElementById('emailToSendTo');
    emailAddress["value"] = userAgentApplication.getUser().displayableId;
}

function logout() {
    // Removes all sessions, need to call AAD endpoint to do full logout
    userAgentApplication.logout();
}

function sendEmail() {
    userAgentApplication.acquireTokenSilent(applicationConfig.graphScopes)
        .then(function (token) {
            $.ajax({
                type: "POST",
                contentType: "application/json",
                dataType: 'json',
                beforeSend: function (request) {
                    request.setRequestHeader('Authorization', 'bearer ' + token);
                },
                url: applicationConfig.graphEndpoint,
                data: JSON.stringify({ 'message': getEmail(), 'saveToSentItems': true }),
                processData: false,
                success: function (msg) {
                    log('Mail sucessfully sent.');
                },
                statusCode: {
                    200: function () {
                        log('Mail sucessfully sent.');
                    },
                    202: function () {
                        log('Mail sucessfully sent.');
                    }

                }
            });
        });
}

function getEmail() {
    var email = {
        Subject: 'Welcome to Microsoft Graph development with Msal and the Microsoft Graph sample',
        Body: {
            ContentType: 'HTML',
            Content: getEmailContent()
        },
        ToRecipients: [
            {
                EmailAddress: {
                    Address: userAgentApplication.getUser().displayableId
                }
            }
        ]
    };
    return email;
}

// Get the HTMl for the email to send.
function getEmailContent() {
    return "<html><head> <meta http-equiv=\'Content-Type\' content=\'text/html; charset=us-ascii\'> <title></title> </head><body style=\'font-family:calibri\'> <p>Congratulations " + userAgentApplication.getUser().name + ",</p> <p>This is a message from the Microsoft Graph Connect sample. You are well on your way to incorporating Microsoft Graph endpoints in your apps. </p> <h3>What&#8217;s next?</h3><ul><li>Check out <a href='https://graph.microsoft.io' target='_blank'>graph.microsoft.io</a> to start building Microsoft Graph apps today with all the latest tools, templates, and guidance to get started quickly.</li><li>Use the <a href='https://graph.microsoft.io/graph-explorer' target='_blank'>Graph explorer</a> to explore the rest of the APIs and start your testing.</li><li>Browse other <a href='https://github.com/microsoftgraph/' target='_blank'>samples on GitHub</a> to see more of the APIs in action.</li></ul> <h3>Give us feedback</h3> <ul><li>If you have any trouble running this sample, please <a href='https://github.com/microsoftgraph/angular-connect-rest-sample/issues' target='_blank'>log an issue</a>.</li><li>For general questions about the Microsoft Graph API, post to <a href='https://stackoverflow.com/questions/tagged/microsoftgraph?sort=newest' target='blank'>Stack Overflow</a>. Make sure that your questions or comments are tagged with [microsoftgraph].</li></ul><p>Thanks and happy coding!<br>Your Microsoft Graph samples development team</p> <div style=\'text-align:center; font-family:calibri\'> <table style=\'width:100%; font-family:calibri\'> <tbody> <tr> <td><a href=\'https://github.com/microsoftgraph/angular-connect-rest-sample\'>See on GitHub</a> </td> <td><a href=\'https://officespdev.uservoice.com/\'>Suggest on UserVoice</a> </td> <td><a href=\'https://twitter.com/share?text=I%20just%20started%20developing%20%23Angular%20apps%20using%20the%20%23MicrosoftGraph%20Connect%20sample!%20&url=https://github.com/microsoftgraph/angular-connect-rest-sample\'>Share on Twitter</a> </td> </tr> </tbody> </table> </div>  </body> </html>";
};
