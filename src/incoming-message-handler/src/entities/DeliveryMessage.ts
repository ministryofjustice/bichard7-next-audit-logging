type DeliveryMessage = {
  RouteData: {
    RequestFromSystem: {
      CorrelationID: string
      SystemID: string
    }
    DataStream: {
      System: string
      DataStreamContent: {
        ResultedCaseMessage: {
          Session: {
            Case: {
              PTIURN: string
            }
          }
        }
      }
    }
  }
}

export default DeliveryMessage
