// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
let options = {};
const uuid = require('uuid');
const AWS = require('aws-sdk');

if (process.env.AWS_SAM_LOCAL) {
    options.endpoint = new AWS.Endpoint(process.env.ENDPOINT_OVERRIDE);
}
const ddbDocClient = new AWS.DynamoDB.DocumentClient(options);

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    const tableName = process.env.BOOKS_DDB_TABLE;
    console.log('Received event: ', event);

    try {
        if (event && event.httpMethod == "POST" && event.body) {
            const requestBody = JSON.parse(event.body);
            // TODO - add validation const result = validateBook(requestBody);
            const result = {valid: true};
            if ( !result.valid ) {
                return errorResponse(400, result.message, context.awsRequestId);
            }
            let bookItem = await createBook(requestBody, tableName, context.awsRequestId);
            return successResponse(200, bookItem);
        }
    } catch (err) {
        console.log(err);
        return errorResponse(500, err.message, context.awsRequestId);
    }

    return response
};

async function createBook(book, tableName, awsRequestId) {
    const timestamp = new Date().getTime();
    const item = {
        id: uuid.v1(),
        ...book,
        createdAt: timestamp,
        updatedAt: timestamp
    };

    try {
        console.log(`Writing to DB: ${book.title}`);
        // No return values
        // https://stackoverflow.com/questions/55166921/dynamodb-put-promise-not-returning-the-put-object
        const putResponse = await ddbDocClient.put({
            TableName: tableName,
            Item: item
        }).promise();
      } catch (err) {
            return errorResponse(500, err.message, awsRequestId);
      }

      // To return the book details in response we need to get it from the DB
      try {
        const getResponse = await ddbDocClient.get({
            TableName: tableName,
            Key: { id: item.id }
        }).promise();
        return getResponse;
      } catch (err) {
            return errorResponse(500, err.message, awsRequestId);
      }

}


function errorResponse(statusCode, errorMessage, awsRequestId) {
    return {
      statusCode: statusCode,
      body: JSON.stringify({
        Error: errorMessage,
        Reference: awsRequestId,
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    };
}

function successResponse(statusCode, body) {
    return {
      statusCode: statusCode,
      body: JSON.stringify({
        ...body
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    };
}