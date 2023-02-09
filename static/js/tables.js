//helper functions
const c_good = "#7DDE92"
const c_mid = "#FF9B71"
const c_poor = "#F15156"
const chart_colors = ["#115f9a", "#1984c5", "#22a7f0", "#48b5c4", "#76c68f", "#a6d75b", "#c9e52f", "#d0ee11", "#d0f400"]
const chart_color_map = {
    "MV": chart_colors[1],
}
const loading_spinner = `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`

const preponderance_list = ["NA", "MV", "CW", "CR"]
const boundary_map = {
    0: "H",

    1: "G2",
    2: "G1",

    3: "F3",
    4: "F2",
    5: "F1",

    6: "E3",
    7: "E2",
    8: "E1",

    9: "D3",
    10: "D2",
    11: "D1",

    12: "C3",
    13: "C2",
    14: "C1",
    
    15: "B3",
    16: "B2",
    17: "B1",

    18: "A5",
    19: "A4",
    20: "A3",
    21: "A2",
    22: "A1",
}

const moderation_formatter = function (cell) {
    let value = cell.getValue()
    //if value is 0 - return 'Not moderated'
    //if value is positive - return +value bands
    //if value is negative - return -value bands
    if (value == 0) {
        return "Not moderated"
    } else if (value > 0) {
        return "+" + value + " bands"
    } else {
        return value + " bands"
    }
}

const preponderance_formatter = function (cell) {
    let value = cell.getValue()
    let element = cell.getElement()
    if (element) {
        if (value == "N/A"){
            element.style.backgroundColor = "#E06666"
        } else if (value == "NA") {
            element.style.backgroundColor = "#BBDBB4"
        } else if (value == "MV"){
            element.style.backgroundColor = "#648DE5"
        } else if (value == "CW"){
            //set cell colour to dark gray
            element.style.backgroundColor = "#EFF2F1"
        } else if (value == "CR"){
            //set cell colour to dark red
            element.style.backgroundColor = "#A64253"
        }
    }
    return value
}

const is_preponderance = function (cell) {
    if (cell.getValue() == "N/A")
        return true
    if (preponderance_list.includes(cell.getValue()))
        return true
    return false
}

const bound_check = (value, lower_bound, upper_bound) => {
    if (value >= lower_bound && value < upper_bound)
        return true
    return false
}

//FORMATTERS
const formatter_to_band_letter = function(cell, formatterParams, onRendered){
    if (is_preponderance(cell)) {
        return preponderance_formatter(cell)
    }

    return boundary_map[Math.round(cell.getValue())]
}

const formatter_to_band_integer = function(cell, formatterParams, onRendered){
    if (is_preponderance(cell)) {
        return preponderance_formatter(cell)
    } 
    return parseFloat(cell.getValue()).toFixed(2)
}

// const formatter_to_percentage = function(cell, formatterParams, onRendered){
//     if (is_preponderance(cell)) {
//         return preponderance_formatter(cell)
//     }
//     return cell.getValue() + "%"
// }

const custom_average_calculator = function(values, data, calcParams){
    let total = 0;
    let count = 0;
    let credit_mode = false;
    let total_credits = 0;
    let credit_values = [];
    if (data?.[0]?.credits) {
        credit_mode = true;
    }
    
    let check_list = [...preponderance_list, "N/A", ""]

    if (credit_mode) {
        for (let i = 0; i < data.length; i++) {
            let row = data[i];
            if (row.credits) {
                total_credits += row.credits;
                credit_values.push(row.credits);
            }
        }
    }

    for (let i = 0; i < values.length; i++) {
        if (!check_list.includes(values[i])) {
            total += (credit_mode && credit_values[i]) ? parseInt(values[i]) * credit_values[i]: parseInt(values[i]);
            count++;
        } else { // if the value is N/A or MV, then we need to subtract the credit value from the total
            total_credits -= credit_values[i];
            credit_values[i] = 0;
        }
    }

    if (count) {
        return (credit_mode) ? (total/total_credits).toFixed(2) : (total / count).toFixed(2);
    } else {
        return "N/A";
    }
}

const default_formatter = formatter_to_band_integer

