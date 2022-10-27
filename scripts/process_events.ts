const fs = require('fs');
try {
    const data = fs.readFileSync('scripts/processing_messages.json', 'utf8');
    const parseData = JSON.parse(data)
    const phase3 = parseData.Items.filter((event: any) => Boolean(event.events.L.filter((e: any) => e.M.eventSource.S === "Bichard phase 3").length > 0)).filter((e: any) => e.receivedDate.S < "2022-10-19T20:10:00")
    console.log(phase3.length)

    const pncUpdate = phase3.filter((event: any) => Boolean(event.events.L.filter((e: any) => e.M.eventType.S === "PNC Update applied successfully").length === 0))
    console.log("do not have pnc update successfully", pncUpdate.length)

    const hasTriggers = pncUpdate.filter(
      (event: any) => Boolean((event.events.L.filter((e: any) => e.M.eventType.S === "Triggers generated").length > 0)))
    console.log("hasTriggers", hasTriggers.length)

    const triggersNotResolved = pncUpdate.filter(
      (event: any) => !Boolean((event.events.L.filter((e: any) => e.M.eventType.S === "All triggers marked as resolved").length > 0)))
    console.log("triggersNotResolved", triggersNotResolved.length)

    const hasExceptions = pncUpdate.filter(
      (event: any) => Boolean((event.events.L.filter((e: any) => e.M.eventType.S === "Exceptions generated").length > 0))).filter(
      (event: any) => Boolean((event.events.L.filter((e: any) => e.M.eventType.S === "Triggers generated").length === 0)))
    console.log("hasExceptions but no triggers", hasExceptions.length)

    //const remaining = pncUpdate.filter(
     // (event: any) => Boolean((event.events.L.filter((e: any) => e.M.eventType.S === "All triggers marked as resolved").length > 0))).filter((event: any) => event.receivedDate.S < "2022-10-19T18:10:00")

      //console.log("remaining", remaining.length)

      console.log(pncUpdate)
  } catch (err) {
    console.error(err);
  }
