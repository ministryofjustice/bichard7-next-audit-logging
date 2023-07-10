import type { AuditLogApiClient } from "src/shared"
import { logger } from "src/shared"
import { isError } from "src/shared/types"
import ArchivalEventsApiClient from "./api"
import type { BichardRecord, DatabaseClient } from "./db"

export default class AddArchivalEvents {
  private api: ArchivalEventsApiClient

  constructor(
    apiClient: AuditLogApiClient,
    private db: DatabaseClient
  ) {
    this.api = new ArchivalEventsApiClient(apiClient)
  }

  public addBichardRecordToAuditLog = async (errorRecord: BichardRecord): Promise<boolean> => {
    const { exists, err } = await this.api.isRecordInAuditLog(errorRecord)
    if (err) {
      return false
    }

    if (!exists) {
      const createRecordErr = await this.api.createArchivalEventInAuditLog(errorRecord)
      if (createRecordErr) {
        return false
      }
    }

    return true
  }

  // Record the archival of an entire group in the audit log and database
  // Returns whether all records in the group were updated successfully
  public addBichardRecordGroupToAuditLog = async (records: BichardRecord[], groupId: number): Promise<boolean> => {
    const successfulIds: number[] = []
    const failedIds: number[] = []
    for (const record of records) {
      const ok = await this.addBichardRecordToAuditLog(record)
      if (ok) {
        successfulIds.push(record.recordId)
      } else {
        failedIds.push(record.recordId)
      }
    }

    await this.db.markBichardRecordsAuditLogged(successfulIds)
    await this.db.markBichardRecordsAuditLogFailed(failedIds)

    const allSucceeded = failedIds.length < 1
    if (allSucceeded) {
      const result = await this.db.markBichardRecordGroupAuditLogged(groupId)
      if (isError(result)) {
        logger.error({ message: "Failed database update: successfully audit logged archive group", groupId: groupId })
      }
    }
    return allSucceeded
  }

  public addBichardRecordsToAuditLog = async (): Promise<void> => {
    const recordGroups = await this.db.fetchUnloggedBichardRecords()
    if (isError(recordGroups)) {
      throw recordGroups
    }

    for (const [groupId, recordGroup] of Object.entries(recordGroups)) {
      await this.addBichardRecordGroupToAuditLog(recordGroup as BichardRecord[], Number(groupId))
    }
  }
}
