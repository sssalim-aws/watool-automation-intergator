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

async function getComputeOptimizerEC2recommend(instanceArn){
    try{

        let strArnList = instanceArn.split(":");
        const resourceRegion = strArnList[3];
        let result = {}
        var params = {
          instanceArns: [
            instanceArn
          ]          
        };
        
        let recom_list = []
        var computeoptimizer  = new AWS.ComputeOptimizer({region: resourceRegion});
        try {
            var recom_result = await computeoptimizer.getEC2InstanceRecommendations(params).promise();
            var recom_options = recom_result.instanceRecommendations[0].recommendationOptions
            for ( const val of recom_options){
                recom_list.push({
                    'rank' : val.rank,
                    'size' : val.instanceType
                });
            }
            
            result = {
                'current_size' : recom_result.instanceRecommendations[0].currentInstanceType,
                'recom_optons' : recom_list
            }
            
            
    
            } catch (e) {
                return e
            }
        
        return result


    } catch(err){
        console.error(err);
        return err;
    }

}




async function getTAChecksCategory(ta_check_category){
    try{


        let params = {
          language: 'en' /* required */
        };
        let support  = new AWS.Support({region: 'us-east-1'});
        let result = await support.describeTrustedAdvisorChecks(params).promise();
        let checklist = [] 
        for(const item of result.checks){
          if ( item.category == ta_check_category){
            checklist.push(
                {
                 'id' : item.id,
                 'name': item.name
                }
                );
          }
        };
        return checklist

    } catch(err){
        console.error(err);
        return err;
    }

}

async function getTACheckResult(check_list){
    try{
        
        let support  = new AWS.Support({region: 'us-east-1'});
        let result = []
        let chk_res
        let res = []
        
        for(const item of check_list){
            let params = {
              checkId : item.id 
            };
    
            chk_res = await support.describeTrustedAdvisorCheckResult(params).promise();
            
            for (const x of chk_res.result.flaggedResources){
                if(x.status == 'error' || x.status == 'warning'){
                result.push(
                    {
                     'check_id': chk_res.result.checkId,
                     'check_name': item.name,
                     'resource_detail' : x.metadata,
                     'resource_status' : x.status
                    });                       
            }
            //result.push(chk_res)                
             
            }

        }

        return result

    } catch(err){
        console.error(err);
        return err;
    }

}


async function checkWorkloadTag(id,region,workloadArn){
    try{
        let resourcegroupstaggingapi   = new AWS.ResourceGroupsTaggingAPI({region: region});

        let params = {
          TagFilters: [
            {
              Key: 'wa-workload-arn',
              Values: [
                workloadArn,
              ]
            }
          ],

        };
        let id_found = false
        let resource_tag_list = await resourcegroupstaggingapi.getResources(params).promise();
        for (const item of resource_tag_list.ResourceTagMappingList){
            let res_arn_split = item.ResourceARN.split(':');
            let res_arn_split_last_elem = res_arn_split[res_arn_split.length - 1];
            res_arn_split = res_arn_split_last_elem.split('/')
            let res_id = ""
            if(res_arn_split.length >= 2){
                res_id = res_arn_split[1];
            }
            else{
                res_id = res_arn_split[0]
            }
            
            if (res_id == id){
                id_found = true
            }
            
        }
                
        let result = id_found
        return result

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

module.exports.getComputeOptimizerEC2recommend = getComputeOptimizerEC2recommend;

module.exports.getTAChecksCategory = getTAChecksCategory;

module.exports.getTACheckResult = getTACheckResult;

module.exports.checkWorkloadTag = checkWorkloadTag;