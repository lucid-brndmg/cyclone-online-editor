export const ResponseCode = {
  InvalidParams: 0,
  Success: 1,
  SyntaxError: 2,
  InvalidOptions: 3,
  UnsuccessfulExecution: 4,
  InternalError: 5,
  ExecutionTimeout: 6,
  Enqueued: 7,
  NotSupported: 8,
  NotFound: 9
}

export const RedisKey = {
  executionResult: "cyclone_exec_res"
}