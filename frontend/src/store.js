import Vuex from 'vuex'
import http from './http'
import Axios from 'axios'
import Vue from 'vue'

Vue.use(Vuex)


const store = new Vuex.Store({
    state: {
        user: null,
        isAuthenticated: false,
        tasks: [],
        levels: [],
        teory_infos: [],
        tests: [],
        task_attempts: [],
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
        },
        setAuthenticated(state, isAuthenticated) {
            state.isAuthenticated = isAuthenticated;
        },
        setTasks(state, tasks) {
            for (let task of tasks) {
                task.reveal = false;
            }
            state.tasks = tasks;
        },
        setLevels(state, levels) {
            state.levels = levels
        },
        setTeoryInfos(state, infos) {
            state.teory_infos = infos;
        },
        setTests(state, tests) {
            state.tests = tests;
        },
        setTaskAttempts(state, attempts) {
            state.task_attempts = attempts;
        }
    },
    actions: {
        async setTasks(context) {
            let response = (await http.getList('Task', {}, true)).data;
            context.commit('setTasks', response);
        },
        async setLevels(context) {
            let response = (await http.getList('Level', {}, true)).data;
            context.commit('setLevels', response);
        },
        async setTeoryInfos(context) {
            let response = (await http.getList('TeoryInfo', {}, true)).data;
            context.commit('setTeoryInfos', response);
        },
        async setTests(context) {
            let response = (await http.getList('Test', {}, true)).data;
            context.commit('setTests', response);
        },
        async setTaskAttempts(context) {
            let response = (await http.getList('TaskAttempt', {}, true)).data;
            context.commit('setTaskAttempts', response);
        },
        async addItem(context, data) {
            let item_data = data.data
            let mutation = data.mutation;
            let response = (await http.createItem(data.url, item_data, true)).data;
            let items = context.state[data.items_name]
            items.push(response);
            context.commit(mutation, items);
        },
        async updateItem(context, data) {
            let item_data = data.data
            let mutation = data.mutation;
            let dataID = data.dataID;
            let response = (await http.updateItem(data.url, dataID, item_data, true)).data;
            let items = context.state[data.items_name]
            let index = items.findIndex(v => v.id == dataID);
            if (index != -1) {
                Vue.set(items, index, response);
            }
            context.commit(mutation, items);
        },
        async login(context, creds) {
            var username = creds.username;
            var password = creds.password;
            var reg_exp_mail = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/
            var login_info = {
                email: username,
                password: password
            }
            if (username.match(reg_exp_mail) != null) {
                login_info = {
                    email: username,
                    password: password
                }
            } else {
                login_info = {
                    username: username,
                    password: password
                }
            }
            var status = false;
            try {
                await (Axios.post("/rest_api/auth/login/", login_info, { headers: { 'X-CSRFToken': Vue.$cookies.get('csrftoken') } }));
                status = true;
            } catch (error) {
                var data = error.response.data;
                if (data.non_field_errors) {
                    Vue.showErrorModal(data.non_field_errors);
                } else {
                    var result = '';
                    for (var k in data) {
                        result += `${k}: ${data[k]}\n`
                    }
                    Vue.showErrorModal(result);
                }
            }
            await context.dispatch('checkAuth');
            return status;
        },
        async logout(context) {
            await Axios.post("/rest_api/auth/logout/", {}, { headers: { 'X-CSRFToken': Vue.$cookies.get('csrftoken') } });
            context.commit('setAuthenticated', false);
            context.commit('setUser', {});
        },
        async checkAuth(context) {
            try {
                var result = await Axios.get("/rest_api/auth/user/");
                if (result.status != 200) {
                    context.commit('setUser', {});
                    return
                }
                context.commit('setAuthenticated', true);
                context.commit('setUser', result.data);
            } catch (e) {
                context.commit('setUser', {});
            }
        },
    }
})

export default store;