function init_table(table_id, columns, prefil_data = null, extra_constructor_params = {}, settings={}) {
    let title = ""
    if (settings.title)
        title = settings.title

    let table_constructor = {
        // layout:"fitColumns",
        // responsiveLayout:"hide",
        // responsiveLayout:true,
        // data: table_data,
        // columns: columns.map((column) => {
        //     // if (column.columns) {
        //     //     column.columns = column.columns.forEach((sub_column) => {
        //     //         sub_column.minWidth = 100
        //     //         return sub_column
        //     //     })
        //     // }
        //     // if (!column.minWidth)
        //     //     // column.minWidth = 100
        //     // if (column.titleFormatter) {
        //     //     // column.minWidth = 20
        //     //     column.width = 20
        //     // }
        //     return column
        // }),
        columns: columns,
        pagination: true,
        paginationMode: "local",
        columnHeaderVertAlign:"middle",

        selectable:true,
        rowHeight: 30,
        groupToggleElement: "header",

        autoResize: false,

        // height: 700,
        // maxHeight: "800px",
        placeholder: "Table is empty",

        paginationSize: 100,
        paginationSizeSelector:[25, 50, 100, 1000],

        layout: "fitDataFill", //"fitColumns", //fitDataStretch

        movableColumns: true,

        dataLoaderLoading:`<span>Loading ${title} table data</span>`,
        // layoutColumnsOnNewData:true
        downloadConfig:{
            columnHeaders:true, //do not include column headers in downloaded table
            columnGroups:true, //do not include column groups in column headers for downloaded table
            rowGroups:false, //do not include row groups in downloaded table
            columnCalcs:false, //do not include column calcs in downloaded table
        },
        rowContextMenu: [],
        //downloadRowRange:"selected", //download selected rows
    }

    if (prefil_data){
        table_constructor.data = prefil_data
    } else {
        table_constructor.ajaxURL = window.location.href
        table_constructor.ajaxParams = {
            "fetch_table_data": true,
            // "size": pagination_size,
            // "page": page_count,
        }
        table_constructor.ajaxConfig = "GET"
        table_constructor.ajaxResponse = function(url, params, response) {
            console.log(response)
            console.log("AAAA")
            if (typeof response.extra_cols !== 'undefined') {
                table.extra_cols = response.extra_cols
                table.dispatchEvent("dataLoadedInitial")
                return response.data
            } else {
                table.dispatchEvent("dataLoadedInitial")
                return response
            }
        }
    }

    for (let key in extra_constructor_params){
        table_constructor[key] = extra_constructor_params[key]
    }
    if (!settings.no_multirow) {
        table_constructor.rowContextMenu.push({
            separator: true
        })
        table_constructor.rowContextMenu.push({
            label:"<div class='inline-icon' title='The following actions will affect all the selected rows. Note that all the actions in this category are reversible - so do not worry if you accidentally click something.'><img src='/static/icons/info.svg'></i><span>Multi-row actions</span></div>",
            menu:[
                {
                    label:"<div class='inline-icon' title='Note that this is simply hiding the rows, meaning no table data gets manipulated.'><img src='/static/icons/info.svg'></i><span>Hide row(s)</span></div>",
                    action:function(e, row){
                        let selected_rows = table.getSelectedRows()
                        selected_rows.forEach(function(inner_row){
                            table.hidden_rows.push(inner_row.getData())
                            inner_row.getElement().classList.add('hidden-row')
                        })
                        if (table.hidden_rows) {
                            document.getElementById('unhide-rows').classList.remove('hidden')
                        }
                    }
                },
                {
                    label:"<div class='inline-icon' title='Note that this action properly removes data from the table (locally, and not from the database), - this can be useful for preparing the table for data extraction, such as generating an excel file, for example.'><img src='/static/icons/info.svg'></i><span>Delete row(s)</span></div>",
                    action:function(e, row){
                        let selected_rows = table.getSelectedRows()
                        selected_rows.forEach(function(inner_row){
                            table.deleted_rows.push(inner_row.getData())
                            inner_row.delete()
                        })
                        if (table.deleted_rows) {
                            document.getElementById('undelete-rows').classList.remove('hidden')
                        }
                    }
                },
            ]
        })    
    }

    let table_element = (isElement(table_id)) ? table_id : document.getElementById(table_id)
    table_element.dataset.edit_mode = 0
    let table = new Tabulator(table_element, table_constructor)
    table.extra_cols = []
    table.settings = settings
    // table.get_cols = columns

    table.hidden_rows = []
    table.deleted_rows = []

    table.addNotification = function(message="Table in edit mode! Click on any of the <span class='tabulator-notification-hint'>outlined cells</span>, to edit the data inside.") {
        let notification = document.createElement('div')
        notification.classList.add('tabulator-notification')
        notification.innerHTML = message
        table.getWrapper().prepend(notification)
    }

    table.removeNotification = function() {
        let notification = table.getWrapper().querySelector('.tabulator-notification')
        if (notification) {
            notification.remove()
        }
    }

    table.addHeading = function(message) {
        let heading = document.createElement('div')
        heading.classList.add('tabulator-heading')
        heading.innerHTML = message
        table.getWrapper().prepend(heading)
    }
    table.dataLoadedInitial = false

    table.getElement = () => table_element
    table.reformatTable = function(formatter=null, cssClass=null, new_bottom_calc_function=null) {
        let existing_cols = {}
        table.getColumns().forEach(function(col){
            var parent_col = col.getParentColumn()
            if (parent_col) {
                var parent_defition = parent_col.getDefinition()
                existing_cols[parent_defition.title] = parent_defition
            } else {
                var col_definition = col.getDefinition()
                existing_cols[col_definition.title] = col_definition
            }
        });

        const downloadAccessor = function(value, data, type, params, column){
            //mimic the behavior of the object (cell) that gets passed to the formatter. Doing so, will allow downloads to be formatted the same way as the table
            return formatter({
                getValue: () => value,
                getElement: () => null,
            })
        }

        var extract_cols = Object.values(existing_cols)
        extract_cols.forEach(function(col){
            if (col.columns) {
                col.columns.forEach(function(col_inner) {
                    if (col_inner.cssClass && col_inner.cssClass.includes(cssClass)) {
                        if (formatter) {
                            col_inner.formatter = formatter
                            col_inner.accessorDownload = downloadAccessor
                            if (new_bottom_calc_function) {
                                col_inner.bottomCalc = new_bottom_calc_function
                                col_inner.bottomCalcFormatter = formatter
                            }
                        }
                        else
                            delete col_inner.formatter
                    }
                })
            } else {
                if (col.cssClass && col.cssClass.includes(cssClass)) {
                    if (formatter) {
                        col.formatter = formatter
                        col.accessorDownload = downloadAccessor
                        if (new_bottom_calc_function) {
                            col.bottomCalc = new_bottom_calc_function
                            col.bottomCalcFormatter = formatter
                        }
                    }
                    else
                        delete col.formatter
                }
            }
        })
        table.setColumns(extract_cols)
        table.dataLoadedInitial = true
    }

    let wrapper = wrap(table_element, document.createElement('div'))
    wrapper.classList.add('tabulator-wrapper')
    table.getWrapper = () => wrapper
    let table_components = document.createElement('div')
    table_components.classList.add('tabulator-components')
    wrapper.prepend(table_components)

    table.on("dataLoadedInitial", function(){
        for (let i = 0; i < table.extra_cols.length; i++){
            table.addColumn(table.extra_cols[i])
        }
        
        table.reformatTable(default_formatter, "format_grade", custom_average_calculator)
        //handle formatting stuff
        var select_element = string_to_html_element(
            `
                <select>
                    <option value="I">band integer</option>
                    <option value="B">band letter</option>
                </select>
            `
        )
        select_element.classList.add('tabulator-format-select')

        select_element.addEventListener("change", function(e){
            if (this.value == "B") {
                table.reformatTable(formatter_to_band_letter, "format_grade", custom_average_calculator)
            } else if (this.value == "I") {
                table.reformatTable(formatter_to_band_integer, "format_grade", custom_average_calculator)
            }
        })

        let download_excel = string_to_html_element(`<button class="tabulator-download">Download excel</button>`)
        let download_pdf = string_to_html_element(`<button class="tabulator-download">Download pdf</button>`)
        let unhide_rows = string_to_html_element(`<button id="unhide-rows" class="hidden">Unhide rows</button>`)
        let undelete_rows = string_to_html_element(`<button id="undelete-rows" class="hidden">Add back deleted rows</button>`)
        let column_manager = string_to_html_element(`<button class="column-manager">Column manager</button>`)

        column_manager.addEventListener("click", function(){
            var columns = table.getColumns();
            var menu_container = document.createElement("div");
            menu_container.classList = "tabulator-columns-menu";
            menu_container.width = "200px";
            menu_container.height = "500px";

            for(let column of columns){
                if (!column.getDefinition().title || column.getDefinition().title == "hidden")
                    continue
                //create checkbox element using font awesome icons
                let checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = column.isVisible();

                //build label
                let label = document.createElement("label");
                let title = document.createElement("span");

                title.textContent = " " + column.getDefinition().title;

                label.appendChild(title);
                label.appendChild(checkbox);

                //create menu item
                menu_container.appendChild(label);

                checkbox.addEventListener("change", function() {
                    //toggle current column visibility
                    column.toggle();
                })
            }
            Popup.init(menu_container)
        })
            

        unhide_rows.addEventListener("click", function(e){
            table.getElement().querySelectorAll(".hidden-row").forEach(function(row){
                row.classList.remove("hidden-row")
            })
            table.hidden_rows = []
            unhide_rows.classList.add("hidden")
        })

        undelete_rows.addEventListener("click", function(e){
            table.addData(table.deleted_rows)
            table.deleted_rows = []
            undelete_rows.classList.add("hidden")
        })

        download_excel.addEventListener("click", function(e){
            table.download("xlsx", "data.xlsx", {});
        })
        download_pdf.addEventListener("click", function(e){
            table.downloadToTab("pdf", "data.pdf", {
                orientation:"landscape", //set page orientation to landscape
            });
        })

        let table_wrapper = table.getWrapper()

        table_wrapper.querySelector(".tabulator-components").prepend(select_element)
        table_wrapper.querySelector(".tabulator-components").appendChild(download_excel)
        table_wrapper.querySelector(".tabulator-components").appendChild(download_pdf)
        table_wrapper.querySelector(".tabulator-components").appendChild(column_manager)

        if (settings.course) {
            let moderate_course_button = string_to_html_element(`<button class="tabulator-moderate">Moderate course</button>`)
            moderate_course_button.addEventListener("click", function(e){
                render_course_moderation_section(settings.course, table)
            })
            table_wrapper.querySelector(".tabulator-components").appendChild(moderate_course_button)
        }
        table_wrapper.querySelector(".tabulator-components").appendChild(unhide_rows)
        table_wrapper.querySelector(".tabulator-components").appendChild(undelete_rows)
    })

    table.on("dataProcessed", function(){
        if (table.dataLoadedInitial) {
            table.reloadCharts()
            table.reloadContent()
            document.querySelectorAll(".lds-ring").forEach(function(select){
                select.classList.add("hidden")
            })
        }
    })

    table.setReloadFunction = (reload_function, reload_function_parameter_list) => {
        table.reload_function = reload_function
        table.reload_function_parameter_list = reload_function_parameter_list
    }

    table.charts = []
    table.chart_links = []
    table.content_links = []

    table.addChartLink = function(chart_link){
        table.chart_links.push(chart_link)
    }

    table.addContentLink = function(content_link){
        table.content_links.push(content_link)
    }

    table.destroyCharts = function(){
        for (var chart of table.charts) {
            chart.destroy()
        }
    }

    table.destroyContent = function(){
        for (var content of table.content_links) {
            content[0].innerHTML = ""
            content[0].appendChild(string_to_html_element(loading_spinner))
        }
    }

    table.reloadTable = (message=null) => {
        console.log("Reloading table")
        table.destroyCharts()
        table.destroyContent()

        document.querySelectorAll(".lds-ring").forEach(function(select){
            select.classList.remove("hidden")
        })
        
        if (! table.reload_function || ! table.reload_function_parameter_list) {
            console.warn("No reload function set for table")
            return
        }
        let table_wrapper = table.getWrapper()
        //delete all children in wrapper, except for the tabulator element
        table_wrapper.querySelectorAll(":scope *:not(.tabulator)").forEach(child => child.remove())
        table.reload_function(...table.reload_function_parameter_list)
        if (message) {
            table_wrapper.prepend(string_to_html_element(`<p>${message}</p>`))
        }
    }

    table.reloadCharts = function(){
        for (var link_data of table.chart_links) {
            let chart_setup = link_data[1](table)

            let default_setup = {
                type: 'bar',
                data: {},
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                },
                responsive : true,            
            }
            let final_setup = {...default_setup, ...chart_setup}

            let chart = new Chart(link_data[0], final_setup)
            
            table.charts.push(chart)
        }
    }

    table.reloadContent = function(){
        for (var link_data of table.content_links) {
            let linked_element = link_data[0]
            linked_element.innerHTML = link_data[1](table)
        }
    }

    return table
}

