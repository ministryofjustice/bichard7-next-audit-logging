type DeliveryMessage = {
  RouteData: {
    RequestFromSystem: {
      CorrelationID: string
      SystemID: string
    }
    DataStream: {
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
