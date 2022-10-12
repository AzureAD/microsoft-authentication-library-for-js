# Hosting localhost on HTTPs 
1. To host a sample/application on localhost over HTTPS, we need to create a self-signed certificate and key. 

    a. Run the following command the directory of the application in **terminal** if you have openssl: 

    `openssl.exe req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 7 -nodes -subj /CN=localhost`

    b. Alternatively, if there are issues with openssl, use Git Bash which has openssl included and run the following command: 

    `openssl.exe req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 7 -nodes -subj //CN=localhost` 


2. Once the command runs successfully, two files get generated: **key.pem and cert.pem** in the root directory of the sample/application. 

3. Next, you need to update the server.js file to use https and the above generated certificate as follows: 

    a. For hosting a single application: 

            const argv = require('yargs')
            .usage('Usage: $0 -p1 [PORT] -p2 [PORT] -https')
            .alias('p1', 'port1')
            .alias('h', 'https')
            .describe('port1', '(Optional) App Port Number - default is 30662')
            .describe('https', '(Optional) Serve over https')
            .strict()
            .argv;

            // Start the server. 
            const https = require('https');` 
            const privateKey  = fs.readFileSync('./key.pem', 'utf8'); 
            const certificate = fs.readFileSync('./cert.pem', 'utf8'); 
            const credentials = {key: privateKey, cert: certificate}; 
            const httpsServer = https.createServer(credentials, app);
            httpsServer.listen(port1);

    b. For hosting multiple applications:
   
            const argv = require('yargs')
            .usage('Usage: $0 -p1 [PORT] -p2 [PORT] -https')
            .alias('p1', 'port1')
            .alias('p2', 'port2')
            .alias('h', 'https')
            .describe('port1', '(Optional) App1 Port Number - default is 30662')
            .describe('port2', '(Optional) App2 Port Number - default is 30663')
            .describe('https', '(Optional) Serve over https')
            .strict()
            .argv;


            `// Start the server.` 
            `const https = require('https');` 
            `const privateKey  = fs.readFileSync('./key.pem', 'utf8');` 
            `const certificate = fs.readFileSync('./cert.pem', 'utf8');`
            `const credentials = {key: privateKey, cert: certificate};` 
            `const app1_server = https.createServer(credentials, app1);` 
            `app1_server.listen(port1);`
            `const app2_server = https.createServer(credentials, app2);` 
            `app2_server.listen(port2);`

4. To run the sample: `npm run -- -s <sample name> -h`