//define various table setups below

function load_students_table(extra_constructor_params = {}, extra_cols=true, settings={'title': 'Students'}){
    let columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", headerHozAlign:"center", headerSort:false, frozen:true},
        {title: "GUID", field: "GUID", headerFilter: "input", "frozen": true},
        {title: "Name", field: "name", headerFilter: "input"},
        {
            title: "Degree info",
            columns: [
                {title: "Title", field: "degree_title"},
                {title: "Name", field: "degree_name"},
                {title: "Masters?", field: "is_masters", formatter: "tickCross"},
                {title: "Faster route?", field: "is_faster_route", formatter: "tickCross"},
            ],
            "headerHozAlign": "center",
        },
        {
            title: "Year data",
            columns: [
                {title: "Current level", field: "current_year"},
                {title: "Start year", field: "start_year"},
                {title: "End year", field: "end_year"},
            ],
            "headerHozAlign": "center",
        },
        {title: "hidden", field: "count", bottomCalc: "count", visible: false},
    ]

    let ajaxParams = {
        "fetch_table_data": true,
        "students": true,
    }
    if (typeof search_term !== "undefined") {
        ajaxParams.search_term = search_term
    }

    let rowContextMenu = [
        {
            label:"View Student breakdown page",
                action:function(e, row){
                    if (typeof row.getData().page_url !== 'undefined') {
                        window.location.href = row.getData().page_url
                    }
                }
        },
    ]
    if (settings.course) {
        rowContextMenu.push({
            label:"<div class='inline-icon' title='This action will create a popup where you can see the student grades for all the assessed content for this course. Additionally, you may view and edit the preponderances here.'><img src='/static/icons/info.svg'></i><span>Student grades breakdown popup.</span></div>",
            action: function(e, row){
                create_student_course_detailed_table_popup(row.getData(), settings.course.course_id, row.getTable())
            }
        }) 
    }

    let final_extra_constructor_params = { ...extra_constructor_params,
        // groupBy: function(data){
        //     return data.start_year + " - " + data.end_year; //groups by data and age
        // },
        //context menus
        ajaxParams: ajaxParams,
        rowContextMenu:rowContextMenu,
        groupBy: 'current_year',
        initialSort: [{column: 'current_year', dir: 'dsc'}],
        placeholder: "Student data loading...",
    }
    let table = init_table("students_table", columns, null, final_extra_constructor_params, settings={...settings, ...{title: "Students"}})

    table.setReloadFunction(load_students_table, [extra_constructor_params, extra_cols, settings])

    table.on("tableBuilt", function() {
        table.setGroupHeader(function(value, count, data, group){
            return `Number of ${value} students:<span class='info-text'>${count}</span>`; //return the header contents
        });
    })

    if (settings.course) {
        table.addContentLink([
            document.querySelector(".course-page-extra-info"),
            function(table) {
                let table_data = table.getData()
                let passed_students = 0
                let failed_students = 0
                let average_final_grade = 0
                let average_coursework_grade = 0
                let average_group_grade = 0
                let average_ind_grade = 0
                let average_exam_grade = 0
                let n_rows = table_data.length
                for (let i = 0; i < n_rows; i++) {
                    let student = table_data[i]
                    if (student.final_grade && student.final_grade >= 11.5) {
                        passed_students += 1
                    } else {
                        failed_students += 1
                    }
                }
                let group_results = table.getCalcResults()
                
                for (group in group_results) {
                    let group_data = group_results[group]
                    average_final_grade += group_data.bottom.final_grade * group_data.bottom.count
                    average_coursework_grade += group_data.bottom.C_grade * group_data.bottom.count
                    average_group_grade += group_data.bottom.G_grade * group_data.bottom.count
                    average_ind_grade += group_data.bottom.I_grade * group_data.bottom.count
                    average_exam_grade += group_data.bottom.E_grade * group_data.bottom.count
                }
                //final, coursework, group, ind, exam
                let averages = [(average_final_grade / n_rows).toFixed(1), (average_coursework_grade / n_rows).toFixed(1), (average_group_grade / n_rows).toFixed(1), (average_ind_grade / n_rows).toFixed(1), (average_exam_grade / n_rows).toFixed(1)]
                let averages_text = ["Final", "Coursework", "Group Project", "Individual Project", "Exam"]
                let grades_breakdown_string = ""
                for (let i = 0; i < averages.length; i++) {
                    if (averages[i] != "NaN")
                        grades_breakdown_string += `<p><b>Average ${averages_text[i]} GPA:</b> ${averages[i]} - ${boundary_map[Math.round(averages[i])]}</p>`
                }

                return `
                    <h3>Course statistics</h3>
                    ${grades_breakdown_string}
                    <p><b>Number of students above pass grade (above E1):</b> ${passed_students} (${(passed_students/ n_rows * 100).toFixed(2)}%)</p>
                    <p><b>Number of students below pass grade (below D3):</b> ${failed_students} (${(failed_students/ n_rows * 100).toFixed(2)}%)</p>
                `
            }
        ])
    }

    if (document.getElementById("students_final_grade")) {
        table.addChartLink([
            document.getElementById("students_final_grade"), function(table_inner) {
                let table_data = table_inner.getData()
                let chart_data = {};
                let boundaries = ["A","B","C","D","E","F","G","H", "MV"]
                for (let x in boundaries) {
                    chart_data[boundaries[x]] = 0
                }
                table_data.forEach(function(row){
                    let band_grade = (row.final_grade == "MV") ? "MV" : boundary_map[Math.round(row.final_grade)][0]
                    chart_data[band_grade] = (chart_data[band_grade] || 0) + 1;
                })

                //make abc grades pleasant green color, d grade yellow, and e f g h red
                let colors = [c_good,c_good,c_good,c_mid,c_poor,c_poor,c_poor,c_poor, chart_color_map["MV"]]

                return {
                    data: {
                        labels: Object.values(boundaries),
                        datasets: [
                            {
                                label: "Number of students",
                                data: Object.values(chart_data),
                                barPercentage: 0.90,
                                backgroundColor: colors,
                            }
                        ]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: "Number of students",
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: "Final grade for course",
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    footer: function(tooltipItems) {
                                        return "Percentage of students: " + (tooltipItems[0].parsed.y / table_data.length * 100).toFixed(2) + "%"
                                    }
                                }
                            },
                            title: {
                                display: true,
                                text: "Final grade distribution for course",
                            }

                        }
                    }
                }   
            }
        ])
    }
    
    table.on("dataLoaded", function(data){
        // page_count += 1
        // api(page_count, pagination_size).then(server_data => {
        //     table.addData(server_data.data)
        //     if (page_count < server_data.last_page) {
        //         table.dispatchEvent("dataLoaded") 
        //     } else {
        //         table.dispatchEvent("dataLoadedAll")
        //     }
        // })
        // if (typeof chart !== 'undefined') {
        //     var chart_data = {};
        //     for (var i = 0; i < data.length; i++) {
        //         chart_data[data[i].start_year] = (chart_data[data[i].start_year] || 0) + 1;
        //     }
        //     chart.data.labels = Object.keys(chart_data);
        //     chart.data.datasets[0].data = Object.values(chart_data);
        //     chart.update('active');
        // }
    })
}

