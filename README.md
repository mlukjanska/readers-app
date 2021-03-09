# AWS SAM sample application in Node.js with API gateway and DynamoDB 

This is a simple API backend application created from the [SAM Hello World](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started-hello-world.html) template. The application manages reader's books through create, get and delete API endpoints. The book records are stored in DynamoDB table.

It contains the source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders:

- src - Code for the application's Lambda function.
- src/tests/events - Invocation events that you can use to invoke the function.
- src/tests - Unit tests for the application code. 
- template.yaml - A template that defines the application's AWS resources.

The application uses several AWS resources: 
- Lambda functions 
- API Gateway API
- DynamoDB. 

These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates the application code.

## Prerequisites

* AWS profile - [Setup AWS profile to be able to deploy the app](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 12](https://nodejs.org/en/), including the NPM package management tool. Note: In case you need various versions of Node for development purposes, you might want to install it using `nvm`, that allows switching between Node versions.
  * for [Linux based](https://github.com/creationix/nvm) 
  * for [Windows](https://github.com/coreybutler/nvm-windows)
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
* IDE Plugin (Optional) - If you prefer to use an integrated development environment (IDE) to build and test your application, you can use the AWS Toolkit.  
The AWS Toolkit is an open source plug-in for popular IDEs that uses the SAM CLI to build and deploy serverless applications on AWS. The AWS Toolkit also adds a simplified step-through debugging experience for Lambda function code. See the following links to get started.
  * [PyCharm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
  * [IntelliJ](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
  * [VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
  * [Visual Studio](https://docs.aws.amazon.com/toolkit-for-visual-studio/latest/user-guide/welcome.html)

If all is setup as expected, you should be able to run the following commands:

```bash
node -v # Check Node.js version
aws sts get-caller-identity # Check if the AWS profile is valid and setup correctly, returns the profile
sam --version # Checks if the AWS SAM CLI is installed, outputs it's version
```

Note: If you are using `nvm`, you can run the following commands to install and switch between Node versions.

```bash
nvm install 12 # Installs Node.js version 12
nvm use 12 # Switches to use Node.js version 12
```

## Build and Deploy

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modified IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

You can find your API Gateway Endpoint URL in the output values displayed after deployment.

## Add resources
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

### Add API resource

The API paths, methods and associated functions are defined in the `template.yaml` file in the `Resources` and `Outputs` sections. 
`Events` section specifies the events that trigger this function, they consist of a type and a set of properties that depend on the type, see more in [SAM Event Type Api](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-api.html). 

Notice the {id} (variable with a curly braces) in the Path. It will extract the part after /books/ into event.pathParameters.id which is usable later in the lambda handler code.

```yaml
Resources:
...
  BooksFunction: # Name of the function that will handle the API events (requests)
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: app.lambdaHandler
      Runtime: nodejs12.x
      Events:
        GetBook:
          Type: Api
          Properties:
            Path: /books/{id}
            Method: get
...
Outputs:
  # ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
  # Find out more about other implicit resources you can reference within SAM
  # https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  BooksApi:
    Description: "API Gateway endpoint URL for Prod stage for Books function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/books/"
  BooksFunction:
    Description: "Books Lambda Function ARN"
    Value: !GetAtt BooksFunction.Arn
  BooksFunctionIamRole:
    Description: "Implicit IAM Role created for Books function"
    Value: !GetAtt BooksFunctionRole.Arn
```

### Add DynamoDB resource

In order to add a DynamoDB table one needs to add the following in the `template.yaml` file in the `Globals`, `Resources` and `Outputs` sections. For the related lambda functions to be able to write into the DynamoDB table one needs to add relative policy in the function `Properties` section. To be able to reference the table in the code, one needs to add it to the environment variables.
More about the DynamoDB configuration in SAM template [here](https://dynobase.dev/dynamodb-aws-sam/).

```yaml
Globals:
  Function:
    Variables:
      BOOKS_DDB_TABLE: !Ref BooksDdbTable # To reference in lambda function code
...
Resources: 
  BooksDdbTable: # Name of the table to reference in the template.yaml file
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: books_table
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
  ...
  BooksFunction:
    Properties:
      Policies: # Give Permissions to the function to write into this table
        - DynamoDBCrudPolicy:
            TableName: !Ref BooksDdbTable
...
Outputs:
  BooksDdbTable:
      Description: "Books DynamoDB ARN"
      Value: !GetAtt BooksDdbTable.Arn
...
```

## Build and test locally

### Validate SAM template
Run this command to validate the template before running the build command.

```bash
readers-app$ sam validate
```

### Build
Build your application with the `sam build` command.

```bash
readers-app$ sam build
```

The SAM CLI installs dependencies defined in `src/package.json`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

### Configure and run DynamoDB locally

Instead of using the DynamoDB web service one can download the DynamoDB docker image and point the application to it in order to debug the application during development. 
- This [guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) walks you through on how to setup the downloadable version. 
- This [Java application example](https://github.com/aws-samples/aws-sam-java-rest) shows how to configure and run the local DynamoDB for the application.

1. Start DynamoDB

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

2. Create the DynamoDB table.

Note: Use the same name as specified for the table in `template.yaml`.

```bash
aws dynamodb create-table --table-name books_table --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000
```

3. Set up environment variables to point to the local DynamoDB table

* Depending on the OS the DynamoDB endpoint will differ, this is an example for Mac OS environment variables. Other examples are available in `src/tests/resources`. This file will be used as a parameter when running the application locally.

```json
{
    "BooksFunction": {
        "ENDPOINT_OVERRIDE": "http://docker.for.mac.localhost:8000",
        "BOOKS_DDB_TABLE": "books_table"
    }
}
```

* Add the endpoint override in the `template.yaml` section `Global` `Variables`, so that it is accessible in the code:

```yaml
Globals:
  Function:
    ...
    Environment: 
      Variables:
        ENDPOINT_OVERRIDE: ""
```

* Override the DynamoDB enpoint when invoking the app locally by adding the folling code in your lambda handler:
```javascript
if (process.env.AWS_SAM_LOCAL) {
    options.endpoint = new AWS.Endpoint(process.env.ENDPOINT_OVERRIDE);
}
``` 

Other useful commands:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 # List tables in the local DynamoDB
aws dynamodb scan --table-name books_table --endpoint-url http://localhost:8000 # Scan the table to list all the records
aws dynamodb delete-item --table-name stores_table --key "{\"id\": {\"S\": \"<uuid>\"}}" --endpoint-url http://localhost:8000 # Delete an item from the table by id
```


### Invoke a function locally

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command and passing the environment configuration file for DynamoDB local endpoint (choose the correct file depending on your OS).

```bash
readers-app$ sam local invoke BooksFunction --event src/tests/events/event.json --env-vars src/tests/resources/test_env_mac.json
```

### Invoke an API locally
The SAM CLI can also emulate your application's API. Use the `sam local start-api` to run the API locally on port 3000 and passing the environment configuration file for DynamoDB local endpoint (choose the correct file depending on your OS).

```bash
readers-app$ sam local start-api --env-vars src/tests/resources/test_env_mac.json
readers-app$ curl http://localhost:3000/
```

The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the route and method for each path.

```yaml
      Events:
        Books:
          Type: Api
          Properties:
            Path: /books/{id}
            Method: get
```

## Fetch, tail, and filter Lambda function logs

To simplify troubleshooting, SAM CLI has a command called `sam logs`. `sam logs` lets you fetch logs generated by your deployed Lambda function from the command line. In addition to printing the logs on the terminal, this command has several nifty features to help you quickly find the bug.

`NOTE`: This command works for all AWS Lambda functions; not just the ones you deploy using SAM.

```bash
readers-app$ sam logs -n BooksFunction --stack-name readers-app --tail
```

You can find more information and examples about filtering Lambda function logs in the [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## Tests

Tests are defined in the `src/tests` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run tests.

```bash
readers-app$ cd src
src$ npm install
# Unit test
src$ npm run test
# Integration test, requiring deploying the stack first.
# Create the env variable AWS_SAM_STACK_NAME with the name of the stack we are testing
src$ AWS_SAM_STACK_NAME=<stack-name> npm run integ-test
```

## Cleanup

To delete the application, use the AWS CLI. Assuming that the project name corresponds to the stack name, run the following:

```bash
aws cloudformation delete-stack --stack-name readers-app
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
