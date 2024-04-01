// Response status
export const ResponseCode = {
  InvalidParams: 0, // no code received
  Success: 1,
  SyntaxError: 2, // code has syntax error
  InvalidOptions: 3, // code contains forbidden option
  UnsuccessfulExecution: 4, // Cyclone failed
  InternalError: 5, // Server failed
  ExecutionTimeout: 6, // execution timeout
  Enqueued: 7, // Queue mode successfully enqueued the source code
  NotSupported: 8, // a mode not supported by server
  NotFound: 9 // polling failed for exec id, please try again
}

export const RedisKey = {
  executionResult: "cyclone_exec_res" // redis key of result
}