function load_level_progression_table(level){
    level = parseInt(level)
    console.log("Loading level progression table for level " + level)
    if(![1,2,3,4,5].includes(level)) {
        console.error("Invalid level passed to load_level_progression_table function")
        return
    }

    let columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", headerHozAlign:"center", headerSort:false, frozen:true},
        {title: "GUID", field: "GUID", headerFilter: "input", frozen: true},
        {title: "Name", field: "name", headerFilter: "input"},
        {
            title: "Degree info",
            columns: [
                {title: "Title", field: "degree_title"},
                {title: "Name", field: "degree_name"},
                {title: "Masters?", field: "is_masters", formatter: "tickCross"},
                {title: "Faster route?", field: "is_faster_route", formatter: "tickCross"},
            ],
            headerHozAlign: "center",
        },
        {
            title: "Year data",
            columns: [
                {title: "Current level", field: "current_year"},
                {title: "Start year", field: "start_year"},
                {title: "End year", field: "end_year"},
            ],
            headerHozAlign: "center",
        },
        {
            title: `Level ${level} final results`,
            columns: [
                {title: `L${level} band`, field: "final_band"},
                {title: `L${level} GPA`, field: "final_gpa"},
            ],
            headerHozAlign: "center",
        },
        {
            title: `Cumulative number of level ${level} credits graded at band`,
            columns: [
                {title: "Total", field: "n_credits"},
                {title: "> A", field: "greater_than_a"},
                {title: "> B", field: "greater_than_b"},
                {title: "> C", field: "greater_than_c"},
                {title: "> D", field: "greater_than_d"},
                {title: "> E", field: "greater_than_e"},
                {title: "> F", field: "greater_than_f"},
                {title: "> G", field: "greater_than_g"},
                {title: "> H", field: "greater_than_h"},
            ],
            "headerHozAlign": "center",
        },
    ]

    let table = init_table("level_progression_table", columns, null, {
        rowContextMenu: [{
            label:"View Student breakdown page",
                action:function(e, row){
                    if (typeof row.getData().page_url !== 'undefined') {
                        window.location.href = row.getData().page_url
                    }
                } 
        }],
        "ajaxParams": {
            "fetch_table_data": true,
        },
        groupBy: "progress_to_next_level",

        groupHeader: function(value, count, data, group){
            // console.log(data)
            let message = ""
            if (value == "discretionary") {
                message = `Students who will progress under schools discretion (${count})`
            } else if (value == "no") {
                message = `Students who will not progress (${count})`
            } else if (value == "yes") {
                message = `Students who are guaranteed to progress (${count})`
            }
            return message
        },
    }, {'title': 'Degree classification data for level '+level+' students'})


    // table.addChartLink([
    //     document.getElementById("students_final_grade"), function(table_inner) {
    //         let table_data = table_inner.getData()
    //         let chart_data = {};
    //         let boundaries = ["A","B","C","D","E","F","G","H"]
    //         for (let x in boundaries) {
    //             chart_data[boundaries[x]] = 0
    //         }
    //         table_data.forEach(function(row){
    //             let band_grade = boundary_map[percent_to_integer_band(row.final_grade)][0]
    //             chart_data[band_grade] = (chart_data[band_grade] || 0) + 1;
    //         })

    //         //make abc grades pleasant green color, d grade yellow, and e f g h red
    //         let colors = [c_good,c_good,c_good,c_mid,c_poor,c_poor,c_poor,c_poor]

    //         return {
    //             data: {
    //                 labels: Object.values(boundaries),
    //                 datasets: [
    //                     {
    //                         label: "Number of students",
    //                         data: Object.values(chart_data),
    //                         barPercentage: 0.90,
    //                         backgroundColor: colors,
    //                     }
    //                 ]
    //             },
    //             options: {
    //                 scales: {
    //                     y: {
    //                         beginAtZero: true,
    //                         title: {
    //                             display: true,
    //                             text: "Number of students",
    //                         }
    //                     },
    //                     x: {
    //                         title: {
    //                             display: true,
    //                             text: "Final grade for course",
    //                         }
    //                     }
    //                 },
    //                 plugins: {
    //                     tooltip: {
    //                         callbacks: {
    //                             footer: function(tooltipItems) {
    //                                 return "Percentage of students: " + (tooltipItems[0].parsed.y / table_data.length * 100).toFixed(2) + "%"
    //                             }
    //                         }
    //                     },
    //                     title: {
    //                         display: true,
    //                         text: "Final grade distribution for course",
    //                     }

    //                 }
    //             }
    //         }   
    //     }
    // ])

    //on data loeaded, sort by final_gpa
    table.on("dataProcessed", function(){
        if (table.dataLoadedInitial)
            table.setSort('final_gpa', 'dsc')
    })

    table.addChartLink([document.getElementById("level_progression_chart"), function(table_inner) {
        let table_data = table_inner.getData()
        let classes = ["yes", "discretionary", "no"]
        let colors = [c_good,c_mid,c_poor]
        let chart_data = []
        for (let x in classes) {
            chart_data[classes[x]] = 0
        }
        table_data.forEach(function(row){
            chart_data[row.progress_to_next_level] = (chart_data[row.progress_to_next_level] || 0) + 1;
        })
        return {
            data: {
                labels: classes,
                datasets: [
                    {
                        label: "Number of students",
                        data: Object.values(chart_data),
                        backgroundColor: colors,
                    }
                ]
            }
        }
    }])
}
    

