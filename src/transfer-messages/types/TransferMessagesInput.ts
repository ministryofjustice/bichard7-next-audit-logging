export enum Destination {
  CORE = "core",
  LEGACY = "legacy"
}

export interface TransferMessagesInput {
  numberOfObjectsToTransfer: string | number
  destinationBucket?: Destination
}
