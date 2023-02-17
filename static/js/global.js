function string_to_html_element(html_string) {
    var doc = new DOMParser().parseFromString(html_string, "text/html");
    return doc.body.firstChild
}

function isElement(element) {
    return element instanceof Element || element instanceof HTMLDocument;  
}

function wrap(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    return wrapper;
}

function create_notification(heading="Client notification", message="Notification from the client!", type="warning", timeout=5000) {
    //type can be info, success, warning, error
    close_notification().then(function () {
        let notification = document.querySelector(".notification")
        let extra_header = document.querySelector(".content-extra-header")
        if (extra_header) {
            extra_header.style.visibility = "hidden"
        }
        notification.querySelector('p').innerHTML = message
        notification.querySelector('b').innerHTML = heading
        let img_element = notification.querySelector('img')
        if (img_element.getAttribute("src") != `${img_element.dataset.path}${type}.svg`)
            img_element.setAttribute("src", `${img_element.dataset.path}${type}.svg`)
        notification.classList.add("notification-visible")
        notification.classList.add("notification-" + type)
        //on click - we call the close_notification function, which is called after the timeout. We need to bind the timeout to the function, so we can clear it
        notification.onclick = close_notification.bind(setTimeout(close_notification, timeout))

    })
}

function create_server_notification() { // success, info, warning, error, and none
    //if at least one server message exists - create notifications for all of them
    let server_message = document.getElementById("server_message")
    if (server_message)
        create_notification("Message from the server", server_message.dataset.message, type=server_message.dataset.type, timeout=55000)
}

//this method will safely close the notification, and will return a promise, which will resolve when the notification is completely closed
function close_notification() {
    return new Promise((resolve) => {
        let notification = document.querySelector(".notification")
        if (notification) {
            if (notification.classList.contains("notification-visible")) {
                clearTimeout(this)
                notification.classList.remove("notification-visible")
                //if there is an extra header, we need to wait for the notification to close, and then show the extra header
                let extra_header = document.querySelector(".content-extra-header")
                if (extra_header) {
                    setTimeout(function() {
                        extra_header.style.visibility = "visible"
                    }, 500)
                }
                //we need to wait for the animation to finish, and then set the class to the default value, and resolve the promise
                setTimeout(function() {
                    notification.classList = "notification"
                    resolve()
                }, 750)
            } else {
                // if the notification is not visible, means it is closed, so we can just resolve the promise
                resolve()
            }
        }
    })
}

function toggle_based_on_sidebar_state(sidebar, hardset_state=null) {
    let sidebar_is_collapsed = null
    
    if (hardset_state != null) {
        sidebar_is_collapsed = hardset_state
        setCookie("sidebar_collapsed", sidebar_is_collapsed)
    } else {
        sidebar_is_collapsed = sidebar.classList.contains("sidebar-collapsed")
        let session_sidebar_collapsed = getCookie("sidebar_collapsed")
        if (session_sidebar_collapsed == "true") {
            sidebar_is_collapsed = true
        } else if (session_sidebar_collapsed == "false") {
            sidebar_is_collapsed = false
        } else { //if session is not set
            setCookie("sidebar_collapsed", sidebar_is_collapsed)
        }
    }

    let main_area = document.querySelector(".main-area")
    if (!sidebar_is_collapsed) {
        main_area.classList.add("main-area-collapsed")
        sidebar.classList.remove("sidebar-collapsed")
    } else {
        main_area.classList.remove("main-area-collapsed")
        sidebar.classList.add("sidebar-collapsed")
    }
}

window.onload = function() {
    let sidebar = document.querySelector(".sidebar")
    toggle_based_on_sidebar_state(sidebar)
    let sidebar_toggle_button = document.querySelector(".toggle-sidebar-container")
    if (sidebar && sidebar_toggle_button) {
        sidebar_toggle_button.addEventListener("click", function() {
            let siderbar_collapsed = sidebar.classList.toggle("sidebar-collapsed")
            toggle_based_on_sidebar_state(sidebar, siderbar_collapsed)
        })
    }
}

window.addEventListener("DOMContentLoaded", create_server_notification)

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