function load_degree_classification_table(level) {
    level = parseInt(level)
    if(![4,5].includes(level)) {
        console.error("Invalid level passed to load_degree_classification_table function")
        return
    }

    let columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", headerHozAlign:"center", headerSort:false, frozen:true},
        {title: "GUID", field: "GUID", headerFilter: "input", "frozen": true},
        {title: "Name", field: "name", headerFilter: "input"},
        {
            title: "Degree info",
            columns: [
                {title: "Title", field: "degree_title"},
                {title: "Name", field: "degree_name"},
                {title: "Masters?", field: "is_masters", formatter: "tickCross"},
                {title: "Faster route?", field: "is_faster_route", formatter: "tickCross"},
            ],
            "headerHozAlign": "center",
        },
        {
            title: "Year data",
            columns: [
                {title: "Current level", field: "current_year"},
                {title: "Start year", field: "start_year"},
                {title: "End year", field: "end_year"},
            ],
            "headerHozAlign": "center",
        },
        {title: "Degree classification", field: "class"},
        {title: "Final band", field: "final_band"},
        {title: "Final GPA", field: "final_gpa"},
        {title: "L5 band", field: "l5_band"},
        {title: "L5 GPA", field: "l5_gpa"},
        {title: "L4 band", field: "l4_band"},
        {title: "L4 GPA", field: "l4_gpa"},
        {title: "L3 band", field: "l3_band"},
        {title: "L3 GPA", field: "l3_gpa"},
        {
            title: `Cumulative number of level ${level} credits graded at band`,
            columns: [
                {title: "Total", field: "n_credits"},
                {title: "> A", field: "greater_than_a"},
                {title: "> B", field: "greater_than_b"},
                {title: "> C", field: "greater_than_c"},
                {title: "> D", field: "greater_than_d"},
                {title: "> E", field: "greater_than_e"},
                {title: "> F", field: "greater_than_f"},
                {title: "> G", field: "greater_than_g"},
                {title: "> H", field: "greater_than_h"},
            ],
            "headerHozAlign": "center",
        },
        {title: "Team (lvl 3 Hons)", field: "team", cssClass: "format_grade"},
        {title: "Individual (lvl 4 Hons)", field: "project", cssClass: "format_grade"},
        {title: "Individual (lvl 5 M)", field: "project_masters", cssClass: "format_grade"},
    ]

    if (level != 5) {
        //remove the l5 columns from the table
        for (let i = 0; i < columns.length; i++) {
            if (["l5_band", "l5_gpa", "project_masters"].includes(columns[i].field)) {
                columns.splice(i, 1);
                i--;
            }
        }
    }

    let table = init_table("degree_classification_table", columns, null, {
        rowContextMenu: [{
            label:"View Student breakdown page",
                action:function(e, row){
                    if (typeof row.getData().page_url !== 'undefined') {
                        window.location.href = row.getData().page_url
                    }
                } 
        }],
        "ajaxParams": {
            "fetch_table_data": true,
        },

    }, {'title': 'Degree classification data for level '+level+' students'})

    //on data loeaded, sort by final_gpa
    table.on("dataProcessed", function(){
        if (table.dataLoadedInitial)
            table.setSort([
                {column: "final_gpa", dir: "dsc"},
                {column: "class", dir: "asc"},
            ])
    })

    table.addChartLink([document.getElementById("degree_classification_chart"), function(table_inner) {
        let table_data = table_inner.getData()
        let classes = ["1st", "2:1", "2:2", "3rd", "Fail"]
        let chart_data = []
        for (let x in classes) {
            chart_data[classes[x]] = 0
        }
        table_data.forEach(function(row){
            chart_data[row.class] = (chart_data[row.class] || 0) + 1;
        })
        return {
            data: {
                labels: classes,
                datasets: [
                    {
                        label: "Number of students",
                        data: Object.values(chart_data),
                        backgroundColor: [c_good, c_good, c_good, c_mid, c_poor],
                    }
                ]
            }
        }
    }])

}

