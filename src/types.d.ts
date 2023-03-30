interface TestCase {
  id: number
  module: string
  name: string
  title: string
  priority: string
  method: string
  url: string
  request: object
  response: object | string
  expected: number
}

interface TestCaseContextRequestBodyContent {
  [key: string]: object
}

interface TestCaseContextRequestBody {
  content: TestCaseContextRequestBodyContent
}

interface TestCaseContext {
  summary: string
  description: string
  requestBody: TestCaseContextRequestBody
  responses: object
  tags: string[]
}

interface TestCaseExampleValue {
  code: number
  data: object
  msg: string
}

interface TestCaseExample {
  summary: string
  value: TestCaseExampleValue
}

interface ApiFoxApi {
  items: ApiFoxModule[]
}

interface ApiFoxModuleItem {
  api: ApiFoxApiItem
  name: string
}

interface ApiFoxModule {
  items: ApiFoxModuleItem[]
  name: string
}

interface responseExample {
  data: string
  name: string
}

interface ApiFoxApiItem {
  path: string
  method: string
  requestBody: object
  responseExamples: responseExample[]
}

// interface ProjectInfo {
//   title: string
//   description: string
//   version: string
// }

interface Path {
  [key: string]: string
}

declare interface JsonData {
  paths: Path[]
}
