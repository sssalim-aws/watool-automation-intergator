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
          TableName: process.env.QuestionMapTable
         };
         
        var dynamodb = new AWS.DynamoDB();
        
        var result = await dynamodb.getItem(params).promise();
       
        if( 'Item' in result ){
            //console.log(JSON.stringify(result))
            if ('QuestionMap' in result.Item ){
                var qidlistraw = result.Item.QuestionMap;
                var qidlist = []; 
                for(const val of qidlistraw["L"]){
                    qidlist.push(val["S"]) 
                };
                return qidlist
            }
        }
        
        return []

        } catch(err){
            console.error(err);
            return err;
        }

}

async function UpdateWAAnswer(questionmap,workloadArn,newnotes){
    try{

        let workloadId = await getWorkloadId(workloadArn);        
        let workloadRegion = await getWorkloadRegion(workloadArn);
        let updatednotes = ""
        
        for(const val of questionmap){
            
            var params_origin = {
              LensAlias: 'wellarchitected', 
              QuestionId: val, 
              WorkloadId: workloadId 
            };
            
            var wellarchitected = new AWS.WellArchitected({region: workloadRegion});
            try {
                var origin = await wellarchitected.getAnswer(params_origin).promise();
                var notes = origin.Answer.Notes;
            } catch (e) {
                return "ERROR WHILE GATHERING ANSWER"
            }
            
            if (notes == undefined) {
                updatednotes = newnotes
            }else{
                
                var total = notes.length + newnotes.length
                if( total >= 2084){
                    var reducedcount = notes.match(/\S/g).length * 0.5
                    var reducednotes = notes.substring(0, notes.match(/\S/g).length - reducedcount );
                    var trimmednotes = reducednotes.concat('\n\n--trim--')
                    notes = trimmednotes
                }
                updatednotes = newnotes.concat('\n\n').concat(notes)
                
            }
            
            
            
            var params_updated = {
              LensAlias: 'wellarchitected', 
              QuestionId: val, 
              WorkloadId: workloadId, 
              Notes: updatednotes
            };
             
            try {
                var result = await wellarchitected.updateAnswer(params_updated).promise();
            } catch (e) {
                return e
            }
        }
        return result
        
        } catch(err){
            console.error(err);
            return err;
        }

}





module.exports.getWorkloadId = getWorkloadId;
module.exports.getWorkloadRegion = getWorkloadRegion;
module.exports.getWAQuestionMap = getWAQuestionMap;
 module.exports.UpdateWAAnswer = UpdateWAAnswer;
module.exports.getWAWorkloadDetail = getWAWorkloadDetail;