function create_student_course_detailed_table_popup(student_data=null, course_id=null, parent_table_to_reload=null){
    if (student_data?.GUID && course_id) {
        let columns = [
            {title: "Assessment type", field: "type"},
            {title: "Assessment name", field: "name"},
            {title: "Weighting", field: "weighting", bottomCalc: "sum", formatter: "money", formatterParams: {precision: 0, symbol: "%", symbolAfter: true}},
            {title: "Grade", field: "grade", cssClass: "format_grade"},
            {title: "Moderation", field: "moderation", formatter: moderation_formatter},
            {title: "Preponderance", field: "preponderance", cssClass: "edit-mode", formatter: preponderance_formatter, editor: "list", editorParams: {
                values: preponderance_list
            }},
            {title: "AssessmentResult ID", field: "result_id", visible: false},
        ]
    
        let ajaxParams = {
            "fetch_table_data": true,
            "students": true,
            "student_GUID": student_data.GUID,
            "course_id": course_id,
        }
    
        let final_extra_constructor_params = {
            "ajaxParams": ajaxParams,
            "selectable": false,
            "placeholder": "Popup loading...",
            "pagination": false,
            "layout": "fitColumns",
        }
        
        let elt = document.createElement("div")
        document.body.appendChild(elt)
        let table = init_table(elt, columns.map((col) => {
            return {...col, editor: false, cssClass: (col.cssClass=="format_grade" ? "format_grade" : "")}
        }), null, final_extra_constructor_params, settings = {'title': `Student course data`})
        table.getElement().style.marginTop = "10px"
        table.getElement().style.marginBottom = "10px"

        table.addHeading(`Viewing assessment breakdown for <b>${student_data.name}</b>`)
        
        let wrapper = table.getWrapper()
        let popup = Popup.init(wrapper)

        let edit_button = document.createElement("button")
        let table_element = table.getElement()
        edit_button.innerHTML = "Edit preponderance"
        edit_button.addEventListener('click', function(){
            if (table_element.dataset.edit_mode == 1) {
                if (confirm("Are you sure you want to save the changes? - this will overwrite the current preponderance values for this student, and reload the tables on the page.")) {
                    this.innerHTML = "Edit preponderance"
                    table.removeNotification()
                    table_element.dataset.edit_mode = 0
                    table.setColumns(columns.map(col => {
                        return {...col, editor: false, cssClass: (col.cssClass=="format_grade" ? "format_grade" : "")}
                    }))
                    let table_data = table.getData()
                    //api call here to save the data.
                    api_post("update_preponderance", table_data).then(response => {
                        if (response.data) {
                            parent_table_to_reload.reloadTable()
                            popup.close()
                            //TODO: add a success message here
                        } else {
                            alert(response.status)
                        }
                    })
                }
            } else {
                table.addNotification()
                this.innerHTML = "Save changes!"
                table.setColumns(columns)
                console.log(columns)
                table_element.dataset.edit_mode = 1
            }
        })
        popup.content.appendChild(edit_button)
    
    } else {
        alert("Please select a student first!")
    }
    
}

