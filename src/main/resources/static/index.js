const ENDPOINT = 'http://localhost:8080/api/v1'

// rowId is implicit in all oracle db tables
const ID_COLS = ['id', 'rowId']

// backendPath is for REST calls, tableName is for error messages
const ENTITY_ENUM = {
    Duck: {
        backendPath: 'duck',
        tableName: 'DUCK',
    },
}

// requests trigger sse events
class RestClient {
    static #getErrorMsg(error) {
        if (!error.response) {
            return error.message
        }

        const serverResponse = error.response.data
        if (typeof serverResponse === 'string') {
            return serverResponse
        } else {
            return serverResponse.detail
        }
    }

    static save = async (enumVal, obj) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const path = ENDPOINT + '/' + enumVal.backendPath
        return axios
            .post(path, obj)
            .then((response) => {
                console.log('POST ' + path + ' succeeded: ', response)
                return response.data
            })
            .catch((error) => {
                console.error('POST ' + path + ' failed: ', error)
                NotificationToast.error('saving entry in ' + enumVal.tableName + ' failed: ' + RestClient.#getErrorMsg(error))
            })
    }

    static findById = async (enumVal, id) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const path = ENDPOINT + '/' + enumVal.backendPath + '/' + id
        return axios
            .get(path)
            .then((response) => {
                console.log('GET ' + path + ' succeeded: ', response)
                return response.data
            })
            .catch((error) => {
                console.error('GET ' + path + ' failed: ', error)
                NotificationToast.error('finding entry in ' + enumVal.tableName + ' failed: ' + RestClient.#getErrorMsg(error))
            })
    }

    static findAll = async (enumVal) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const path = ENDPOINT + '/' + enumVal.backendPath
        return axios
            .get(path)
            .then((response) => {
                console.log('GET ' + path + ' succeeded: ', response)
                return response.data
            })
            .catch((error) => {
                console.error('GET ' + path + ' failed: ', error)
                NotificationToast.error('finding entry in ' + enumVal.tableName + ' failed: ' + RestClient.#getErrorMsg(error))
            })
    }

    static update = async (enumVal, obj) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const path = ENDPOINT + '/' + enumVal.backendPath
        return axios
            .put(path, obj)
            .then((response) => {
                console.log('PUT ' + path + ' succeeded: ', response)
                return response.data
            })
            .catch((error) => {
                console.error('PUT ' + path + ' failed: ', error)
                NotificationToast.error('updating entry in ' + enumVal.tableName + ' failed: ' + RestClient.#getErrorMsg(error))
            })
    }

    static deleteById = async (enumVal, id) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const path = ENDPOINT + '/' + enumVal.backendPath + '/' + id
        return axios
            .delete(path)
            .then((response) => {
                console.log('DELETE ' + path + ' succeeded: ', response)
                return response.data
            })
            .catch((error) => {
                console.error('DELETE ' + path + ' failed: ', error)
                NotificationToast.error('deleting entry in ' + enumVal.tableName + ' failed: ' + RestClient.#getErrorMsg(error))
            })
    }

    static deleteAll = async (enumVal) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const path = ENDPOINT + '/' + enumVal.backendPath
        return axios
            .delete(path)
            .then((response) => {
                console.log('DELETE ' + path + ' succeeded: ', response)
                return response.data
            })
            .catch((error) => {
                console.error('DELETE ' + path + ' failed: ', error)
                NotificationToast.error('deleting entry in ' + enumVal.tableName + ' failed: ' + RestClient.#getErrorMsg(error))
            })
    }
}

// sse events trigger grid view changes
class SseService {
    static broadcastMsg = (msg) => {
        const url = ENDPOINT + '/sse/broadcast/' + encodeURIComponent(msg)
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.send()
    }

