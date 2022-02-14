
const TAEventHelper = require('/opt/TAEventHelper.js');
const WAWorkloadHelper = require('/opt/WAWorkloadHelper.js');
let response;
// let resourceArn;
// let resourceType;
// let resourceRegion;
// let resourceAccountId;
let eventsource;
let workloadArn;
let workloadDetail;
let checkId;
let questionmap;
exports.lambdaHandler = async (event, context) => {
    try {
        
        
        //Event Source Locator
        eventsource = event.source;
        console.log(eventsource);
        if (eventsource == 'aws.trustedadvisor'){
            //Get Check Name from Trusted Advisor Event
            workloadArn = await TAEventHelper.getResourceWAWorkloadTag(event);
            checkId = await TAEventHelper.getCheckId(event);
            workloadDetail = await WAWorkloadHelper.getWAWorkloadDetail(workloadArn);
            questionmap = await WAWorkloadHelper.getWAQuestionMap(checkId,eventsource);
            
            //console.log(workloadTag);
            //Get Resource Tag and Locate Well-Architected Workload Tag
            //findworkload
            //findmap

            
            //const AWS = require('aws-sdk');    
            //var params = {
            //  InstanceIds: [ 'i-0d3219267cda28f83' ]
            // };
            
            //var ec2 = new AWS.EC2({region: 'us-east-1'});
            //return ec2.describeInstances(params).promise();
            // var x = await ec2.describeInstances(params, function(err, data) {
            //   if (err) console.log(err, err.stack); // an error occurred
            //   else {
            //     console.log("Test");
            //     return data;           // successful response
            //   }
            //  });

            
        }
        
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: questionmap
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
