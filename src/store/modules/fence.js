const fence={
    state:{
        fences:[],
    },
    mutations:{
        SET_FENCES:(state,value)=>{
            state.fences=value;
        }
    },
    actions:{
        addFences({state,commit},value){
            let data=[...state.fences, value];
            commit("SET_FENCES",data);
        }
    }
};

export default fence