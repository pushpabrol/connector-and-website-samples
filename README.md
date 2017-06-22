Connector webtask & website Code samples

## Create the url in webtask

### Basic steps are listed below
 
- Ensure wt cli is installed
- Open a terminal window
- Create a certificate key pair

- create 2 variables that hold the public key and private key contents
    PRIVATE_KEY=$(cat /.../privatekey.key)
    PUBLIC_KEY=$(cat /.../publickey.pem)

- Create a webtask with the following command

      wt create connect.js --name connect -s tenant=<tenant_name> -s connection=connect-zendesk -s publicKey=$PUBLIC_KEY -s privateKey=$PRIVATE_KEY -s decryptionKey=<symmetric_key> --profile <tenant_name>-default

      connect.js - is the code for the webtask 
      tenant_name = your tenant name in auth0
      connection = the connection for the thirdParty created in Auth0
      decryptionKey is the key used for decryting the data sent in the url. The data format and encryption is explained below.

      This is will create a webtask with URL of the format 

      https://<tenant>.us.webtask.io/connect



#### Encryption format is explained below:

      - create a string with the following format

         id=<unique_id>&fname=first_name&lname=last_name&email=email&date=<datetime when link was clicked>
      - create a sha256 hash of the data above
      - append the hash to the string too
       hash=<hash>&id=<unique_id>&fname=first_name&lname=last_name&email=email&date=<datetime when link was clicked>

      - Encrypt the data above

      A sample of code showing the encryption is included in the file encrypt-sample.js

  ## Create a SAML connection in Auth0 with the name connect-zendesk

      - Set the SAML Login url = https://<tenant>.us.webtask.io/connect
      - Set the SAML public key/signing certificate = the public key of the certificate created above under step 1
      - Set the logout URL as same as the Login Url
      - Save the connection in Auth0
      - Go to the IDP Initiated SSO tab under the connection and select the Service Provider Client Application setup within Auth0 as the default client and set the Response Protocol = SAML 

  ## Act On Website code - website

      - This is a simple express app that has been setup to show some of the setup within Auth0 would work.
      - Set this website up for test on a well known domain

























