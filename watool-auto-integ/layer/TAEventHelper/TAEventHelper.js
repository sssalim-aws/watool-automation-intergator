const AWS = require('aws-sdk');

async function getResourceArn(event){
    try{
        const resourceARN = event.detail.resource_id 
        return resourceARN;

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getResourceType(event){
    try{
        const resourceArn = await getResourceArn(event);
        // let strArn = JSON.stringify(resourceArn);
        let strArnList = resourceArn.split(":");
        const resourceType = strArnList[2];
        return resourceType;

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getResourceRegion(event){
    try{
        const resourceArn = await getResourceArn(event);
        // let strArn = JSON.stringify(resourceArn);
        let strArnList = resourceArn.split(":");
        const resourceRegion = strArnList[3];
        return resourceRegion;

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getResourceAccountId(event){
    try{
        const resourceArn = await getResourceArn(event);
        // let strArn = JSON.stringify(resourceArn);
        let strArnList = resourceArn.split(":");
        const resourceAccountId = strArnList[4];
        return resourceAccountId;

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getResourceId(event){
    try{
        const resourceArn = await getResourceArn(event);
        // let strArn = JSON.stringify(resourceArn);
        let strArnList = resourceArn.split(":");
        const resourceId = strArnList[5];
        return resourceId;

    } catch(err){
        console.error(err);
        return err;
    }

}


async function getCheckId(event){
    try{


        var params = {
          language: 'en' /* required */
        };
            
        var support  = new AWS.Support({region: 'us-east-1'});
        var result = await support.describeTrustedAdvisorChecks(params).promise();
        

        for(const val of result['checks']){
          if ( val['name'] == event['detail']['check-name']){
            return val['id']   
          }
        };
        return "Check Id '"+ event['detail']['check-name'] +"' Not Found"
        


    } catch(err){
        console.error(err);
        return err;
    }

}

async function getResourceWAWorkloadTag(event){
    try{
        let resourceRegion = await getResourceRegion(event);
        let resourceIdStr = await getResourceId(event);
        let strResourceList = resourceIdStr.split("/");
        const resourceId = strResourceList[1];

        var params = {
            Filters: [
                 {
                    Name: "resource-id", 
                    Values: [ resourceId ]
                 },
                 {
                    Name: "key",
                    Values: ["wa-workload-arn"]
                 }
            ]
        };
                 
        var ec2 = new AWS.EC2({region: resourceRegion});
        var result = await ec2.describeTags(params).promise();
        
        if(result["Tags"].length == 0 ){
            return "wa-workload tag is NOT FOUND"
        }
        else{
            if (result["Tags"][0]["Value"] == "" ){
                return "wa-workload tag is NOT EMPTY"
            }else{
                return result["Tags"][0]["Value"]    
            }
        }
        


    } catch(err){
        console.error(err);
        return err;
    }

}

module.exports.getResourceArn = getResourceArn;
module.exports.getResourceType = getResourceType;
module.exports.getResourceRegion = getResourceRegion;
module.exports.getResourceAccountId = getResourceAccountId;
module.exports.getResourceId = getResourceId;
module.exports.getCheckId = getCheckId;
module.exports.getResourceWAWorkloadTag = getResourceWAWorkloadTag;