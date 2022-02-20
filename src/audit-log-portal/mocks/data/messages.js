module.exports = {
  messages: [
    {
      messageId: "4fab2197-a9d2-4631-9af0-690da7e75c66",
      externalCorrelationId: "Message1",
      receivedDate: "2021-11-14T05:10:00.000Z",
      caseId: "1000",
      status: "Processing",
      events: []
    },
    {
      messageId: "bda5a20f-e096-4373-8cde-04ac3155f145",
      externalCorrelationId: "Message2",
      receivedDate: "2021-11-14T00:00:00.000Z",
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
    },
    {
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-8",
      externalCorrelationId: "Message8",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-9",
      externalCorrelationId: "Message9",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e43-10",
      externalCorrelationId: "Message10",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-11",
      externalCorrelationId: "Message11",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-12",
      externalCorrelationId: "Message12",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-13",
      externalCorrelationId: "Message13",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-14",
      externalCorrelationId: "Message14",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-15",
      externalCorrelationId: "Message15",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-16",
      externalCorrelationId: "Message16",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-17",
      externalCorrelationId: "Message17",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-18",
      externalCorrelationId: "Message18",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-19",
      externalCorrelationId: "Message19",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-20",
      externalCorrelationId: "Message20",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-21",
      externalCorrelationId: "Message21",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-22",
      externalCorrelationId: "Message22",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-23",
      externalCorrelationId: "Message23",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-24",
      externalCorrelationId: "Message24",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-25",
      externalCorrelationId: "Message25",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-26",
      externalCorrelationId: "Message26",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-27",
      externalCorrelationId: "Message27",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-28",
      externalCorrelationId: "Message28",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-29",
      externalCorrelationId: "Message29",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
      messageId: "3079c4ff-d24a-45fc-92ec-852316940e40-30",
      externalCorrelationId: "Message30",
      receivedDate: "2021-11-13T17:12:00.000Z",
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
    }
  ]
}
