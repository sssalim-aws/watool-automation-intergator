const AWS = require('aws-sdk');

async function getWorkloadId(workloadArn){
    try{
        let strArnList = workloadArn.split(":");
        let workloadStrList = strArnList[5].split("/");
        const workloadId = workloadStrList[1];
        return workloadId;

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getWorkloadRegion(workloadArn){
    try{
        let strArnList = workloadArn.split(":");
        const workloadRegion = strArnList[3];
        return workloadRegion;

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getWAWorkloadDetail(workloadArn){
    try{
        let workloadId = await getWorkloadId(workloadArn);
        let workloadRegion = await getWorkloadRegion(workloadArn);
        var params = {
            WorkloadId: workloadId
        };
        var wellarchitected = new AWS.WellArchitected({region: workloadRegion});
        try {
            var result = await wellarchitected.getWorkload(params).promise();
        } catch (e) {
            return "NOT FOUND"
        }
        return result
    } catch(err){
        console.error(err);
        return err;
    }

}

async function getWAQuestionMap(checkid,checksource){
    try{

        
        var params = {
          Key: {
           "CheckId": {
             S: checkid
            }, 
           "CheckSource": {
             S: checksource
            }
          }, 
          TableName: "watool-auto-QuestionMapTable-1VYAKJJVGLT4J"
         };
         
        var dynamodb = new AWS.DynamoDB();
        var result = await dynamodb.getItem(params).promise();
        return result;

        
        
        
        } catch(err){
            console.error(err);
            return err;
        }

}






module.exports.getWorkloadId = getWorkloadId;
module.exports.getWorkloadRegion = getWorkloadRegion;
module.exports.getWAQuestionMap = getWAQuestionMap;
module.exports.getWAWorkloadDetail = getWAWorkloadDetail;