//set to expire in 10 minutes
function setCookie(cname, cvalue, exdays=1) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));  
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function api_factory(method) {
    function api(action, data) {
        return new Promise((resolve, reject) => {
            var form_data = new FormData();
            form_data.append("action", action)
            document.querySelectorAll(".api_prefill").forEach(element => {
                form_data.append(element.name, element.value)
            })
            
            if (data)
                form_data.append("data", JSON.stringify(data))
            if (form_data.get("csrfmiddlewaretoken") == null) {
                form_data.append("csrfmiddlewaretoken", getCookie("csrftoken"))
            }
            
            if (method == "GET") {
                const queryString = new URLSearchParams(form_data).toString()
                fetch("/api/?" + queryString, {
                    method: method,
                }).then(response => {
                    if (response.status == 200) {
                        response.json().then(data => {
                            resolve(data)
                        });
                    } else {
                        reject(response)
                    }
                })
                return
            } else if (method == "POST") {
                fetch("/api/", {
                    method: method,
                    body: form_data,
                }).then(response => {
                    if (response.status == 200) {
                        response.json().then(data => {
                            resolve(data)
                        });
                    } else {
                        reject(response)
                    }
                })
                return
            }
        })
    }
    return api
}

const api_post = api_factory("POST")
const api_get = api_factory("GET")

//theme mode switch
// document.querySelector(".btn_toggle").addEventListener("click", function () {
//     if (localStorage.dark_mode) {
//         localStorage.removeItem("dark_mode");
//         document.documentElement.classList.remove("dark-mode-root");
//     } else {
//         localStorage.dark_mode = true;
//         document.documentElement.classList.add("dark-mode-root");
//     }
// });

const Popup = {
    content: null,
    init: function(content) {
        let z_index = 900
        document.querySelectorAll(".popup-wrapper").forEach(element => {
            z_index += 1
        })

        let popup_wrapper = document.createElement("div")
        popup_wrapper.classList.add("popup-wrapper")
        popup_wrapper.style.zIndex = z_index
        
        let popup_inner = document.createElement("div")
        popup_inner.classList.add("popup-inner")
        
        popup_wrapper.appendChild(popup_inner)
        let main_body = document.querySelector(".body-inner-wrapper")
        main_body.classList.add("disabled-body")
        
        let close_button = document.createElement("button")
        close_button.classList = "popup-close-button button_default"
        close_button.innerHTML = "Close"
        close_button.onclick = () => {this.close()} //use arrow function to bind this to the popup object
        popup_inner.appendChild(close_button)
        
        window.onclick = (e) => {
            let found_wrapper = document.querySelector(".popup-wrapper")
            if (!found_wrapper) return
            if (e.target == found_wrapper || e.target == found_wrapper.querySelector(".popup-close-button")) {
                this.close()
            }
        }

        popup_inner.appendChild(content)
        document.body.prepend(popup_wrapper)
        this.content = content
        return this
    },
    close: function() {
        let wrapper = document.querySelector(".popup-wrapper")
        if (wrapper) wrapper.remove()
        
        if (!document.querySelector(".popup-wrapper"))
            document.querySelector(".body-inner-wrapper").classList.remove("disabled-body")
        
        delete this
    },
}

//chart to chart handler map. say table is reloaded - chart needs to be reloaded.
//as soon as table has data - chart needs to be initialized.

//a function that takes a tables data, and returns chart data object.

const Charts = {
    init: function(chart_or_chart_id=null, type=null, data={}, options={}) {
        let chart = chart_or_chart_id
        if (chart == null) {
            chart = document.createElement("canvas")
        } else {
            chart = (isElement(chart)) ? chart : document.getElementById(chart)
        }
        
        console.log("initializing chart")
        this.chart = new Chart(chart, {
            type: (type) ? type : 'bar',
            data: (data) ? data : {
                labels: [],
                datasets: [
                    {
                        label: 'Number of courses offered in a given year',
                        data: [],
                    }
                ]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        
        console.log("chart initialized")
        return this
    },
    chart: null,
    load_with_table_data: function(table, population_function) {
        console.log("loading chart with table data")
        console.log(table)
        let data = population_function(table)
        console.log(data)
        console.log(this.chart)
        //population_function is a function that takes a table data object, and returns chart data object.
        this.chart.data = population_function(table)
        this.chart.update('active')
        console.log("done!")
    },
    destroy: function() {
        this.chart.destroy()
    }
}


//MOSCOW CHARTS PLAN.

//today: Create chart system. Add simple charts to every page.
//my own
//degree classification: 
// degree qualification distribution

// course page:
// final grade distribution
// average grade per assignment distribution

// student page:
// 

// dashboard (given year):
// all courses offered in that year
// all students in that year
// 

//moscow
//1. grades below band d3 -> in course page, we have final grade. we can use that to show the grade distribution.

// 

//note that dashboard should be year by year. for sure.
// percentage of students in a grade band, in a particular YEAR.