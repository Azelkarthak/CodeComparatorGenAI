package exavalu.pc.policy.v1

uses com.github.cliftonlabs.json_simple.JsonArray
uses exavalu.pc.AgentPortalIntegrationPolicyPeriodHelper
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.json.JsonConfigAccess
uses gw.api.json.mapping.TransformResult
uses gw.api.locale.DisplayKey
uses gw.api.system.PLLoggerCategory
uses org.slf4j.LoggerFactory
uses gw.webservice.pc.pc1000.gxmodel.policyperiodmodel.PolicyPeriod

class AgentPortalPolicyApiHandler {
  var _logger = LoggerFactory.getLogger(PLLoggerCategory.INTEGRATION, "AgentPortalPolicyApiHandler")

  var jsonArray = new JsonArray()// JsonArray to hold all TransformResults

  // Method to input API data, process the data to retrieve policy details based on Account no
  function retrievePolicyDetailsBasedOnAccOrPocNo(body : String) : JsonArray {

    _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.ExtractingPayloadData"))
    try {
      // Extracts data from payload and Data Preprocessing
      var payloadDetails : String
      var account = Account.finder.findAccountByAccountNumber(body)
      if (account == null) {
        var job = findJobByJobNumber(body)
        if(policy == null){
          var errorMessage = DisplayKey.get("AgentPortal.PolicyApiHandler.Error.InvalidAccountNumberOrPolicyNumber",body)
        _logger.error(errorMessage);
        throw new IllegalArgumentException(errorMessage)
        }
        //Retrieving policy details based on policy number
        _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.ExtractingPayloadData"))
        payloadDetails = getPolicyDetails(policy)
        jsonArray.add(payloadDetails)

      }
      else {
        //Retrieving policy details based on account number
        account.Policies.each(\policy -> {
          payloadDetails = getPolicyDetails(policy)
          jsonArray.add(payloadDetails)
        })
      }
      _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.PolicyDetails",body))
      return jsonArray
    } catch (e : Exception) {
      // Log the error
      _logger.error(DisplayKey.get("AgentPortal.PolicyApiHandler.Error.PolicyDetails",e))
      throw e // Rethrow the error to be handled by the caller
    }
  }

  // Method to input API data, process the data to retrieve policy details based on Policy no
  private function getPolicyDetails(policy : Policy) : String {
    var payloadDetails : String
    var policyPeriod = policy.LatestBoundPeriod
    if (policyPeriod.PolicyNumber != null) {
      //Retrieving policy details of bound status
      var details = exavalu.pc.AgentPortalIntegrationPolicyPeriodHelper.payloadOptimizer(policyPeriod)
      _logger.info(details.asUTFString())
      payloadDetails = details.asUTFString()
      // Remove newline characters
      payloadDetails = payloadDetails.replaceAll("\\n", "")
    }
    return payloadDetails
  }

  // Method to input API data, process the data to retrieve policy details based on Producer code
  function retrieveDetailsOnProducerCode(body : String) : ArrayList<Object> {
    var detailsList = new ArrayList()// Array to hold all TransformResults
    var producerObj = Query.make(ProducerCode).compare(ProducerCode#Code, Relop.Equals, body).select()
    if(producerObj.isEmpty()){
      throw(DisplayKey.get("AgentPortal.PolicyApiHandler.Error.InvalidProducerCode",body))
    }
    _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.ExtractingPayloadData"))
    try {
      // Extracting data from the payload and Data Preprocessing
      var policyList = Query.make(Policy).join(Policy#ProducerCodeOfService).compare(ProducerCode#Code, Relop.Equals, body).select()
      if (policyList.isEmpty())
      {
        throw (DisplayKey.get("AgentPortal.PolicyApiHandler.Error.ProducerCode",body))
      }
      policyList.each(\detail -> {
        var policy = detail.LatestBoundPeriod
        _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.ProducerCode", body))

        // Response object
        var mapper = JsonConfigAccess.getMapper("exavalu.pc.response.producerpolicydetails-1.0", "ProducerBasedPolicyDetails")
        // Validating the policy that it has the values and then transform the structured object
        if (policy != null) {
          var transformObj = mapper.transformObject(policy)
          detailsList.add(transformObj)
        }
        _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.TransformObject"))
      })
      _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.PolicyDetailsRetrievedBasedOnProducerCode",body))
      return detailsList
    } catch(e:Exception){
      // Log the error
      _logger.error(DisplayKey.get("AgentPortal.PolicyApiHandler.Error.PolicyDetails",e))
      throw e // Rethrow the error to be handled by the caller
    }
  }

  // Method to input API data, process the data to retrieve transaction details based on Policy number
  function retrieveTransactionsDetailsBasedOnPolicy(body : String) : ArrayList<Object> {
    var detailsList = new ArrayList()// Array to hold all TransformResults
    //Extracts data from payload and Data Preprocessing
    var policy = findPolicyByNumber(body)
    _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.ExtractingPayloadData"))
    try {
      // Loop through all transaction in the policy
      policy.Periods.each(\transaction -> {
        var mapper = JsonConfigAccess.getMapper("exavalu.pc.response.transactiondetails-1.0", "TransactionDetails");
        // Transform the current transaction object to a format suitable for the details list
        var transformObj = mapper.transformObject(transaction)
        detailsList.add(transformObj)
        _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.TransformObject"))
      })
      _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.PolicyDetailsRetrievedBasedOnPolicyNumber",body))
      return detailsList
    } catch (e : Exception) {
      // Log the error
      _logger.error(DisplayKey.get("AgentPortal.PolicyApiHandler.Error.PolicyDetails",e))
      throw e // Rethrow the error to be handled by the caller
    }
  }

  //Private Method to input API data, process the data to retrieve policy
  private function findPolicyByNumber(body : String) : Policy {
    _logger.info(DisplayKey.get("AgentPortal.PolicyApiHandler.Info.ExtractingPayloadData"))
    var policy = Policy.finder.findPolicyByPolicyNumber(body)
    if (policy == null) {
      var errorMessage = DisplayKey.get("AgentPortal.PolicyApiHandler.Error.InvalidAccountNumberOrPolicyNumber",body)
      _logger.error(errorMessage);
      throw new IllegalArgumentException(errorMessage);
    }
    return policy
  }
}