    static subscribeToBroadcast = (gridMap) => {
        assert(gridMap instanceof Map)

        const evtSource = new EventSource(ENDPOINT + '/sse/subscription', {
            withCredentials: false,
        })
        console.log('SSE subscription created: ', evtSource)

        evtSource.onopen = (event) => {
            console.log('SSE onopen call: ', event)
            NotificationToast.success('server connection established')
        }

        evtSource.onerror = (event) => {
            console.error('SSE onerror call: ', event)
            NotificationToast.error('server connection error')
        }

        evtSource.onmessage = async (event) => {
            const json = JSON.parse(event.data)

            const validProperties = ['eventType', 'objectName', 'object']
            assert(validProperties.every((prop) => json.hasOwnProperty(prop)))

            const { eventType, objectName, object } = json
            const notificationEvents = ['HEARTBEAT', 'NOTIFICATION']
            const changeEvents = ['CREATE', 'UPDATE', 'DELETE']
            assert(notificationEvents.includes(eventType) || changeEvents.includes(eventType))

            console.log('SSE ' + eventType + ': ', object)
            if (notificationEvents.includes(eventType)) {
                if (eventType === 'NOTIFICATION') {
                    NotificationToast.default(object)
                }
                return
            }

            const enumKey = objectName.charAt(0).toUpperCase() + objectName.slice(1)
            assert(Object.keys(ENTITY_ENUM).includes(enumKey))
            const enumVal = ENTITY_ENUM[enumKey]
            const grid = gridMap.get(enumVal)

            const identicalObjExists = grid.rowData.some((row) => deepEquals(row, object))
            const idKey = ID_COLS.find((e) => object[e])
            assert(idKey)

            switch (eventType) {
                case 'CREATE': {
                    assert(!identicalObjExists)
                    const newRowData = [...grid.rowData, object]
                    grid.rowData = newRowData
                    grid.api.setRowData(newRowData)
                    break
                }

                case 'UPDATE': {
                    assert(grid.rowData.every((row) => row[idKey]))
                    assert(grid.rowData.find((row) => row[idKey] === object[idKey]))
                    const newRowData = grid.rowData.map((row) => (row[idKey] === object[idKey] ? object : row))
                    grid.rowData = newRowData
                    grid.api.setRowData(newRowData)
                    break
                }

                case 'DELETE': {
                    assert(identicalObjExists)
                    const newRowData = grid.rowData.filter((row) => !deepEquals(row, object))
                    grid.rowData = newRowData
                    grid.api.setRowData(newRowData)
                    break
                }
            }

            NotificationToast.success(eventType.toLowerCase() + ' operation in ' + enumVal.tableName)
        }
    }
}

// initial setup of grids
class GridInitializer {
    static initNav = () => {
        const nav = document.getElementsByTagName('nav')[0]
        assert(nav)

        const enumVals = Object.values(ENTITY_ENUM)
        enumVals.forEach((enumVal) => {
            const a = document.createElement('a')
            a.href = '#' + enumVal.tableName
            a.innerHTML = enumVal.tableName
            nav.appendChild(a)
        })
    }

    static #getAddButton = (enumVal, gridMap) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)

        const addButtonWrapper = document.createElement('div')
        addButtonWrapper.classList.add('addBtnWrapper')

        const addButton = document.createElement('button')
        addButton.classList.add('addBtn')
        addButton.id = 'addBtn_' + enumVal.tableName

        const PLUS = '＋'
        const GREEN = 'rgb(76, 175, 80)'
        const RED = '#f44336'
        const CROSS = '↯'
        addButton.innerHTML = PLUS
        addButton.style.background = GREEN

        const toggleStyling = () => {
            addButton.innerHTML = addButton.innerHTML === PLUS ? CROSS : PLUS
            addButton.style.background = addButton.style.background === GREEN ? RED : GREEN

            const rotationTime = 100
            addButton.style.transition = 'transform ' + rotationTime / 1000 + 's'
            addButton.style.transform = 'rotate(25deg)'
            setTimeout(() => {
                addButton.style.transition = 'none'
                addButton.style.transform = 'rotate(0deg)'
            }, rotationTime)
        }

        addButton.onclick = () => {
            const grid = gridMap.get(enumVal)
            if (addButton.innerHTML === PLUS) {
                grid.api.setPinnedTopRowData([{}])
            } else {
                grid.api.setPinnedTopRowData([])
            }
            toggleStyling()
            return
        }

