import { logger } from "shared"
import type { ApiClient } from "shared-types"
import { isError } from "shared-types"
import { createArchivalEventInAuditLog, isRecordInAuditLog as isBichardRecordInAuditLog } from "./api"
import type DatabaseClient from "./db"
import type { BichardRecord } from "./db"

const addBichardRecordToAuditLog = async (api: ApiClient, errorRecord: BichardRecord): Promise<boolean> => {
  const { exists, err } = await isBichardRecordInAuditLog(api, errorRecord)
  if (err) {
    return false
  }

  if (!exists) {
    const createRecordErr = await createArchivalEventInAuditLog(api, errorRecord)
    if (createRecordErr) {
      return false
    }
  }

  return true
}

// Record the archival of an entire group in the audit log and database
// Returns whether all records in the group were updated successfully
const addBichardRecordGroupToAuditLog = async (
  db: DatabaseClient,
  api: ApiClient,
  records: BichardRecord[],
  groupId: number
): Promise<boolean> => {
  const successfulIds: number[] = []
  const failedIds: number[] = []
  for (const record of records) {
    const ok = await addBichardRecordToAuditLog(api, record)
    if (ok) {
      successfulIds.push(record.recordId)
    } else {
      failedIds.push(record.recordId)
    }
  }

  db.markBichardRecordsAuditLogged(successfulIds)
  db.markBichardRecordsAuditLogFailed(failedIds)

  const allSucceeded = failedIds.length < 1
  if (allSucceeded) {
    const err = await db.markBichardRecordGroupAuditLogged(groupId)
    if (err) {
      logger.error({ message: "Failed database update: successfully audit logged archive group", groupId: groupId })
    }
  }
  return allSucceeded
}

export const addBichardRecordsToAuditLog = async (db: DatabaseClient, api: ApiClient): Promise<void> => {
  const recordGroups = await db.fetchUnloggedBichardRecords()
  if (isError(recordGroups)) {
    throw recordGroups
  }

  for (const [groupId, recordGroup] of Object.entries(recordGroups)) {
    const err = await addBichardRecordGroupToAuditLog(db, api, recordGroup, Number(groupId))
    if (err) {
      continue
    }
  }
}
