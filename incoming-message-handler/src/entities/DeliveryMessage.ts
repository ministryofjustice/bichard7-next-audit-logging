type DeliveryMessage = {
  DeliverRequest: {
    MessageIdentifier: string
    Message: {
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

export default DeliveryMessage
