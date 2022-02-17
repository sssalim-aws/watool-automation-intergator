
const TAEventHelper = require('/opt/TAEventHelper.js');
const WAWorkloadHelper = require('/opt/WAWorkloadHelper.js');

let response;

let eventsource;
let workloadArn;
let checkId;
let res_region;
let result
let ta_check_category;
let recommend
let delimiter = " | "
let rank = "#"
let newnotes

function isCharacterALetter(char) {
  return (/[a-zA-Z]/).test(char)
}

function isEmpty(object) {  
  return Object.keys(object).length === 0
}


exports.lambdaHandler = async (event, context) => {
    try {
        

        //Event Source Locator
        eventsource = event.source;
        switch (eventsource) {
          case 'aws.trustedadvisor':
            console.log('Processing Event from aws.trustedadvisor');
            
            const checkname = event.detail['check-name']
            switch (checkname) {
              case 'Low Utilization Amazon EC2 Instances':
                
                    console.log('Processing Event from Low Utilization Amazon EC2 Instances Checks');
                    workloadArn = await TAEventHelper.getResourceWAWorkloadTag(event);
                    checkId = await TAEventHelper.getCheckId(event);
                    let questionmap = await WAWorkloadHelper.getWAQuestionMap(checkId,eventsource);
                    let resourceRegion =  await TAEventHelper.getResourceRegion(event);
                    let resourceIdStr =  await TAEventHelper.getResourceId(event);
                    let strResourceList = resourceIdStr.split("/");
                    let resourceId = strResourceList[1];
                    let resourceAccountId =  await TAEventHelper.getResourceAccountId(event);
                    recommend = await TAEventHelper.getComputeOptimizerEC2recommend(event.detail.resource_id)
                    let timestamp = new Date(event.time)
                    let resource_note = "[ TA ] [ Over Provisioned ] [ " + timestamp.toUTCString() + " ]\n" + resourceId + delimiter + recommend.current_size + delimiter + resourceAccountId + delimiter + resourceRegion
                    let recommendation_note = "Options: "
                    for(const i of recommend.recom_optons){
                        recommendation_note = recommendation_note + rank + i.rank + " " + i.size;
                    }
                    newnotes = resource_note + '\n' + recommendation_note
                    result = await WAWorkloadHelper.UpdateWAAnswer(questionmap,workloadArn,newnotes);
                    break;
              case 'AWS Well-Architected high risk issues for cost optimization':
                  
                    console.log('Processing Event from AWS Well-Architected high risk issues for cost optimization Checks');
                    let item_detail = JSON.parse(event.detail['check-item-detail'])
                    workloadArn = item_detail['Workload ARN']
                    
                    ta_check_category = 'cost_optimizing'
                    console.log('Gathering available checks for '+ ta_check_category );
                    let check_list = await TAEventHelper.getTAChecksCategory(ta_check_category);
                    
                    console.log('Gathering checks results ');
                    let check_resource_list = await TAEventHelper.getTACheckResult(check_list);
                    //result = check_resource_list
                    console.log('Querying question map');
                    
                    
                    for (const i of check_resource_list){
                        let questionmap = await WAWorkloadHelper.getWAQuestionMap(i.check_id,eventsource);
                        
                        if (questionmap.length > 0) {
                            
                            let x = i.resource_detail[0].slice(-1)
                            
                            if( isCharacterALetter(x) == true ){
                                res_region = i.resource_detail[0].slice(0, -1)
                            }else
                            {
                                res_region = i.resource_detail[0]}
                            
                            let tag_found = await TAEventHelper.checkWorkloadTag(i.resource_detail[1],res_region,workloadArn);
                            if(tag_found == true){
                                console.log('tag found for id: ' + i.resource_detail[1] +' in ' + res_region + ', writing notes');
                                let header_note = "[ TA ]" + " [ " + i.check_name + " ]\n"
                                let detail_note = i.resource_detail[1] + " | " + i.resource_detail[0] + " | " + i.resource_detail[3] 
                                newnotes = header_note + detail_note
                                
                                if( i.check_name === 'Low Utilization Amazon EC2 Instances'){
                                    let instanceArn =  'arn:aws:ec2:'+res_region+':'+event.account+':instance/'+ i.resource_detail[1]
                                    recommend = await TAEventHelper.getComputeOptimizerEC2recommend(instanceArn)
                                    if( !isEmpty(recommend) ){
                                        console.log("Writing compute optimizer recommendation")
                                        let recommendation_note = "Recommendation: "
                                        for(const i of recommend.recom_optons){
                                            recommendation_note = recommendation_note + rank + i.rank + " " + i.size;
                                        }
                                        newnotes = newnotes + '\n' + recommendation_note
                                    }   
                                }
                                
                                await WAWorkloadHelper.UpdateWAAnswer(questionmap,workloadArn,newnotes);                            
                            }
                        } 
                            
                    }
                    break;
              default:
                console.log('Event does not match any supported checks, Ignoring event');
            }    
            break;
          default:
            console.log('Event does not match any supported source , Ignoring event');
        }
        
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: "completed"
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
