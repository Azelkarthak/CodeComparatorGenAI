uses gw.transaction.Transaction

class GWTest {
  function updateVehicleDetails(){
    var policy = Policy.finder.findPolicyByPolicyNumber("8069909144")
    Transaction.runWithNewBundle(\bundle -> {
      policy=bundle.add(policy)
      policy.LatestPeriod.PersonalAutoLine.Vehicles.each(\elt -> {
        elt.Model = "Hyundai"
        elt.Year = 1970
      })
    })
  }
}
