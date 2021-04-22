var Logger = module.exports = {
    count: 1,
    log: function (message, printCount) {
        if (typeof (message) === 'object' || printCount === false)
            console.log(message);
        else
            console.log(Logger.count++ + " : " + message);
    }
}