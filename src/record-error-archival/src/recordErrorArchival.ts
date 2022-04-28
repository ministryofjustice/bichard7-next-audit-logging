import { logger } from "shared"
import type { ApiClient } from "shared-types"
import { isError } from "shared-types"
import { createRecordInAuditLog, isRecordInAuditLog } from "./api"
import type DatabaseClient from "./DatabaseClient"
import type { ArchivedErrorRecord } from "./DatabaseClient"

export type RecordErrorArchivalResult = {
  success: boolean
  reason?: string
  errors: Error[]
  errorRecord: ArchivedErrorRecord
}

const addErrorRecordToAuditLog = async (api: ApiClient, errorRecord: ArchivedErrorRecord): Promise<boolean> => {
  const { exists, err } = await isRecordInAuditLog(api, errorRecord)
  if (err) {
    return false
  }

  if (!exists) {
    const createRecordErr = await createRecordInAuditLog(api, errorRecord)
    if (createRecordErr) {
      return false
    }
  }

  return true
}

// Record the archival of an entire group in the audit log and database
// Returns whether all records in the group were updated successfully
const recordErrorGroupArchival = async (
  db: DatabaseClient,
  api: ApiClient,
  errorGroup: ArchivedErrorRecord[],
  groupId: number
): Promise<boolean> => {
  const successfulIds: number[] = []
  const failedIds: number[] = []
  for (const errorRecord of errorGroup) {
    const ok = await addErrorRecordToAuditLog(api, errorRecord)
    if (ok) {
      successfulIds.push(errorRecord.errorId)
    } else {
      failedIds.push(errorRecord.errorId)
    }
  }

  db.markErrorsAuditLogged(successfulIds)
  db.markErrorsAuditLogFailed(failedIds)

  const allSucceeded = !!failedIds
  if (allSucceeded) {
    const err = await db.markArchiveGroupAuditLogged(Number(groupId))
    if (err) {
      logger.error({ message: "Failed database update: successfully audit logged archive group", groupId: groupId })
      // TODO handle case where group isn't updated in db but all individual records are
    }
  }
  return allSucceeded
}

export const addArchivedExceptionsToAuditLog = async (db: DatabaseClient, api: ApiClient): Promise<void> => {
  const exceptionGroups = await db.fetchUnloggedArchivedErrors()
  if (isError(exceptionGroups)) {
    throw exceptionGroups
  }

  for (const [groupId, exceptionGroup] of Object.entries(exceptionGroups)) {
    const err = await recordErrorGroupArchival(db, api, exceptionGroup, Number(groupId))
    if (err) {
      continue
    }
  }
}
