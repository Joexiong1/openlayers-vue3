import { createStore } from 'vuex';


import fence from "./modules/fence";
import getters from "./getters";


const store=createStore({
    modules:{
        fence,
    },
    getters,
})

export default store