function load_courses_table(extra_constructor_params = {}, extra_cols=true, settings={}){
    let columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", headerHozAlign:"center", headerSort:false, frozen:true},
        {title: "Code", field: "code", headerFilter: "input", frozen:true},
        {title: "Name", field: "name", headerFilter: "input"},
        {title: "Academic year", field: "academic_year"},
        {title: "Credits", field: "credits", bottomCalc: "sum"},
        {title: "Taught now?", field: "is_taught_now", formatter: "tickCross"},
        {title: "Moderated?", field: "is_moderated", formatter: "tickCross"},
    ]

    let groupBy = ['academic_year']
    let initialSort = [{column: 'academic_year', dir: 'dsc'}, {column: 'credits', dir: 'dsc'}]

    if (settings.student) {
        columns.push({
            title: "Student performance",
            headerHozAlign: "center",
            columns: [
                {title: "Coursework grade", field: "coursework_avg", cssClass: "format_grade"},
                {title: "Exam grade", field: "exam_avg", cssClass: "format_grade"},
                {title: "Final weighted grade", field: "final_grade", cssClass: "format_grade"},
            ]
        })
    } else {
        if (extra_cols) {
            columns.push({
                title: "Cohort average performance",
                headerHozAlign: "center",
                columns: [
                    {title: "Coursework grade", field: "coursework_avg", cssClass: "format_grade"},
                    {title: "Exam grade", field: "exam_avg", cssClass: "format_grade"},
                    {title: "Final weighted grade", field: "final_grade", cssClass: "format_grade"},
                ]
            })
            groupBy = []
            initialSort = [{column: 'credits', dir: 'dsc'}]
        }
    }

    let ajaxParams = {
        "fetch_table_data": true,
        "courses": true,
    }
    if (typeof search_term !== "undefined") {
        ajaxParams.search_term = search_term
    }

    let rowContextMenu = [
        {
            label:"View Course Page",
                action:function(e, row){
                    if (typeof row.getData().page_url !== 'undefined') {
                        window.location.href = row.getData().page_url
                    }
                }
        },
        {
            label:"Moderate course grades",
            action:function(e, row){
                render_course_moderation_section(row.getData(), row.getTable())
            }
        }
    ]

    if (settings.student) {
        rowContextMenu.push({
            label:"<div class='inline-icon' title='This action will create a popup where you can see the student grades for all the assessed content for this course. Additionally, you may view and edit the preponderances here.'><img src='/static/icons/info.svg'></i><span>Student grades breakdown popup.</span></div>",
            action: function(e, row){
                create_student_course_detailed_table_popup(settings.student, row.getData().course_id, row.getTable())
            }
        })
    }


    let final_extra_constructor_params = { ...extra_constructor_params,
        ajaxParams: ajaxParams,
        rowContextMenu:rowContextMenu,
        groupBy: groupBy,
        initialSort: initialSort,
        placeholder: "Course data loading...",
    }
    let table = init_table("courses_table", columns, null, final_extra_constructor_params, settings)

    table.on("tableBuilt", function() {
        table.setGroupHeader(function(value, count, data, group){
            if (settings.student) {
                //reduce the "credits" in each row of data
                let course_credits = data.reduce(function(a, b) {
                    return a + b["credits"]
                }, 0)
                return `<span class='info-text'>${count}</span> courses in ${value}, for a total of <span class='${(course_credits < 120) ? "error-color":"success-color"}'>${course_credits} credits<span>`; //return the header contents
            } else {
                return `<span class='info-text'>${count}</span> courses in ${value}`; //return the header contents
            }
        });
    })

    if (settings.student) {
        table.addChartLink([document.getElementById("student_level_chart"), function(table_inner) {
        let student_data = settings.student
        let chart_data = {};
        let year_datas = []

        for (let x = student_data.start_year; x < student_data.end_year; x++) {
            year_datas.push({
                'year': x + 1,
                'level': (student_data.is_faster_router) ? x+1-student_data.start_year : x+1-student_data.start_year + 1,
            })
            // `${student_data.start_year} - level {(student_data.is_faster_router) ? x : x + 1}`
        }

        let grouped_data = table_inner.getCalcResults()
        for (let year in grouped_data) {
            let year_data = grouped_data[year]
            chart_data[year] = {
                'coursework': year_data.bottom.coursework_avg,
                'exam': year_data.bottom.exam_avg,
                'final': parseFloat(year_data.bottom.final_grade).toFixed(1),
            }
        }

        //make abc grades pleasant green color, d grade yellow, and e f g h red
        return {
            data: {
                labels: Object.keys(chart_data),
                datasets: [
                    {
                        label: "Final GPA",
                        data: Object.values(chart_data).map(x => x.final),
                        barPercentage: 0.90,
                        backgroundColor: chart_colors[1],
                    },
                    {
                        label: "Average Coursework GPA",
                        data: Object.values(chart_data).map(x => x.coursework),
                        backgroundColor: chart_colors[4],
                        hidden: true,
                    },
                    {
                        label: "Average Exam GPA",
                        data: Object.values(chart_data).map(x => x.exam),
                        backgroundColor: chart_colors[5],
                        hidden: true,
                    },
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Academic year",
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Final GPA",
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: "Final GPA across all Academic years",
                    }
                }
            }
        }
    }])
    }
    

    table.setReloadFunction(load_courses_table, [extra_constructor_params, extra_cols, settings])

    table.on("dataLoaded", function(data){
        // page_count += 1
        // api(page_count, pagination_size).then(server_data => {
        //     table.addData(server_data.data)
        //     if (page_count < server_data.last_page) {
        //         table.dispatchEvent("dataLoaded") 
        //     } else {
        //         table.dispatchEvent("dataLoadedAll")
        //     }
        // })
        if (typeof chart !== 'undefined') {
            var chart_data = {};
            for (var i = 0; i < data.length; i++) {
                chart_data[data[i].academic_year] = (chart_data[data[i].academic_year] || 0) + 1;
            }
            chart.data.labels = Object.keys(chart_data);
            chart.data.datasets[0].data = Object.values(chart_data);
            chart.update('active');
        }
    })
}

function render_course_moderation_section(course_data, parent_table=null) {
    let course_id = course_data.course_id
    if (!course_id) {
        console.error("Course ID not found")
        return
    }
    let final_extra_constructor_params = {
        ajaxParams: {
            "fetch_table_data": true,
            "assessments": true,
            "course_id": course_id,
        },
        pagination: false,
        placeholder: "Assessment data loading...",
        height: "auto",
    }
    
    let wrapper = string_to_html_element(`
        <div class="moderation-popup">
            <h4>Moderation section for <b>${course_data.name} - ${course_data.academic_year}</b></h4>
            <p>Please select one or multiple assignments, to moderate</p>
            <div id="assessments_table"></div>
            <div id="moderation-input-area" class="disabled moderation-input-area">
                <button id="moderation-increase">Increase bands</button>
                <button id="moderation-decrease">Decrease bands</button>
                <button id="moderation-remove">Remove moderation</button>

                <p>by</p>
                <select id="moderation-value">
                    <option value="0" default>--Select number of bands--</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                </select>
            </div>
        </div>
    `)
    
    document.body.appendChild(wrapper)
    
    let columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", headerSort:false, frozen:true},
        {title: "Assessment type", field: "type"},
        {title: "Assessment name", field: "name"},
        {title: "Weighting", field: "weighting", bottomCalc: "sum", formatter: "money", formatterParams: {precision: 0, symbol: "%", symbolAfter: true}},
        {title: "Current moderation", field: "moderation", headerHozAlign: "center", formatter: moderation_formatter},
        {title: "Moderation User", field: "moderation_user", headerHozAlign: "center"},
        {title: "Moderation Date", field: "moderation_date", headerHozAlign: "center"},
    ]
    let table = init_table("assessments_table", columns, null, final_extra_constructor_params)

    let popup = Popup.init(wrapper)
    console.log(popup)

    const handle_moderation = (mode) => {
        let moderation_value_elt = document.getElementById("moderation-value")
        let moderation_value = moderation_value_elt.options[moderation_value_elt.selectedIndex].value
        if (moderation_value == 0) {
            alert("Please select a number of bands to moderate by")
            return
        }
        api_post("moderation", {"mode": mode, "value": moderation_value, "assessment_ids": table.getSelectedData().map(x => x.id), "course_id": course_id}).then(data => {
            if (data.data) {
                popup.close()
                if (parent_table)
                    parent_table.reloadTable()
            }
             else {
                alert("Error: " + data.status)
            }
        })
    }

    document.getElementById("moderation-increase").addEventListener("click", function() {handle_moderation("increase")})
    document.getElementById("moderation-decrease").addEventListener("click", function() {handle_moderation("decrease")})
    document.getElementById("moderation-remove").addEventListener("click", function() {handle_moderation("remove")})

    table.on("rowSelectionChanged", function(data, rows){
        let input_area = document.getElementById("moderation-input-area")
        if (rows.length > 0) {
            input_area.classList.remove("disabled")
        } else {
            input_area.classList.add("disabled")
        }
    })
    // let table = init_table(table_placeholder, xd, null, final_extra_constructor_params)
    //Please select the assessments that you would like to moderate. You can select one, or  multiple.
    //selected.getRows()...
    //Step 1: select the assessments from the table that you would like to moderate. click next.
    //Step 2: select the moderation rules you would like to apply. click next.
    //Step 3: review page: shows the moderated grades. Are you sure you want to apply these grades? click next.
}