        addButtonWrapper.appendChild(addButton)
        return addButtonWrapper
    }

    static #getSelectAllButton = (enumVal, gridMap) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)

        const selectAllButton = document.createElement('button')
        selectAllButton.classList.add('chip')
        selectAllButton.classList.add('selectAllChip')
        selectAllButton.innerHTML = '✓ select all'
        selectAllButton.onclick = () => {
            const grid = gridMap.get(enumVal)
            grid.api.selectAll()
        }
        return selectAllButton
    }

    static #getDeleteButton = (enumVal, gridMap) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)

        const deleteButton = document.createElement('button')
        deleteButton.classList.add('chip')
        deleteButton.classList.add('deleteChip')
        deleteButton.innerHTML = '⤬ delete selection'

        deleteButton.onclick = () => {
            const grid = gridMap.get(enumVal)
            grid.api.stopEditing()
            const selectedData = grid.api.getSelectedRows()
            console.log('selected data for deletion: ', selectedData)

            if (selectedData.length === 0) {
                NotificationToast.error('no rows selected to delete')
                return
            }

            const confirmMsg = 'Are you sure you want to delete ' + selectedData.length + ' rows?'
            const confirmed = confirm(confirmMsg)
            if (!confirmed) {
                return
            }

            selectedData.forEach((obj) => {
                const idKey = ID_COLS.find((e) => obj[e])
                const success = RestClient.deleteById(enumVal, obj[idKey])
                if (!success) {
                    NotificationToast.error('failed to delete row in ' + enumVal.tableName)
                }
            })
        }
        return deleteButton
    }

    static #exportToCsvButton = (enumVal, gridMap) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)

        const exportButton = document.createElement('button')
        exportButton.classList.add('chip')
        exportButton.classList.add('exportCsvChip')
        exportButton.innerHTML = '⤒ export selection to csv'

        exportButton.onclick = () => {
            const grid = gridMap.get(enumVal)
            grid.api.stopEditing()
            const selectedData = grid.api.getSelectedRows()
            console.log('selected data for csv export: ', selectedData)

            if (selectedData.length === 0) {
                NotificationToast.error('no rows selected to export')
                return
            }

            const fileName = enumVal.tableName + '_' + new Date().toISOString().slice(0, 10) + '.csv'
            const schema = Object.keys(selectedData[0])
            const data = selectedData.map((row) => Object.values(row))
            console.log('exporting to csv: ', fileName, schema, data)

            const csv = Papa.unparse({
                fields: schema,
                data: data,
            })
            saveAs(new Blob([csv], { type: 'text/csv' }), fileName)
        }
        return exportButton
    }

    static #exportToExcelButton = (enumVal, gridMap) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)

        const exportButton = document.createElement('button')
        exportButton.classList.add('chip')
        exportButton.classList.add('exportExcelChip')
        exportButton.innerHTML = '⤒ export selection to excel'

        exportButton.onclick = async () => {
            const grid = gridMap.get(enumVal)
            grid.api.stopEditing()
            const selectedData = grid.api.getSelectedRows()
            console.log('selected data for excel export: ', selectedData)

            if (selectedData.length === 0) {
                NotificationToast.error('no rows selected to export')
                return
            }

            const fileName = enumVal.tableName + '_' + new Date().toISOString().slice(0, 10) + '.xlsx'
            const schema = Object.keys(selectedData[0])
            const data = selectedData.map((row) => Object.values(row))
            console.log('exporting to excel: ', fileName, schema, data)

            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'rtnsconfig'
            workbook.lastModifiedBy = 'rtnsconfig'
            const sheet = workbook.addWorksheet(enumVal.tableName)
            sheet.columns = schema.map((colName) => ({ header: colName, key: colName }))
            sheet.addRows(data)
            sheet.getRow(1).font = { bold: true }

            const blob = await workbook.xlsx.writeBuffer()
            saveAs(new Blob([blob]), fileName)
        }
        return exportButton
    }

    static #importFromExcelButton = (enumVal, gridMap) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)

        const importButton = document.createElement('button')
        importButton.classList.add('chip')
        importButton.classList.add('importExcelChip')
        importButton.innerHTML = '⤓ import from excel'

        const toggleInput = () => {
            const section = document.getElementById(enumVal.tableName)
            const existingInput = section && section.querySelector('.importExcelInput')
            if (existingInput) {
                section.removeChild(existingInput)
                return null
            }

            const input = document.createElement('input')
            input.type = 'file'
            input.name = 'files'
            input.multiple = false
            input.accept = '.xlsx, .xls'
            input.classList.add('importExcelInput')
            section.insertBefore(input, importButton.nextSibling)
            return input
        }

        const removeInput = (input) => {
            input.value = ''
            input.onchange = null
            const section = document.getElementById(enumVal.tableName)
            const existingInput = section && section.querySelector('.importExcelInput')
            assert(existingInput === input)
            section.removeChild(existingInput)
        }

        const getExcelData = async (file) => {
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(file)
            const sheet = workbook.getWorksheet(enumVal.tableName)

            let excelData = null
            try {
                excelData = sheet
                    .getSheetValues()
                    .filter((row) => row)
                    .filter((row) => row.some((col) => col))
                    .map((row) => row.filter((col) => col))
            } catch {
                NotificationToast.error('uploaded excel file is not from this table or app')
                return null
            }

            if (!excelData || excelData.length < 2) {
                NotificationToast.error('uploaded excel file is empty')
                return null
            }
            console.log('importing from excel: ', file.name, excelData)

            const gridSchema = gridMap.get(enumVal).columnDefs.map((colDef) => colDef.field)
            const excelSchema = excelData[0]
            const same = gridSchema.length === excelSchema.length && gridSchema.every((colName) => excelSchema.includes(colName))
            if (!same) {
                NotificationToast.error('uploaded excel file has different schema than table')
                console.log('grid vs. excel schema: ', gridSchema, excelSchema)
                return null
            }

            return { excelData, excelSchema }
        }

        const upsert = async (object) => {
            const grid = gridMap.get(enumVal)
            const exists = grid.rowData.some((row) => deepEquals(row, object))
            if (exists) {
                NotificationToast.default('identical row already exists in table: ' + JSON.stringify(object))
                return false
            }

            const idKey = ID_COLS.find((e) => object[e])
            const rowToUpdate = grid.rowData.find((row) => row[idKey] === object[idKey])
            if (rowToUpdate) {
                return await RestClient.update(enumVal, object)
            }

            return await RestClient.save(enumVal, object)
        }

        importButton.onclick = async () => {
            const input = toggleInput()
            if (!input) {
                return
            }

            input.onchange = async () => {
                assert(input.files.length === 1)
                const file = input.files[0]

                const data = await getExcelData(file)
                if (!data) {
                    removeInput(input)
                    return
                }
                const { excelData, excelSchema } = data

                const confirmMsg = 'Are you sure you want to import ' + (excelData.length - 1) + ' rows?'
                const confirmed = confirm(confirmMsg)
                if (!confirmed) {
                    removeInput(input)
                    return
                }

                for (const row of excelData.slice(1)) {
                    const obj = {}
                    row.forEach((col, i) => {
                        obj[excelSchema[i]] = col
                    })
                    const success = upsert(obj)
                }

                removeInput(input)
            }
        }
        return importButton
    }

    static #fetchData = async (enumVal) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        const serverResponse = await RestClient.findAll(enumVal)

        if (!serverResponse) {
            NotificationToast.default('failed loading data, retrying ...')
            await new Promise((resolve) => setTimeout(resolve, 2_000))
            return GridInitializer.#fetchData(enumVal)
        }

        if (serverResponse.length === 0) {
            NotificationToast.default('found empty table, reloading ...')
            await new Promise((resolve) => setTimeout(resolve, 2_000))
            return GridInitializer.#fetchData(enumVal)
        }

        const data = serverResponse
        const schema = Object.keys(data[0]).map((key) => ({ field: key }))
        return { schema, data }
    }

    static #gridCreateCallback = async (enumVal, gridMap, event) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)
        const grid = gridMap.get(enumVal)

        const userInput = event.node.data
        const schema = grid.columnDefs.map((e) => e.field)
        const idKey = ID_COLS.find((e) => schema.includes(e))
        const requiredColumns = schema.filter((e) => e !== idKey)
        const rowIsFull = requiredColumns.every((e) => userInput[e])
        if (!rowIsFull) {
            return
        }

        const success = await RestClient.save(enumVal, userInput)
        document.querySelector('#addBtn_' + enumVal.tableName).click()
    }

    static #gridUpdateCallback = async (enumVal, gridMap, event) => {
        assert(Object.values(ENTITY_ENUM).includes(enumVal))
        assert(gridMap instanceof Map)
        const grid = gridMap.get(enumVal)

        const updatedRow = event.data
        const success = await RestClient.update(enumVal, updatedRow)
        if (!success) {
            const unchangedRows = []
            grid.rowData.forEach((row) => {
                if (deepEquals(row, updatedRow)) {
                    row[event.colDef.field] = event.oldValue
                }
                unchangedRows.push(row)
            })

            grid.rowData = unchangedRows
            grid.api.setRowData(unchangedRows)
            console.log('reverted  changes')
            return
        }
        console.log('updated row: ', updatedRow)
    }

    static initGrids = async () => {
        const gridMap = new Map()

        const init = async (enumVal) => {
            const section = document.createElement('section')
            section.id = enumVal.tableName

            const h2 = document.createElement('h2')
            h2.innerHTML = 'Database table: ' + enumVal.tableName
            section.appendChild(h2)

            const addButton = GridInitializer.#getAddButton(enumVal, gridMap)
            section.appendChild(addButton)

            const selectAllButton = GridInitializer.#getSelectAllButton(enumVal, gridMap)
            section.appendChild(selectAllButton)

            const deleteButton = GridInitializer.#getDeleteButton(enumVal, gridMap)
            section.appendChild(deleteButton)

            const exportToCsvButton = GridInitializer.#exportToCsvButton(enumVal, gridMap)
            section.appendChild(exportToCsvButton)

            const exportToExcelButton = GridInitializer.#exportToExcelButton(enumVal, gridMap)
            section.appendChild(exportToExcelButton)

            const importFromExcelButton = GridInitializer.#importFromExcelButton(enumVal, gridMap)
            section.appendChild(importFromExcelButton)

            const gridDiv = document.createElement('div')
            gridDiv.classList.add('grid')
            gridDiv.classList.add('ag-theme-balham')
            section.appendChild(gridDiv)

            const { schema, data } = await GridInitializer.#fetchData(enumVal)

            const gridOptions = {
                columnDefs: schema,
                rowData: data,

                animateRows: true,
                defaultColDef: {
                    sortable: true,
                    filter: true,
                    resizable: true,
                    maxWidth: 135,

                    checkboxSelection: (arg) => ID_COLS.includes(arg.colDef.field),
                    editable: (arg) => !ID_COLS.includes(arg.colDef.field),
                    suppressKeyboardEvent: (args) => args.event.key === 'Backspace',

                    onCellValueChanged: async (arg) => {
                        if (arg.node.rowPinned) {
                            GridInitializer.#gridCreateCallback(enumVal, gridMap, arg)
                        } else {
                            GridInitializer.#gridUpdateCallback(enumVal, gridMap, arg)
                        }
                    },
                },
                animateRows: true,
                rowSelection: 'multiple',
            }

            new agGrid.Grid(gridDiv, gridOptions)
            document.querySelector('body').appendChild(section)

            return gridOptions
        }

        for (const enumVal of Object.values(ENTITY_ENUM)) {
            const grid = await init(enumVal)
            assert(ID_COLS.find((e) => grid.columnDefs.some((col) => col.field === e)))
            gridMap.set(enumVal, grid)
        }

        console.log('gridMap: ', gridMap)
        NotificationToast.success('data loaded')
        return gridMap
    }
}

window.onload = async () => {
    GridInitializer.initNav()
    await GridInitializer.initGrids().then((gridMap) => {
        assert(gridMap instanceof Map)
        SseService.subscribeToBroadcast(gridMap)
    })
}
