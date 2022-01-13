module.exports = {
  messages: [
    {
      messageId: "4fab2197-a9d2-4631-9af0-690da7e75c66",
      externalCorrelationId: "Message1",
      receivedDate: "2021-11-14T05:10:00.000Z",
      messageXml: "XML-1",
      caseId: "1000",
      status: "Processing",
      events: []
    },
    {
      messageId: "bda5a20f-e096-4373-8cde-04ac3155f145",
      externalCorrelationId: "Message2",
      receivedDate: "2021-11-14T00:00:00.000Z",
      messageXml: "XML-1",
      caseId: "2000",
      status: "Processing",
      lastEventType: "Message Sent to Bichard",
      events: [
        {
          category: "information",
          eventType: "Message Sent to Bichard",
          eventSource: "Audit logging",
          timestamp: "2021-11-14T00:05:00.000Z",
          attributes: {}
        }
      ]
    },
    {
      messageId: "65c3702b-7884-473b-9201-c83f299543c4",
      externalCorrelationId: "Message3",
      receivedDate: "2021-11-13T23:00:00.000Z",
      messageXml: "XML-2",
      caseId: "3000",
      status: "Error",
      lastEventType: "PNC Response not received",
      events: [
        {
          category: "information",
          eventType: "Message Sent to Bichard",
          eventSource: "Audit logging",
          timestamp: "2021-11-13T00:05:00.000Z",
          attributes: {}
        },
        {
          category: "error",
          eventType: "PNC Response not received",
          eventSource: "Bichard",
          timestamp: "2021-11-13T00:10:00.000Z",
          attributes: {}
        }
      ]
    },
    {
      messageId: "b23687fdd-ca9e-49e7-a772-089d01ea0dae",
      externalCorrelationId: "Message4",
      receivedDate: "2021-11-13T20:30:00.000Z",
      messageXml: "XML-3",
      caseId: "4000",
      status: "Error",
      lastEventType: "PNC Response not received",
      events: [
        {
          category: "information",
          eventType: "Message Sent to Bichard",
          eventSource: "Audit logging",
          timestamp: "2021-11-13T20:35:00.000Z",
          attributes: {}
        },
        {
          category: "error",
          eventType: "PNC Response not received",
          eventSource: "Bichard",
          timestamp: "2021-11-13T20:40:00.000Z",
          attributes: {}
        }
      ]
    },
    {
      messageId: "52057ad3-e164-410b-bfae-03f9885f31c0",
      externalCorrelationId: "Message5",
      receivedDate: "2021-11-13T18:15:00.000Z",
      messageXml: "XML-4",
      caseId: "5000",
      status: "Completed",
      lastEventType: "PNC Response received",
      events: [
        {
          category: "information",
          eventType: "Message Sent to Bichard",
          eventSource: "Audit logging",
          timestamp: "2021-11-13T18:35:00.000Z",
          attributes: {}
        },
        {
          category: "information",
          eventType: "PNC Response received",
          eventSource: "Bichard",
          timestamp: "2021-11-13T18:40:00.000Z",
          attributes: {}
        }
      ]
    },
    {
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40",
      externalCorrelationId: "Message6",
      receivedDate: "2021-11-13T17:12:00.000Z",
      messageXml: "XML-5",
      caseId: "6000",
      status: "Completed",
      lastEventType: "PNC Response received",
      events: [
        {
          category: "information",
          eventType: "Message Sent to Bichard",
          eventSource: "Audit logging",
          timestamp: "2021-11-13T17:14:00.000Z",
          attributes: {}
        },
        {
          category: "information",
          eventType: "PNC Response received",
          eventSource: "Bichard",
          timestamp: "2021-11-13T17:16:00.000Z",
          attributes: {}
        }
      ]
    },
    {
      messageId: "670a16de-a7a5-4d08-99cc-8f012236e003",
      externalCorrelationId: "Message7",
      receivedDate: "2021-11-13T15:47:00.000Z",
      messageXml: "XML-6",
      caseId: "7000",
      status: "Completed",
      lastEventType: "PNC Response received",
      events: [
        {
          category: "information",
          eventType: "Message Sent to Bichard",
          eventSource: "Audit logging",
          timestamp: "2021-11-13T15:49:00.000Z",
          attributes: {}
        },
        {
          category: "information",
          eventType: "PNC Response received",
          eventSource: "Bichard",
          timestamp: "2021-11-13T15:55:00.000Z",
          attributes: {}
        }
      ]
    }
  ]
}