function load_grading_rules_table(data_json){
    let columns = [
        {title: "Name", field: "name", editor: false, clickPopup: "Hello"},
        {title: "Standard lower GPA", field: "std_low_gpa", editor: "number", editorParams: {min: 0, max: 22, step: 0.1}, cssClass: "edit-mode"},
        {title: "Discretionary lower GPA", field: "disc_low_gpa", editor: "number", editorParams: {min: 0, max: 22, step: 0.1}, cssClass: "edit-mode"},
        {title: "Character Band", field: "char_band", visible: false, editor: "list", cssClass: "edit-mode",
            editorParams: {
                values: ["A", "B", "C", "D", "F"]
            }
        },
        {title: "Percentage above", field: "percentage_above", formatter: "money", visible: false, editor:"number", cssClass: "edit-mode", formatterParams: {precision: 0, symbol: "%", symbolAfter: true},
            editorParams: {
                min: 0,
                max: 100,
                step: 1,
            }
        },
    ]

    let final_extra_constructor_params = {
        "selectable": false, 
        "placeholder": "Grading rules loading...",
        "pagination": false,
        footerElement: "<div></div>",
    }
    
    let table = init_table("grading_rules_table", columns.map(
        col => {
            return {...col, editor: false, cssClass: ""}
        }
    ), data_json, final_extra_constructor_params)

    table.on("dataLoaded", function(data){
        let wrapper = table.getWrapper()
        let footer = wrapper.querySelector('.tabulator-footer-contents')
        let edit_button = document.createElement('button')
        let table_element = table.getElement()
        edit_button.innerHTML = "Edit Classification rules"
        edit_button.stored_width = table_element.style.width
        edit_button.addEventListener('click', function(){
            if (table_element.dataset.edit_mode == 1) {
                table.removeNotification()
                this.innerHTML = "Edit Classification rules"
                table_element.dataset.edit_mode = 0

                //increase the width of the table
                table_element.style.width = edit_button.stored_width

                table.setColumns(columns.map(col => {
                    return {...col, editor: false, cssClass: ""}
                }))
                let table_data = table.getData()
                if (JSON.stringify(table_data) === JSON.stringify(data_json)) {
                    console.log("no changes")
                } else {
                    console.log("changes")
                }
                //api call here to save the data.
                let posted_data = {}
                for (i = 1; i < table_data.length + 1; i++) {
                    posted_data[i] = table_data[i - 1]
                }
                api_post("save_grading_rules", posted_data).then(response => {
                    alert(response.status)
                })
            } else {
                table.addNotification()
                this.innerHTML = "Save changes"
                table_element.dataset.edit_mode = 1

                //decrease the width of the table
                // table_element.style.width = edit_button.stored_width
                table_element.style.width = "100%"

                table.setColumns(columns.map(col => {
                    return {...col, visible: true}
                }))
                table.getColumns().forEach(col => {
                    console.log(col.getElement())
                })
            }
        })
        footer.prepend(edit_button)
    })
}

function load_comments_table(data_json){
    let columns = [
        {title: "Comment", field: "comment", vertAlign:"middle", widthGrow: 1},
        {title: "Lecturer", field: "added_by", vertAlign:"middle", minWidth: 200, maxWidth: 300},
        {title: "Date added", field: "timestamp", vertAlign:"middle", width:150},
        {title: "Comment ID", field: "id", visible: false, vertAlign:"middle"}
    ]

    let footer_element = 
        `<div class='comment-table-footer'>
            <textarea type="text" id="comment_input" placeholder="Write your comment here.."></textarea>
            <button id="add_comment_button">Add comment</button>
            <button class="button_warning hidden" id="delete_comments_button">Delete selected comment(s)</button>
        </div>`
    let final_extra_constructor_params = {
        "selectable": true,
        selectableCheck:function(row){
            return user_full_name == "SUPER-ADMIN" || row.getData().added_by == user_full_name; //allow selection of rows where the age is greater than 18
        },
        "pagination": false,
        "layout": "fitColumns",
        "footerElement": footer_element,
        "rowHeight": 60,
        "autoResize": true,
        "height": "100%",
        "index": "id",
        "placeholder":"There are no comments right now. Feel free to add the first comment!",
        rowContextMenu:[
            {
                label:"Delete selected comment(s)",
                    action:function(e, row){
                        let selected_rows = row.getTable().getSelectedRows()
                        let confirm_message = "Are you sure you want to delete this comment?"
                        if (selected_rows.length > 1) {
                            confirm_message = `Are you sure you want to delete these ${selected_rows.length} comments?`
                        }
                        if (confirm(confirm_message)) {
                            api_post("delete_comments", selected_rows.map(
                                row => row.getData().id
                            )).then(response => {
                                if (response.data) {
                                    table.setData(response.data).then(function () {
                                        setTimeout(() => {alert(response.status)}, 10)
                                    })
                                } else {
                                    alert(response.status)
                                }
                            })
                        }
                    }
            },
        ],
    }
    let table = init_table("comments_table", columns, data_json, final_extra_constructor_params, {no_multirow: true})
    table.on("rowSelectionChanged", function(data, rows){
        if (rows.length >= 1) {
            document.getElementById('delete_comments_button').classList.remove("hidden")
        } else {
            document.getElementById('delete_comments_button').classList.add("hidden")
        }
    })

    table.on("tableBuilt", function(){
        let footer = table.getWrapper().querySelector('.tabulator-footer-contents')
        let add_comment_button = footer.querySelector('#add_comment_button')
        let delete_comments_button = footer.querySelector('#delete_comments_button')
        let comment_input = footer.querySelector('#comment_input')
        add_comment_button.addEventListener('click', function(){
            let comment = comment_input.value
            if (comment.length > 0) {
                api_post("add_comment", comment).then(response => {
                    if (response.data) {
                        table.setData(response.data).then(function () {
                            comment_input.value = ""
                            setTimeout(() => {alert(response.status)}, 10)
                        })
                    } else {
                        alert(response.status)
                    }
                })
            } else {
                alert("Please enter a non empty comment.")
            }
        })

        delete_comments_button.addEventListener('click', function(){
            let selected_rows = table.getSelectedRows()
            let confirm_message = "Are you sure you want to delete this comment?"
            if (selected_rows.length > 1) {
                confirm_message = `Are you sure you want to delete these ${selected_rows.length} comments?`
            }
            if (confirm(confirm_message)) {
                api_post("delete_comments", selected_rows.map(
                    row => row.getData().id
                )).then(response => {
                    if (response.data) {
                        table.setData(response.data).then(function () {
                            setTimeout(() => {alert(response.status)}, 10)
                        })
                    } else {
                        alert(response.status)
                    }
                })
            }
        })
    })
}