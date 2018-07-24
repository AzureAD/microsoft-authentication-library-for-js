var keyvault = require('./keyVault');

keyvault.getSecret('password', function(result){
    console.log(result);
});


