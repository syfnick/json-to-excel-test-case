<!-- eslint-disable no-console -->
<script setup lang="ts">
import fs from 'node:fs'
import type { UploadFile, UploadProps } from 'element-plus'
import { ipcRenderer } from 'electron'
import xlsx from 'node-xlsx'

const findObjectByKey = (data: any, field: string) => {
  let finding = null
  for (const key in data) {
    if (key === field)
      return data[key]

    if (typeof (data[key]) === 'object')
      finding = findObjectByKey(data[key], field) as object

    if (finding)
      return finding
  }
  return null
}

const buildExcelData = (dataArray: TestCase[]): string[][] => {
  const excelData = [
    ['模块', '接口名称', '用例标题', '用例级别', '请求方式', '请求Url地址', '请求报文用例', '返回报文用例', '预期结果'],
  ]
  dataArray.forEach((data) => {
    excelData.push([data.module, data.name, data.title, data.priority, data.method, data.url, JSON.stringify(data.request), JSON.stringify(data.response), data.expected.toString()])
  })
  return excelData
}

const buildExcel = (fileName: string, data: string[][]) => {
  const buffer = xlsx.build([{ name: 'sheet1', data, options: {} }])
  fs.writeFileSync(fileName, buffer)
  ipcRenderer.send('show-save-file', fileName)
}

const filterHttpStatus = (httpStatus: string) => {
  const httpStatusArray = httpStatus.split(':')
  if (httpStatusArray.length > 1) {
    const httpStatusXArray = httpStatusArray[0].split('-')
    return httpStatusXArray.length > 1 ? httpStatusXArray[1] : '-1'
  }
  else { return httpStatus }
}

// const apiFoxFileReader = (file: UploadFile) => {
//   try {
//     const dataArray: TestCase[] = []
//     const jsonData = JSON.parse(fs.readFileSync(file.raw?.path as string, 'utf8'))
//     console.log(jsonData)

//     const apiCollection = jsonData.apiCollection as ApiFoxApi[]
//     apiCollection.forEach((apiItem) => {
//       const modules = apiItem.items as ApiFoxModule[]
//       modules.forEach((module) => {
//         const moduleName = module.name
//         const moduleItems = module.items
//         moduleItems.forEach((moduleItem) => {
//           const apiObject = moduleItem.api

//           const apiRequestBody = apiObject.requestBody
//           const apiPath = apiObject.path
//           const apiMethod = apiObject.method
//           const apiName = moduleItem.name
//           const apiResponseExamples = apiObject.responseExamples

//           apiResponseExamples.forEach((apiResponseExample) => {
//             const apiResponseExampleName = apiResponseExample.name
//             const apiResponseExampleData = apiResponseExample.data

//             const testCase: TestCase = {
//               module: moduleName,
//               name: apiName,
//               title: apiResponseExampleName,
//               priority: '高',
//               method: apiMethod,
//               url: apiPath,
//               request: apiRequestBody,
//               response: apiResponseExampleData,
//               expected: 200,
//             }
//           })
//         })
//       })
//     })

//     // const excelData = buildExcelData(dataArray)
//     // buildExcel(`./${jsonData.info.name}_test_case.xlsx`, excelData)
//   }
//   catch (error) {
//     // 有错误，显示对话框提示错误
//     ipcRenderer.send('show-error', error)
//   }
// }

// const handleApiFoxChange: UploadProps['onChange'] = (file, _fileList) => {
//   const loading = ElLoading.service({ lock: true, text: '文件读取中，请稍等..' })

//   const fileType = file.name
//     .substring(file.name.lastIndexOf('.') + 1)
//     .toUpperCase()

//   if (fileType === 'JSON') {
//     apiFoxFileReader(file)
//     loading.close()
//   }
//   else {
//     loading.close()
//     ElNotification({
//       title: '警告',
//       message: `${file.name}文件格式错误,只允许上传json文件`,
//       type: 'warning',
//       duration: 1000,
//     })
//   }
// }

const openApiFileReader = (file: UploadFile) => {
  try {
    const dataArray: TestCase[] = []
    const jsonData = JSON.parse(fs.readFileSync(file.raw?.path as string, 'utf8'))
    const paths: [] = jsonData.paths
    const pathsMap = new Map(Object.entries(paths))

    console.log(jsonData)

    for (const [path, methods] of pathsMap) {
      console.log(path)

      const methodsMap = new Map(Object.entries(methods))
      for (const [method, context] of methodsMap) {
        const requestBody = (context as TestCaseContext).requestBody
        let requestBodyExample: object
        if (requestBody && requestBody.content && requestBody.content['application/json'])
          requestBodyExample = findObjectByKey(requestBody.content['application/json'], 'example')
        else
          requestBodyExample = requestBody

        const tags = (context as TestCaseContext).tags
        const responseMap = new Map(Object.entries((context as TestCaseContext).responses))
        for (const [httpStatus, response] of responseMap) {
          const examples = findObjectByKey(response, 'examples')
          if (examples) {
            const examplesArray = Object.values(examples)
            examplesArray.forEach((example) => {
              const exampleSummary = (example as TestCaseExample).summary
              const exampleValue = (example as TestCaseExample).value

              const testCase: TestCase = {
                id: 0,
                module: tags.length > 0 ? tags[0] : '',
                name: (context as TestCaseContext).summary,
                title: exampleSummary,
                priority: '高',
                method: method as string,
                url: path,
                request: requestBodyExample,
                response: exampleValue,
                expected: parseInt(filterHttpStatus(httpStatus)),
              }
              dataArray.push(testCase)
            })
          }
        }
      }
    }

    const excelData = buildExcelData(dataArray)
    buildExcel(`./${jsonData.info.title}_test_case.xlsx`, excelData)
  }
  catch (error) {
    // 有错误，显示对话框提示错误
    ipcRenderer.send('show-error', error)
  }
}

const handleOpenApiFileChange: UploadProps['onChange'] = (file, _fileList) => {
  const loading = ElLoading.service({ lock: true, text: '文件读取中，请稍等..' })

  const fileType = file.name
    .substring(file.name.lastIndexOf('.') + 1)
    .toUpperCase()

  if (fileType === 'JSON') {
    openApiFileReader(file)
    loading.close()
  }
  else {
    loading.close()
    ElNotification({
      title: '警告',
      message: `${file.name}文件格式错误,只允许上传json文件`,
      type: 'warning',
      duration: 1000,
    })
  }
}
</script>

<template>
  <div class="container">
    <el-container>
      <el-header>
        <el-alert title="操作说明" description="上传OpenAPI.json" type="info" show-icon :closable="false" />
      </el-header>
      <el-container>
        <el-main>
          <el-upload
            class="upload-demo" drag :show-file-list="false" :on-change="handleOpenApiFileChange" action="#"
            accept="application/json" :auto-upload="false"
          >
            <i class="el-icon-upload" />
            <div class="el-upload__text">
              <em>请点击选择OpenApi文件</em>
            </div>
          </el-upload>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
.el-header {
  border-bottom: 1px dotted #f2f2f2;
  margin-bottom: 15px
}

.el-aside {
  padding: 20px;
  border-right: 1px solid #f2f2f2
}

.el-main,
.el-aside {
  text-align: center
}

.el-form-item {
  margin-bottom: 0
}
</style>
